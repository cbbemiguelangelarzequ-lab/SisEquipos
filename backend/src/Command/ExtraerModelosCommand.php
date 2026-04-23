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
    name: 'app:extraer-modelos',
    description: 'Extrae el texto de "MODELO" y "SERIE" contenido en el nombre del equipo, limpiándolo.'
)]
class ExtraerModelosCommand extends Command
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

            // Extraer Modelo
            if (preg_match('/(?:MODELO|MOD)\s*:\s*(.*?)(?=\s+SERIE:|\s+Nº|\s+SERIE|S\/N|$)/i', $nombre, $matches)) {
                $modelo = trim($matches[1], ',- :;.');
                $nombre = str_replace($matches[0], '', $nombre);
                
                // Set only if no model originally, or if model was 'S/M'
                if (!$equipo->getModelo() || $equipo->getModelo() === 'S/M') {
                    $equipo->setModelo(substr($modelo, 0, 100));
                }
                $changed = true;
            }

            // Extraer Serie (Y borrarla del nombre)
            if (preg_match('/(?:Nº DE SERIE|SERIE|S\/N)\s*:\s*([a-zA-Z0-9\-\/\.]+)/i', $nombre, $matches)) {
                $serie = trim($matches[1], ',- :;.');
                $nombre = str_replace($matches[0], '', $nombre);
                
                // Set only if no serie originally, or if serie was 'S/N'
                if (!$equipo->getNumeroSerie() || $equipo->getNumeroSerie() === 'S/N') {
                    $equipo->setNumeroSerie(substr($serie, 0, 100));
                }
                $changed = true;
            }

            if ($changed) {
                // Limpieza de espacios y conectores residuales
                $nombre = preg_replace('/(?:\s*-\s*)+/', '-', $nombre);
                $nombre = preg_replace('/(?:,\s*)+/', ', ', $nombre);
                // Quitar final con guion o coma o la palabra MODELO si quedó suelta
                $nombre = str_replace('MODELO', '', $nombre);
                $nombre = str_replace('SERIE', '', $nombre);
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

        $io->success("Se han corregido y extraído los Modelos/Series de $modificados equipos.");
        return Command::SUCCESS;
    }
}
