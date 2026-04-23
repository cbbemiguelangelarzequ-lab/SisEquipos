<?php

namespace App\Command;

use App\Entity\Equipo;
use App\Entity\TipoComponente;
use App\Entity\ComponenteEquipo;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:extraer-componentes',
    description: 'Extrae hardware descrito en el nombre del equipo hacia componentes (Sin modificar nombre original).'
)]
class ExtraerComponentesCommand extends Command
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em)
    {
        parent::__construct();
        $this->em = $em;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        
        $equipos = $this->em->getRepository(Equipo::class)->findAll();
        
        $tipos = [
            'Procesador' => $this->getTipoOrCreate('Procesador'),
            'RAM' => $this->getTipoOrCreate('Memoria RAM'),
            'HDD' => $this->getTipoOrCreate('Disco Duro (HDD)'),
            'SSD' => $this->getTipoOrCreate('Unidad Sólida (SSD)'),
            'DVD' => $this->getTipoOrCreate('Unidad Óptica / DVD')
        ];

        $modificados = 0;

        foreach ($equipos as $equipo) {
            $nombreBusqueda = $equipo->getNombre();
            if (!$nombreBusqueda) continue;

            $componentesData = [];

            // Regex RAM
            if (preg_match('/([0-9]+\s*(?:GB|MB|MG))\s*RAM/i', $nombreBusqueda, $matches)) {
                $componentesData['RAM'] = trim($matches[1]);
                $nombreBusqueda = str_replace($matches[0], '', $nombreBusqueda);
            } elseif (preg_match('/RAM\s*:?,?-?\s*([0-9]+\s*(?:GB|MB)\s*DDR[0-9]?|[0-9]+\s*(?:GB|MB))/i', $nombreBusqueda, $matches)) {
                $componentesData['RAM'] = trim(trim($matches[1], ',- '));
                $nombreBusqueda = str_replace($matches[0], '', $nombreBusqueda);
            }

            // Regex Disco
            if (preg_match('/(?:HDD|SSD|DISCO DURO|HD)\s*:?-?\s*([0-9]+\s*(?:GB|TB))/i', $nombreBusqueda, $matches)) {
                $type = stripos($matches[0], 'SSD') !== false ? 'SSD' : 'HDD';
                $componentesData[$type] = trim($matches[1]);
                $nombreBusqueda = str_replace($matches[0], '', $nombreBusqueda);
            } elseif (preg_match('/([0-9]+\s*(?:GB|TB))\s*(?:HDD|SSD)/i', $nombreBusqueda, $matches)) {
                $type = stripos($matches[0], 'SSD') !== false ? 'SSD' : 'HDD';
                $componentesData[$type] = trim($matches[1]);
                $nombreBusqueda = str_replace($matches[0], '', $nombreBusqueda);
            }

            // DVD
            if (preg_match('/(CON\s+(?:LECTOR|QUEMADOR)\s+DE\s+DVD|DVD\.|DVD)/i', $nombreBusqueda, $matches)) {
                $componentesData['DVD'] = 'Lector / Quemador Automático';
                $nombreBusqueda = str_replace($matches[0], '', $nombreBusqueda);
            }

            // Procesador
            if (preg_match('/PROCESADOR\s*:?\s*([^,;-]?(?:.*?GHZ|.*?Ghz|.*?[0-9]{4}|.*?CELERON|.*?DUO|.*?i[357]|.*?PENTIUM[ A-ZIVX0-9]+|.*?AMD[ A-Z0-9]+))(?:[,\s-]|$)/i', $nombreBusqueda, $matches)) {
                $componentesData['Procesador'] = trim(trim($matches[1], ',- :;'));
            } else if (preg_match('/PROCESADOR\s*:?\s*(.*?)(?:-|,|S\/N|$)/i', $nombreBusqueda, $matches)) {
                $componentesData['Procesador'] = trim(trim($matches[1], ',- :;'));
            }

            if (!empty($componentesData)) {
                $insertedForThis = false;
                
                foreach ($componentesData as $key => $val) {
                    // Unique constraint logic
                    $existente = $this->em->getRepository(ComponenteEquipo::class)->findOneBy([
                        'equipo' => $equipo,
                        'tipoComponente' => $tipos[$key]
                    ]);

                    if (!$existente) {
                        $comp = new ComponenteEquipo();
                        $comp->setEquipo($equipo);
                        $comp->setTipoComponente($tipos[$key]);
                        $comp->setDescripcion(substr($val, 0, 255));
                        $comp->setEstado('Instalado');
                        $comp->setFechaInstalacion(new \DateTime());
                        $this->em->persist($comp);
                        $insertedForThis = true;
                    }
                }

                if ($insertedForThis) {
                    $modificados++;
                    if ($modificados % 50 === 0) {
                        $this->em->flush();
                    }
                }
            }
        }

        $this->em->flush();

        $io->success("Finalizado. Se leyeron e insertaron componentes silenciosamente en $modificados equipos.");
        return Command::SUCCESS;
    }

    private function getTipoOrCreate(string $nombre): TipoComponente
    {
        $repo = $this->em->getRepository(TipoComponente::class);
        $tipo = $repo->findOneBy(['nombre' => $nombre]);
        if (!$tipo) {
            $tipo = new TipoComponente();
            $tipo->setNombre($nombre);
            $this->em->persist($tipo);
            $this->em->flush();
        }
        return $tipo;
    }
}
