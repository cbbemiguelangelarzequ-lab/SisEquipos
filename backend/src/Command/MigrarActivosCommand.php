<?php

namespace App\Command;

use App\Entity\CategoriaEquipo;
use App\Entity\Centro;
use App\Entity\Equipo;
use App\Entity\EstadoEquipo;
use App\Entity\Seccion;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:migrar-activos',
    description: 'Migra datos desde el archivo activo SQL hacia la BD actual.',
)]
class MigrarActivosCommand extends Command
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $conn = $this->em->getConnection();

        $io->title('Iniciando Migración de Activos');

        // 1. Correr el SQL para crear la tabla activa temporal y llenarla
        $sqlPath = __DIR__ . '/../../../Database/activos_05_07.sql';
        if (!file_exists($sqlPath)) {
            $io->error("No se encontró el archivo SQL en $sqlPath");
            return Command::FAILURE;
        }

        $io->text("Leyendo e inyectando scripts SQL temporalmente...");
        $lines = file($sqlPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        $conn->executeStatement('DROP TABLE IF EXISTS activo');
        
        $createTableSql = "
        CREATE TABLE `activo` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `regional` varchar(50) DEFAULT NULL,
          `unidad` varchar(255) DEFAULT NULL,
          `ubicacion` varchar(255) DEFAULT NULL,
          `fecha` date DEFAULT NULL,
          `cuenta` varchar(100) DEFAULT NULL,
          `codigo` varchar(50) DEFAULT NULL,
          `codigo_nuevo` varchar(25) DEFAULT NULL,
          `detalle` varchar(10000) DEFAULT NULL,
          `activo` tinyint(1) DEFAULT 1,
          `observacion` varchar(255) DEFAULT NULL,
          `created_date` datetime DEFAULT NULL,
          `updated_date` datetime DEFAULT NULL,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        $conn->executeStatement($createTableSql);

        $io->text("Inyectando registros en la tabla temporal activo...");
        foreach ($lines as $line) {
            $trimLine = trim($line);
            if (str_starts_with($trimLine, 'INSERT INTO')) {
                $conn->executeStatement($trimLine);
            }
        }
        
        $io->success("Estructura de tabla temporal recreada e inserts ejecutados.");

        // Obtenemos los activos cargados
        $activosInfo = $conn->fetchAllAssociative('SELECT * FROM activo');
        $io->text('Equipos identificados en el script: ' . count($activosInfo));

        // Preparar repositorios y referencias estáticas
        $centroRep = $this->em->getRepository(Centro::class);
        $seccionRep = $this->em->getRepository(Seccion::class);
        $categoriaRep = $this->em->getRepository(CategoriaEquipo::class);
        $estadoRep = $this->em->getRepository(EstadoEquipo::class);
        $equipoRep = $this->em->getRepository(Equipo::class);

        // Estado predeterminado Operativo = ID 1, o crearlo
        $estadoOperativo = $estadoRep->find(1) ?? $estadoRep->findOneBy(['nombre' => 'Operativo']);
        if (!$estadoOperativo) {
            $estadoOperativo = new EstadoEquipo();
            $estadoOperativo->setNombre('Operativo');
            $this->em->persist($estadoOperativo);
            $this->em->flush();
        }

        // Cache de centros
        $centroHospital = $centroRep->find(1); // Elizabet Seton
        $centroPoliCentral = $centroRep->find(2); // San Martin
        $centroPoliNorte = $centroRep->find(3); // Obispo Anaya
        $centroAdmin = $centroRep->find(5); // Gral Acha

        $nuevos = 0;
        $duplicados = 0;

        $io->progressStart(count($activosInfo));

        foreach ($activosInfo as $row) {
            $unidad = $row['unidad'];
            $ubicacion = $row['ubicacion'];
            $detalle = $row['detalle'];
            $codigo = $row['codigo_nuevo'];
            $fecha = new \DateTime($row['fecha'] ?? '2020-01-01');

            // --- 1. PREVENCIÓN DE DUPLICADOS ---
            if ($equipoRep->findOneBy(['codigoInventario' => $codigo])) {
                $duplicados++;
                $io->progressAdvance();
                continue;
            }

            // --- 2. DETERMINAR CENTRO ---
            $centroAsignar = $centroAdmin; // Default
            if (str_contains(strtoupper($unidad), 'BLANCO GALINDO')) {
                $centroAsignar = $centroHospital;
            } elseif (str_contains(strtoupper($unidad), 'SAN MARTÍN') || str_contains(strtoupper($unidad), 'SAN MARTIN') || str_contains(strtoupper($unidad), 'CALLE BOLIVAR')) {
                $centroAsignar = $centroPoliCentral;
            } elseif (str_contains(strtoupper($unidad), 'FÉLIX DEL GRANADO') || str_contains(strtoupper($unidad), 'FELIX DEL GRANADO') || str_contains(strtoupper($unidad), 'OBISPO ANAYA')) {
                $centroAsignar = $centroPoliNorte;
            } elseif (str_contains(strtoupper($unidad), 'GRAL ACHA') || str_contains(strtoupper($unidad), 'ACHÁ')) {
                $centroAsignar = $centroAdmin;
            }

            // --- 3. DETERMINAR / CONSTRUIR SECCIÓN ---
            // Limpia "0509 | SALA DE REUNIONES" => "SALA DE REUNIONES"
            $secStr = trim(preg_replace('/^\d+\s*\|\s*/', '', $ubicacion));
            if (empty($secStr)) $secStr = 'Sección General';
            // Acortamos si es inmenso
            if (strlen($secStr) > 150) $secStr = substr($secStr, 0, 147) . '...';

            $seccionAsignar = $seccionRep->findOneBy(['nombre' => $secStr, 'centro' => $centroAsignar]);
            if (!$seccionAsignar) {
                $seccionAsignar = new Seccion();
                $seccionAsignar->setNombre($secStr);
                $seccionAsignar->setCentro($centroAsignar);
                $this->em->persist($seccionAsignar);
                $this->em->flush(); // Guardar de una vez para poder reusarla enseguida
            }

            // --- 4. DETERMINAR CATEGORÍA ---
            $detUpper = strtoupper($detalle);
            $catId = null;
            if (str_contains($detUpper, 'CPU') || str_contains($detUpper, 'COMPUTADORA') || str_contains($detUpper, 'SERVIDOR') || str_contains($detUpper, 'ALL IN ONE')) {
                $catId = 2; // CPU
            } elseif (str_contains($detUpper, 'MONITOR') || str_contains($detUpper, 'TV ') || str_contains($detUpper, 'TELEVISOR') || str_contains($detUpper, 'PANTALLA')) {
                $catId = 1; // Monitores
            } elseif (str_contains($detUpper, 'IMPRESORA') || str_contains($detUpper, 'PLOTTER')) {
                $catId = 3; // Impresoras
            } elseif (str_contains($detUpper, 'FOTOCOPIADORA') || str_contains($detUpper, 'FACSIMILE') || str_contains($detUpper, 'ESCANER')) {
                $catId = 4; // Fotocopiadoras
            } elseif (str_contains($detUpper, 'TELEFON')) {
                $catId = 5; // Teléfonos
            } elseif (str_contains($detUpper, 'LAPTOP') || str_contains($detUpper, 'PORTATIL') || str_contains($detUpper, 'TABLET') || str_contains($detUpper, 'NETBOOK') || str_contains($detUpper, 'IPAD')) {
                $catId = 6; // Laptops
            } elseif (str_contains($detUpper, 'ROUTER') || str_contains($detUpper, 'SWITCH') || str_contains($detUpper, 'ACCESS POINT') || str_contains($detUpper, 'ANTENA')) {
                $catId = 7; // Routers
            } elseif (str_contains($detUpper, 'TECLADO') || str_contains($detUpper, 'MOUSE')) {
                $catId = 8; // Teclados
            }

            // Si encontró una genérica, la asigna
            $categoriaAsignar = null;
            if ($catId) {
                $categoriaAsignar = $categoriaRep->find($catId);
            }

            // Si falló el macheo o el ID no existe en DB
            if (!$categoriaAsignar) {
                // Obtener primera palabra significativa ("DATA SHOW", "RACK", "UPS", etc.)
                $parts = explode(' ', trim($detUpper));
                $firstWord = count($parts) > 0 ? trim($parts[0], ' ".,;:_') : 'Otros Equipos';
                // Para agrupar mejor los DATA SHOW
                if ($firstWord === 'DATA') $firstWord = 'Proyectores / Data Show';
                if ($firstWord === 'UPS') $firstWord = 'Reguladores / UPS';
                if ($firstWord === 'ESTABILIZADOR') $firstWord = 'Reguladores / UPS';
                if ($firstWord === 'RACK') $firstWord = 'Racks de Red';
                if ($firstWord === 'CAMARA' || $firstWord === 'CÁMARA') $firstWord = 'Cámaras de Seguridad';

                $firstWord = ucfirst(strtolower($firstWord)); // Capitalize
                $categoriaAsignar = $categoriaRep->findOneBy(['nombre' => $firstWord]);
                if (!$categoriaAsignar) {
                    $categoriaAsignar = new CategoriaEquipo();
                    $categoriaAsignar->setNombre($firstWord);
                    $this->em->persist($categoriaAsignar);
                    $this->em->flush();
                }
            }

            // --- 5. PARSE DE MARCA Y SERIAL SI ESTÁN EN EL DETALLE ---
            $marca = 'S/M';
            if (preg_match('/\"(.*?)\"|MARCA:\s?([a-zA-Z]+)/', $detalle, $mMatches)) {
                $marca = strtoupper(trim(empty($mMatches[1]) ? ($mMatches[2] ?? 'S/M') : $mMatches[1]));
            }
            if (strlen($marca) > 100) $marca = substr($marca, 0, 97) . '...';

            $serial = 'S/N';
            if (preg_match('/SERIE:\s*([a-zA-Z0-9\-\/]+)/', $detUpper, $sMatches)) {
                $serial = trim($sMatches[1]);
            }
            if (strlen($serial) > 100) $serial = substr($serial, 0, 97) . '...';

            // --- 6. REGISTRO EN EQUIPO ---
            $equipo = new Equipo();
            $equipo->setCodigoInventario($codigo);
            // Evitamos nombres muy largos (200 caracteres max)
            $nombreCorto = (strlen($detalle) > 200) ? substr($detalle, 0, 197) . '...' : $detalle;
            $equipo->setNombre($nombreCorto);
            
            $equipo->setMarca($marca);
            $equipo->setModelo('S/M'); // No lo parseamos, S/M como default
            $equipo->setNumeroSerie($serial);
            
            $equipo->setCategoria($categoriaAsignar);
            $equipo->setCentro($centroAsignar);
            $equipo->setSeccion($seccionAsignar);
            $equipo->setEstado($estadoOperativo);
            
            $equipo->setFechaAdquisicion($fecha);
            
            // Vida Útil: Laptops/Routers = 3 años, CPU/Teléfonos = 4 años, Monitores/Impresoras = 5 años
            $vu = 48; // Default 4 años
            if ($categoriaAsignar->getId() == 6 || $categoriaAsignar->getId() == 7) $vu = 36;
            if ($categoriaAsignar->getId() == 1 || $categoriaAsignar->getId() == 3) $vu = 60;
            $equipo->setVidaUtilMeses($vu);

            $this->em->persist($equipo);
            $nuevos++;

            // Flush chunked pour performance
            if ($nuevos % 50 === 0) {
                $this->em->flush();
            }

            $io->progressAdvance();
        }

        $this->em->flush();
        $this->em->clear();
        $io->progressFinish();

        // Borrar tabla temporal
        $conn->executeStatement('DROP TABLE IF EXISTS activo');

        $io->success("Migración Finalizada. Nuevos Equipos instertados: $nuevos. Duplicados ignorados: $duplicados");

        return Command::SUCCESS;
    }
}
