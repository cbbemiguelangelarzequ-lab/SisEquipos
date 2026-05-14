<?php

namespace App\Repository;

use App\Entity\TransferenciaItem;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

// @extends ServiceEntityRepository<TransferenciaItem>
class TransferenciaItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TransferenciaItem::class);
    }
}
