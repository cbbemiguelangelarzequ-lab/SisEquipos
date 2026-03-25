<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\ComponenteEquipoRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ComponenteEquipoRepository::class)]
#[ORM\Table(name: 'componente_equipo')]
#[ApiResource]
class ComponenteEquipo
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Equipo::class, inversedBy: 'componentes')]
    #[ORM\JoinColumn(name: 'equipo_id', referencedColumnName: 'id')]
    private ?Equipo $equipo = null;

    #[ORM\ManyToOne(targetEntity: TipoComponente::class, inversedBy: 'componentesEquipo')]
    #[ORM\JoinColumn(name: 'tipo_componente_id', referencedColumnName: 'id')]
    private ?TipoComponente $tipoComponente = null;

    #[ORM\Column(type: 'string', length: 200, nullable: true)]
    private ?string $descripcion = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $numeroSerie = null;

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    private ?string $estado = null; // Instalado, Dañado, Retirado

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $fechaInstalacion = null;

    public function getId(): ?int { return $this->id; }

    public function getEquipo(): ?Equipo { return $this->equipo; }
    public function setEquipo(?Equipo $equipo): static { $this->equipo = $equipo; return $this; }

    public function getTipoComponente(): ?TipoComponente { return $this->tipoComponente; }
    public function setTipoComponente(?TipoComponente $tipoComponente): static { $this->tipoComponente = $tipoComponente; return $this; }

    public function getDescripcion(): ?string { return $this->descripcion; }
    public function setDescripcion(?string $descripcion): static { $this->descripcion = $descripcion; return $this; }

    public function getNumeroSerie(): ?string { return $this->numeroSerie; }
    public function setNumeroSerie(?string $numeroSerie): static { $this->numeroSerie = $numeroSerie; return $this; }

    public function getEstado(): ?string { return $this->estado; }
    public function setEstado(?string $estado): static { $this->estado = $estado; return $this; }

    public function getFechaInstalacion(): ?\DateTimeInterface { return $this->fechaInstalacion; }
    public function setFechaInstalacion(?\DateTimeInterface $fechaInstalacion): static { $this->fechaInstalacion = $fechaInstalacion; return $this; }
}
