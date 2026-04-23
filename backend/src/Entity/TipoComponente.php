<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\TipoComponenteRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: TipoComponenteRepository::class)]
#[ORM\Table(name: 'tipo_componente')]
#[ApiResource(
    paginationClientEnabled: true
)]
class TipoComponente
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['repuesto:read', 'componente:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 150)]
    #[Groups(['repuesto:read', 'componente:read'])]
    private ?string $nombre = null;

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

    public function getRepuestos(): Collection { return $this->repuestos; }
    public function getComponentesEquipo(): Collection { return $this->componentesEquipo; }
}
