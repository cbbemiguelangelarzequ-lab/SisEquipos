<?php

namespace App\Repository;

use App\Entity\EvidenciaMantenimiento;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class EvidenciaMantenimientoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EvidenciaMantenimiento::class);
    }
}
