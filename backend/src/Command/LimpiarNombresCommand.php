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
    name: 'app:limpiar-nombres',
    description: 'Elimina las marcas y modelos del campo Nombre de los equipos para evitar redundancia en el UI.'
)]
class LimpiarNombresCommand extends Command
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
            $nombre = trim((string)$equipo->getNombre());
            if (!$nombre) continue;

            $marca = trim((string)$equipo->getMarca());
            $modelo = trim((string)$equipo->getModelo());
            
            $cleanName = $nombre;

            // Remove Marca if valid
            if ($marca && $marca !== 'S/M' && strlen($marca) > 1) {
                // Remove whole words, case insensitive
                $cleanName = preg_replace("/\b" . preg_quote($marca, '/') . "\b/i", '', $cleanName);
            }
            
            // Remove Modelo if valid
            if ($modelo && $modelo !== 'S/M' && strlen($modelo) > 1) {
                $cleanName = str_ireplace($modelo, '', $cleanName);
            }

            if ($cleanName !== $nombre) {
                // Clean up extra spaces, dashes or commas leftover
                $cleanName = preg_replace('/\s+/', ' ', $cleanName);
                $cleanName = preg_replace('/^\W+|\W+$/', '', $cleanName); // remove leading/trailing non-word
                $cleanName = trim($cleanName, ' ,-.:"');

                // If somehow the string became empty, keep the original to avoid blank names
                if (!empty($cleanName)) {
                    $equipo->setNombre($cleanName);
                    $this->em->persist($equipo);
                    $modificados++;

                    if ($modificados % 50 === 0) {
                        $this->em->flush();
                    }
                }
            }
        }

        $this->em->flush();

        $io->success("Se limpiaron las marcas/modelos redundantes de los nombres de $modificados equipos.");
        return Command::SUCCESS;
    }
}
