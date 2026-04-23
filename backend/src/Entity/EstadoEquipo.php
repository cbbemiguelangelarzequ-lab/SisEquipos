<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\EstadoEquipoRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: EstadoEquipoRepository::class)]
#[ORM\Table(name: 'estado_equipo')]
#[ApiResource(
    paginationClientEnabled: true
)]
class EstadoEquipo
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['solicitud:read', 'equipo:read', 'historial:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 100)]
    #[Groups(['solicitud:read', 'equipo:read', 'historial:read'])]
    private ?string $nombre = null;

    #[ORM\OneToMany(mappedBy: 'estado', targetEntity: Equipo::class)]
    private Collection $equipos;

    public function __construct()
    {
        $this->equipos = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getNombre(): ?string { return $this->nombre; }
    public function setNombre(string $nombre): static { $this->nombre = $nombre; return $this; }

    public function getEquipos(): Collection { return $this->equipos; }
}
