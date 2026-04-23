<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'centro')]
#[ApiResource(
    paginationClientEnabled: true
)]
class Centro
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['usuario:read', 'equipo:read', 'repuesto:read', 'seccion:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 150)]
    #[Groups(['usuario:read', 'equipo:read', 'repuesto:read', 'seccion:read'])]
    private ?string $nombre = null;

    #[ORM\OneToMany(mappedBy: 'centro', targetEntity: Usuario::class)]
    private Collection $usuarios;

    #[ORM\OneToMany(mappedBy: 'centro', targetEntity: Equipo::class)]
    private Collection $equipos;

    #[ORM\OneToMany(mappedBy: 'centro', targetEntity: RepuestoInventario::class)]
    private Collection $repuestos;

    #[ORM\OneToMany(mappedBy: 'centro', targetEntity: Seccion::class)]
    private Collection $secciones;

    public function __construct()
    {
        $this->usuarios = new ArrayCollection();
        $this->equipos = new ArrayCollection();
        $this->repuestos = new ArrayCollection();
        $this->secciones = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getNombre(): ?string { return $this->nombre; }
    public function setNombre(string $nombre): static { $this->nombre = $nombre; return $this; }

    public function getUsuarios(): Collection { return $this->usuarios; }
    public function getEquipos(): Collection { return $this->equipos; }
    public function getRepuestos(): Collection { return $this->repuestos; }
    public function getSecciones(): Collection { return $this->secciones; }
}
