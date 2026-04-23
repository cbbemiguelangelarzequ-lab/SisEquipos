<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\ReemplazoComponenteRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ReemplazoComponenteRepository::class)]
#[ORM\Table(name: 'reemplazo_componente')]
#[ApiResource]
#[ApiFilter(SearchFilter::class, properties: ['historialMantenimiento' => 'exact'])]
class ReemplazoComponente
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: HistorialMantenimiento::class)]
    #[ORM\JoinColumn(name: 'historial_mantenimiento_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    private ?HistorialMantenimiento $historialMantenimiento = null;

    #[ORM\ManyToOne(targetEntity: RepuestoInventario::class)]
    #[ORM\JoinColumn(name: 'repuesto_utilizado_id', referencedColumnName: 'id', nullable: true)]
    private ?RepuestoInventario $repuestoUtilizado = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $motivoCambio = null;

    public function getId(): ?int { return $this->id; }

    public function getHistorialMantenimiento(): ?HistorialMantenimiento { return $this->historialMantenimiento; }
    public function setHistorialMantenimiento(?HistorialMantenimiento $h): static { $this->historialMantenimiento = $h; return $this; }

    public function getRepuestoUtilizado(): ?RepuestoInventario { return $this->repuestoUtilizado; }
    public function setRepuestoUtilizado(?RepuestoInventario $r): static { $this->repuestoUtilizado = $r; return $this; }

    public function getMotivoCambio(): ?string { return $this->motivoCambio; }
    public function setMotivoCambio(?string $motivoCambio): static { $this->motivoCambio = $motivoCambio; return $this; }
}
