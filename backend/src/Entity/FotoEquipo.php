<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\FotoEquipoRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FotoEquipoRepository::class)]
#[ORM\Table(name: 'foto_equipo')]
#[ApiResource]
class FotoEquipo
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Equipo::class, inversedBy: 'fotos')]
    #[ORM\JoinColumn(name: 'equipo_id', referencedColumnName: 'id')]
    private ?Equipo $equipo = null;

    #[ORM\Column(type: 'string', length: 500)]
    private ?string $urlFoto = null;

    #[ORM\Column(type: 'string', length: 200, nullable: true)]
    private ?string $descripcion = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $subidoEn = null;

    public function getId(): ?int { return $this->id; }

    public function getEquipo(): ?Equipo { return $this->equipo; }
    public function setEquipo(?Equipo $equipo): static { $this->equipo = $equipo; return $this; }

    public function getUrlFoto(): ?string { return $this->urlFoto; }
    public function setUrlFoto(string $urlFoto): static { $this->urlFoto = $urlFoto; return $this; }

    public function getDescripcion(): ?string { return $this->descripcion; }
    public function setDescripcion(?string $descripcion): static { $this->descripcion = $descripcion; return $this; }

    public function getSubidoEn(): ?\DateTimeInterface { return $this->subidoEn; }
    public function setSubidoEn(?\DateTimeInterface $subidoEn): static { $this->subidoEn = $subidoEn; return $this; }
}
