<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\TipoComponenteRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: TipoComponenteRepository::class)]
#[ORM\Table(name: 'tipo_componente')]
#[ApiResource]
class TipoComponente
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 150)]
    private ?string $nombre = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $descripcion = null;

    #[ORM\OneToMany(mappedBy: 'tipoComponente', targetEntity: RepuestoInventario::class)]
    private Collection $repuestos;

    #[ORM\OneToMany(mappedBy: 'tipoComponente', targetEntity: ComponenteEquipo::class)]
    private Collection $componentesEquipo;

    public function __construct()
    {
        $this->repuestos = new ArrayCollection();
        $this->componentesEquipo = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getNombre(): ?string { return $this->nombre; }
    public function setNombre(string $nombre): static { $this->nombre = $nombre; return $this; }

    public function getDescripcion(): ?string { return $this->descripcion; }
    public function setDescripcion(?string $descripcion): static { $this->descripcion = $descripcion; return $this; }

    public function getRepuestos(): Collection { return $this->repuestos; }
    public function getComponentesEquipo(): Collection { return $this->componentesEquipo; }
}
