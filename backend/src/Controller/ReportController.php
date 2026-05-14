<?php

namespace App\Controller;

use App\Entity\TransferenciaActivo;
use App\Entity\HistorialMantenimiento;
use App\Entity\Equipo;
use Doctrine\ORM\EntityManagerInterface;
use Dompdf\Dompdf;
use Dompdf\Options;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ReportController extends AbstractController
{
    #[Route('/api/reportes/transferencia/{id}', name: 'reporte_transferencia', methods: ['GET'])]
    public function generarReporteTransferencia(int $id, EntityManagerInterface $em): Response
    {
        $transferencia = $em->getRepository(TransferenciaActivo::class)->find($id);

        if (!$transferencia) {
            return new Response('Transferencia no encontrada.', Response::HTTP_NOT_FOUND);
        }

        // Render HTML from Twig template
        $html = $this->renderView('report/transferencia.html.twig', [
            'transferencia' => $transferencia,
            'items' => $transferencia->getItems()
        ]);

        // Configure Dompdf
        $options = new Options();
        $options->set('defaultFont', 'Helvetica');
        $options->set('isRemoteEnabled', true); // allow images/css from URLs

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('letter', 'portrait');
        $dompdf->render();

        // Output the generated PDF to Browser
        return new Response(
            $dompdf->output(),
            Response::HTTP_OK,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="formulario_transferencia_' . $transferencia->getId() . '.pdf"'
            ]
        );
    }

    #[Route('/api/reportes/mantenimiento/{id}', name: 'reporte_mantenimiento', methods: ['GET'])]
    public function generarReporteMantenimiento(int $id, EntityManagerInterface $em): Response
    {
        $historial = $em->getRepository(HistorialMantenimiento::class)->find($id);

        if (!$historial) {
            return new Response('Mantenimiento no encontrado.', Response::HTTP_NOT_FOUND);
        }

        $html = $this->renderView('report/mantenimiento.html.twig', [
            'historial' => $historial,
            'equipo' => $historial->getEquipo()
        ]);

        $options = new Options();
        $options->set('defaultFont', 'Helvetica');
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('letter', 'portrait');
        $dompdf->render();

        return new Response(
            $dompdf->output(),
            Response::HTTP_OK,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="informe_mantenimiento_' . $historial->getId() . '.pdf"'
            ]
        );
    }

    #[Route('/api/reportes/inventario', name: 'reporte_inventario', methods: ['POST'])]
    public function generarReporteInventario(Request $request, EntityManagerInterface $em): Response
    {
        // Dompdf consume mucha memoria con tablas grandes — aumentar límite para este endpoint
        ini_set('memory_limit', '512M');

        $data = json_decode($request->getContent(), true);
        $equiposIds = $data['equipos'] ?? [];

        // Limitar a 500 equipos por reporte para evitar OOM con dompdf
        $MAX_EQUIPOS = 500;

        if (empty($equiposIds)) {
            $equipos = [];
        } else {
            // Tomar solo los primeros 500 IDs para evitar crash por falta de memoria
            $idsLimitados = array_slice($equiposIds, 0, $MAX_EQUIPOS);
            $equipos = $em->getRepository(Equipo::class)->findBy(['id' => $idsLimitados]);
        }

        $html = $this->renderView('report/inventario.html.twig', [
            'equipos'    => $equipos,
            'searchTerm' => $data['searchTerm'] ?? null,
            'fecha'      => new \DateTime(),
            'totalOriginal' => count($equiposIds),
            'limitado'   => count($equiposIds) > $MAX_EQUIPOS,
            'maxEquipos' => $MAX_EQUIPOS,
        ]);

        $options = new Options();
        $options->set('defaultFont', 'Helvetica');
        $options->set('isRemoteEnabled', false); // false = más rápido, no necesita recursos externos

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('letter', 'landscape');
        $dompdf->render();

        return new Response(
            $dompdf->output(),
            Response::HTTP_OK,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="inventario_equipos.pdf"'
            ]
        );
    }

    #[Route('/api/reportes/mantenimientos-periodo', name: 'reporte_mantenimientos_periodo', methods: ['POST'])]
    public function generarReporteMantenimientosPeriodo(Request $request, EntityManagerInterface $em): Response
    {
        ini_set('memory_limit', '512M');
        $data = json_decode($request->getContent(), true);
        $periodo = $data['periodo'] ?? 'mensual';
        $centroId = $data['centroId'] ?? null;
        $tipo = $data['tipo'] ?? 'tecnico'; // 'tecnico' o 'imagenes'

        $now = new \DateTime();
        $startDate = match ($periodo) {
            'trimestral' => (clone $now)->modify('-3 months'),
            'semestral' => (clone $now)->modify('-6 months'),
            'anual' => (clone $now)->modify('-1 year'),
            default => (clone $now)->modify('-1 month'),
        };

        $qb = $em->createQueryBuilder()
            ->select('h')
            ->from(HistorialMantenimiento::class, 'h')
            ->where('h.fechaMantenimiento >= :start')
            ->setParameter('start', $startDate);

        if ($centroId) {
            $qb->join('h.equipo', 'e')
               ->andWhere('e.centro = :centroId')
               ->setParameter('centroId', $centroId);
        }

        $qb->orderBy('h.fechaMantenimiento', 'DESC');
        $historiales = $qb->getQuery()->getResult();

        $template = $tipo === 'imagenes' ? 'report/mantenimientos_periodo_imagenes.html.twig' : 'report/mantenimientos_periodo.html.twig';

        $evidenciasMap = [];
        $costosMap = [];
        $reemplazoRepo = $em->getRepository(\App\Entity\ReemplazoComponente::class);
        
        if ($tipo === 'imagenes') {
            $evRepo = $em->getRepository(\App\Entity\EvidenciaMantenimiento::class);
        }

        foreach ($historiales as $h) {
            // Calculate dynamic cost based on components
            $reemplazos = $reemplazoRepo->findBy(['historialMantenimiento' => $h]);
            $totalCosto = 0;
            foreach ($reemplazos as $rem) {
                if ($rem->getRepuestoUtilizado() && $rem->getRepuestoUtilizado()->getPrecio()) {
                    $totalCosto += (float) $rem->getRepuestoUtilizado()->getPrecio();
                }
            }
            $costosMap[$h->getId()] = $totalCosto;

            if ($tipo === 'imagenes') {
                $evidenciasMap[$h->getId()] = $evRepo->findBy(['historial' => $h]);
            }
        }

        $html = $this->renderView($template, [
            'historiales' => $historiales,
            'evidenciasMap' => $evidenciasMap,
            'costosMap' => $costosMap,
            'periodo' => $periodo,
            'fechaInicio' => $startDate,
            'fechaFin' => $now,
            'centro' => $centroId ? $em->getRepository(\App\Entity\Centro::class)->find($centroId) : null
        ]);

        $options = new Options();
        $options->set('defaultFont', 'Helvetica');
        $options->set('isRemoteEnabled', true); 

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('letter', 'portrait');
        $dompdf->render();

        return new Response(
            $dompdf->output(),
            Response::HTTP_OK,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="reporte_mantenimientos_'.$periodo.'.pdf"'
            ]
        );
    }

    #[Route('/api/reportes/transferencias-periodo', name: 'reporte_transferencias_periodo', methods: ['POST'])]
    public function generarReporteTransferenciasPeriodo(Request $request, EntityManagerInterface $em): Response
    {
        ini_set('memory_limit', '512M');
        $data = json_decode($request->getContent(), true);
        $periodo = $data['periodo'] ?? 'mensual';
        $centroId = $data['centroId'] ?? null;

        $now = new \DateTime();
        $startDate = match ($periodo) {
            'trimestral' => (clone $now)->modify('-3 months'),
            'semestral' => (clone $now)->modify('-6 months'),
            'anual' => (clone $now)->modify('-1 year'),
            default => (clone $now)->modify('-1 month'),
        };

        $qb = $em->createQueryBuilder()
            ->select('t')
            ->from(TransferenciaActivo::class, 't')
            ->where('t.fechaTransferencia >= :start')
            ->setParameter('start', $startDate);

        if ($centroId) {
            $qb->andWhere('t.centroOrigen = :centroId OR t.centroDestino = :centroId')
               ->setParameter('centroId', $centroId);
        }

        $qb->orderBy('t.fechaTransferencia', 'DESC');
        $transferencias = $qb->getQuery()->getResult();

        $html = $this->renderView('report/transferencias_periodo.html.twig', [
            'transferencias' => $transferencias,
            'periodo' => $periodo,
            'fechaInicio' => $startDate,
            'fechaFin' => $now,
            'centro' => $centroId ? $em->getRepository(\App\Entity\Centro::class)->find($centroId) : null
        ]);

        $options = new Options();
        $options->set('defaultFont', 'Helvetica');
        $options->set('isRemoteEnabled', false);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('letter', 'landscape');
        $dompdf->render();

        return new Response(
            $dompdf->output(),
            Response::HTTP_OK,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="reporte_transferencias_'.$periodo.'.pdf"'
            ]
        );
    }

    #[Route('/api/reportes/repuestos-periodo', name: 'reporte_repuestos_periodo', methods: ['POST'])]
    public function generarReporteRepuestosPeriodo(Request $request, EntityManagerInterface $em): Response
    {
        ini_set('memory_limit', '512M');
        $data = json_decode($request->getContent(), true);
        $periodo = $data['periodo'] ?? 'mensual';
        $centroId = $data['centroId'] ?? null;

        $now = new \DateTime();
        $startDate = match ($periodo) {
            'trimestral' => (clone $now)->modify('-3 months'),
            'semestral' => (clone $now)->modify('-6 months'),
            'anual' => (clone $now)->modify('-1 year'),
            default => (clone $now)->modify('-1 month'),
        };

        $qb = $em->createQueryBuilder()
            ->select('r')
            ->from(\App\Entity\RepuestoInventario::class, 'r')
            ->where('r.fechaIngreso >= :start')
            ->setParameter('start', $startDate);

        if ($centroId) {
            $qb->andWhere('r.centro = :centroId')
               ->setParameter('centroId', $centroId);
        }

        $qb->orderBy('r.fechaIngreso', 'DESC');
        $repuestos = $qb->getQuery()->getResult();

        $html = $this->renderView('report/repuestos_periodo.html.twig', [
            'repuestos' => $repuestos,
            'periodo' => $periodo,
            'fechaInicio' => $startDate,
            'fechaFin' => $now,
            'centro' => $centroId ? $em->getRepository(\App\Entity\Centro::class)->find($centroId) : null
        ]);

        $options = new Options();
        $options->set('defaultFont', 'Helvetica');
        $options->set('isRemoteEnabled', false);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('letter', 'portrait');
        $dompdf->render();

        return new Response(
            $dompdf->output(),
            Response::HTTP_OK,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="reporte_repuestos_'.$periodo.'.pdf"'
            ]
        );
    }

    #[Route('/api/reportes/equipo/{id}/ficha-tecnica', name: 'reporte_ficha_tecnica', methods: ['GET'])]
    public function generarFichaTecnica(int $id, EntityManagerInterface $em): Response
    {
        $equipo = $em->getRepository(Equipo::class)->find($id);

        if (!$equipo) {
            return new Response('Equipo no encontrado.', Response::HTTP_NOT_FOUND);
        }

        $componentes = $em->getRepository(\App\Entity\ComponenteEquipo::class)->findBy(['equipo' => $equipo]);
        
        $historiales = $em->getRepository(HistorialMantenimiento::class)->findBy(
            ['equipo' => $equipo],
            ['fechaMantenimiento' => 'DESC']
        );

        // Fetch transfer items, sort by id descending roughly gets latest transfers first or sort manually
        $transferencias = $em->getRepository(\App\Entity\TransferenciaItem::class)->findBy(
            ['equipo' => $equipo],
            ['id' => 'DESC']
        );

        $html = $this->renderView('report/ficha_tecnica.html.twig', [
            'equipo' => $equipo,
            'componentes' => $componentes,
            'historiales' => $historiales,
            'transferencias' => $transferencias,
            'fecha' => new \DateTime(),
        ]);

        $options = new Options();
        $options->set('defaultFont', 'Helvetica');
        $options->set('isRemoteEnabled', true); 

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('letter', 'portrait');
        $dompdf->render();

        return new Response(
            $dompdf->output(),
            Response::HTTP_OK,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="ficha_tecnica_' . $equipo->getId() . '.pdf"'
            ]
        );
    }
}
