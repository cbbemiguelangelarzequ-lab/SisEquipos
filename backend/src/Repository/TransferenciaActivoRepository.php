<?php

namespace App\Repository;

use App\Entity\TransferenciaActivo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

// @extends ServiceEntityRepository<TransferenciaActivo>
class TransferenciaActivoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TransferenciaActivo::class);
    }
}
