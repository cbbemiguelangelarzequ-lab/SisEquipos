<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\RepuestoInventarioRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RepuestoInventarioRepository::class)]
#[ORM\Table(name: 'repuesto_inventario')]
#[ApiResource]
class RepuestoInventario
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: TipoComponente::class, inversedBy: 'repuestos')]
    #[ORM\JoinColumn(name: 'tipo_componente_id', referencedColumnName: 'id')]
    private ?TipoComponente $tipoComponente = null;

    #[ORM\Column(type: 'string', length: 200)]
    private ?string $nombre = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $numeroSerie = null;

    #[ORM\Column(type: 'integer', options: ['default' => 1])]
    private int $cantidad = 1;

    #[ORM\Column(type: 'string', length: 50)]
    private ?string $estado = null; // Disponible, Reservado, Agotado

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $fechaIngreso = null;

    public function getId(): ?int { return $this->id; }

    public function getTipoComponente(): ?TipoComponente { return $this->tipoComponente; }
    public function setTipoComponente(?TipoComponente $tipoComponente): static { $this->tipoComponente = $tipoComponente; return $this; }

    public function getNombre(): ?string { return $this->nombre; }
    public function setNombre(string $nombre): static { $this->nombre = $nombre; return $this; }

    public function getNumeroSerie(): ?string { return $this->numeroSerie; }
    public function setNumeroSerie(?string $numeroSerie): static { $this->numeroSerie = $numeroSerie; return $this; }

    public function getCantidad(): int { return $this->cantidad; }
    public function setCantidad(int $cantidad): static { $this->cantidad = $cantidad; return $this; }

    public function getEstado(): ?string { return $this->estado; }
    public function setEstado(string $estado): static { $this->estado = $estado; return $this; }

    public function getFechaIngreso(): ?\DateTimeInterface { return $this->fechaIngreso; }
    public function setFechaIngreso(?\DateTimeInterface $fechaIngreso): static { $this->fechaIngreso = $fechaIngreso; return $this; }
}
