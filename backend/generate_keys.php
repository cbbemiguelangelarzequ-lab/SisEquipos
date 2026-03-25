<?php
// Script para crear todos los repositorios básicos

$entities = [
    'Rol', 'Usuario', 'Seccion', 'CategoriaEquipo', 'EstadoEquipo',
    'TipoComponente', 'RepuestoInventario', 'Equipo', 'ComponenteEquipo',
    'FotoEquipo', 'SolicitudMantenimiento', 'HistorialMantenimiento', 'ReemplazoComponente'
];

$dir = __DIR__ . '/src/Repository/';
if (!is_dir($dir)) mkdir($dir, 0755, true);

foreach ($entities as $entity) {
    $repoName = $entity . 'Repository';
    $file = $dir . $repoName . '.php';
    $content = <<<PHP
<?php

namespace App\Repository;

use App\Entity\\$entity;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class $repoName extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry \$registry)
    {
        parent::__construct(\$registry, $entity::class);
    }
}
PHP;
    file_put_contents($file, $content);
    echo "Creado: $repoName.php\n";
}

echo "\n13 repositorios generados.\n";
