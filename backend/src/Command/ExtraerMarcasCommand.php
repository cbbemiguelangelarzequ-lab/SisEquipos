<?php

namespace App\Command;

use App\Entity\Equipo;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:extraer-marcas',
    description: 'Extrae el texto de la MARCA contenido en el nombre del equipo, limpiándolo.'
)]
class ExtraerMarcasCommand extends Command
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
        $modificados = 0;

        foreach ($equipos as $equipo) {
            $nombre = $equipo->getNombre();
            if (!$nombre) continue;

            $changed = false;

            // Extraer Marca
            if (preg_match('/(?:MARCA|Marca)\s*:?\s*([a-zA-Z0-9]+)/', $nombre, $matches)) {
                $marcaStr = trim($matches[1]);
                $nombre = str_replace($matches[0], '', $nombre);

                // Reemplazamos si estaba en S/M o vacía
                if (!$equipo->getMarca() || $equipo->getMarca() === 'S/M') {
                    $equipo->setMarca(strtoupper(substr($marcaStr, 0, 100)));
                }
                $changed = true;
            } elseif (preg_match('/"([^"]+)"/', $nombre, $matches)) {
                // Sacar marcas que estén entre comillas como "SAMSUNG" o "DELUX"
                $marcaStr = trim($matches[1]);
                // Las ignoramos si son comillas sobre nombres genéricos o dimensiones
                if (strtolower($marcaStr) !== 'apple' && strlen($marcaStr) < 2) {
                    continue; 
                }

                $nombre = str_replace($matches[0], '', $nombre);
                
                if (!$equipo->getMarca() || $equipo->getMarca() === 'S/M') {
                    $equipo->setMarca(strtoupper(substr($marcaStr, 0, 100)));
                }
                $changed = true;
            }

            if ($changed) {
                // Limpieza rapida
                $nombre = preg_replace('/(?:\s*,\s*)+/', ', ', $nombre);
                $nombre = preg_replace('/(?:\s*-\s*)+/', '-', $nombre);
                $nombre = trim($nombre, ' ,-.:"');

                $equipo->setNombre($nombre);
                $this->em->persist($equipo);
                $modificados++;

                if ($modificados % 50 === 0) {
                    $this->em->flush();
                }
            }
        }

        $this->em->flush();

        $io->success("Se han extraído las Marcas embebidas y limpiado nombres de $modificados equipos.");
        return Command::SUCCESS;
    }
}
