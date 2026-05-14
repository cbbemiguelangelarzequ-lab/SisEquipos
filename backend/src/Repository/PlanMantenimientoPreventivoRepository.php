<?php

namespace App\Repository;

use App\Entity\PlanMantenimientoPreventivo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

// @extends ServiceEntityRepository<PlanMantenimientoPreventivo>
class PlanMantenimientoPreventivoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PlanMantenimientoPreventivo::class);
    }

    // Devuelve todos los planes activos cuya fecha próxima ya venció
// o vence dentro de los próximos $diasAnticipacion días.
    public function findVencidosYProximos(int $diasAnticipacion = 7): array
    {
        $hoy = new \DateTime();
        $hoy->setTime(0, 0, 0);
        $limite = (clone $hoy)->modify("+{$diasAnticipacion} days");

        return $this->createQueryBuilder('p')
            ->leftJoin('p.equipo', 'e')
            ->addSelect('e')
            ->where('p.estado = :activo')
            ->andWhere('p.fechaProximoMantenimiento <= :limite')
            ->setParameter('activo', 'Activo')
            ->setParameter('limite', $limite)
            ->orderBy('p.fechaProximoMantenimiento', 'ASC')
            ->getQuery()
            ->getResult();
    }

    // Devuelve los planes de un centro específico ordenados por urgencia.
    public function findByCentroOrdenados(int $centroId): array
    {
        return $this->createQueryBuilder('p')
            ->leftJoin('p.equipo', 'e')
            ->addSelect('e')
            ->where('e.centro = :centro')
            ->andWhere('p.estado = :activo')
            ->setParameter('centro', $centroId)
            ->setParameter('activo', 'Activo')
            ->orderBy('p.fechaProximoMantenimiento', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
