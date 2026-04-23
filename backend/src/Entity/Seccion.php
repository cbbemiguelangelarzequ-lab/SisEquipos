<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\SeccionRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Serializer\Annotation\Groups;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;

#[ORM\Entity(repositoryClass: SeccionRepository::class)]
#[ORM\Table(name: 'seccion')]
#[ApiResource(
    normalizationContext: ['groups' => ['seccion:read']],
    denormalizationContext: ['groups' => ['seccion:write']],
    paginationClientEnabled: true
)]
#[ApiFilter(SearchFilter::class, properties: ['centro' => 'exact'])]
class Seccion
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['seccion:read', 'solicitud:read', 'equipo:read', 'historial:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 150)]
    #[Groups(['seccion:read', 'seccion:write', 'solicitud:read', 'equipo:read', 'historial:read'])]
    private ?string $nombre = null;

    #[ORM\ManyToOne(targetEntity: Centro::class, inversedBy: 'secciones')]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['seccion:read', 'seccion:write', 'solicitud:read', 'equipo:read', 'historial:read'])]
    private ?Centro $centro = null;

    #[ORM\OneToMany(mappedBy: 'seccion', targetEntity: Equipo::class)]
    private Collection $equipos;

    public function __construct()
    {
        $this->equipos = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getNombre(): ?string { return $this->nombre; }
    public function setNombre(string $nombre): static { $this->nombre = $nombre; return $this; }

    public function getCentro(): ?Centro { return $this->centro; }
    public function setCentro(?Centro $centro): static { $this->centro = $centro; return $this; }

    public function getEquipos(): Collection { return $this->equipos; }
}
