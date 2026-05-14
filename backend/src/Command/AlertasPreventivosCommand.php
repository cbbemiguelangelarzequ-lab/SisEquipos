<?php

namespace App\Command;

use App\Repository\PlanMantenimientoPreventivoRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:alertas-preventivos',
    description: 'Muestra los planes de mantenimiento preventivo vencidos o próximos a vencer.'
)]
class AlertasPreventivosCommand extends Command
{
    public function __construct(
        private PlanMantenimientoPreventivoRepository $planRepo
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption(
            'dias',
            'd',
            InputOption::VALUE_OPTIONAL,
            'Días de anticipación para alertas de vencimiento próximo',
            7
        );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dias = (int) $input->getOption('dias');

        $io->title("🔧 Alertas de Mantenimiento Preventivo (anticipación: {$dias} días)");

        $planes = $this->planRepo->findVencidosYProximos($dias);

        if (empty($planes)) {
            $io->success("No hay planes vencidos ni próximos a vencer en los próximos {$dias} días.");
            return Command::SUCCESS;
        }

        $vencidos = [];
        $proximos = [];

        foreach ($planes as $plan) {
            if ($plan->isVencido()) {
                $vencidos[] = $plan;
            } else {
                $proximos[] = $plan;
            }
        }

        if (!empty($vencidos)) {
            $io->section('⚠️  Planes VENCIDOS (requieren atención inmediata)');
            $rows = [];
            foreach ($vencidos as $p) {
                $rows[] = [
                    'PLAN-' . str_pad($p->getId(), 4, '0', STR_PAD_LEFT),
                    $p->getEquipo()?->getNombre() ?? '-',
                    $p->getEquipo()?->getCodigoInventario() ?? '-',
                    $p->getFechaProximoMantenimiento()?->format('d/m/Y') ?? '-',
                    $p->getDiasRestantes() . ' días',
                    $p->getPrioridad() ?? 'Media',
                ];
            }
            $io->table(['Plan', 'Equipo', 'Código Inv.', 'Fecha Prog.', 'Retraso', 'Prioridad'], $rows);
        }

        if (!empty($proximos)) {
            $io->section('🔔 Planes PRÓXIMOS a vencer');
            $rows = [];
            foreach ($proximos as $p) {
                $rows[] = [
                    'PLAN-' . str_pad($p->getId(), 4, '0', STR_PAD_LEFT),
                    $p->getEquipo()?->getNombre() ?? '-',
                    $p->getEquipo()?->getCodigoInventario() ?? '-',
                    $p->getFechaProximoMantenimiento()?->format('d/m/Y') ?? '-',
                    $p->getDiasRestantes() . ' días',
                    $p->getFrecuencia(),
                ];
            }
            $io->table(['Plan', 'Equipo', 'Código Inv.', 'Fecha Prog.', 'Quedan', 'Frecuencia'], $rows);
        }

        $io->note(sprintf(
            'Resumen: %d vencido(s), %d próximo(s) a vencer.',
            count($vencidos),
            count($proximos)
        ));

        return Command::SUCCESS;
    }
}
