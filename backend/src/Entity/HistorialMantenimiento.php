<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\HistorialMantenimientoRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: HistorialMantenimientoRepository::class)]
#[ORM\Table(name: 'historial_mantenimiento')]
#[ApiResource]
class HistorialMantenimiento
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Equipo::class)]
    #[ORM\JoinColumn(name: 'equipo_id', referencedColumnName: 'id')]
    private ?Equipo $equipo = null;

    #[ORM\OneToOne(targetEntity: SolicitudMantenimiento::class)]
    #[ORM\JoinColumn(name: 'solicitud_id', referencedColumnName: 'id', nullable: true)]
    private ?SolicitudMantenimiento $solicitud = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'tecnico_id', referencedColumnName: 'id')]
    private ?Usuario $tecnico = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $accionRealizada = null;

    #[ORM\ManyToOne(targetEntity: EstadoEquipo::class)]
    #[ORM\JoinColumn(name: 'estado_equipo_resultante_id', referencedColumnName: 'id', nullable: true)]
    private ?EstadoEquipo $estadoEquipoResultante = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $costo = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $fechaMantenimiento = null;

    public function getId(): ?int { return $this->id; }

    public function getEquipo(): ?Equipo { return $this->equipo; }
    public function setEquipo(?Equipo $equipo): static { $this->equipo = $equipo; return $this; }

    public function getSolicitud(): ?SolicitudMantenimiento { return $this->solicitud; }
    public function setSolicitud(?SolicitudMantenimiento $solicitud): static { $this->solicitud = $solicitud; return $this; }

    public function getTecnico(): ?Usuario { return $this->tecnico; }
    public function setTecnico(?Usuario $tecnico): static { $this->tecnico = $tecnico; return $this; }

    public function getAccionRealizada(): ?string { return $this->accionRealizada; }
    public function setAccionRealizada(?string $accionRealizada): static { $this->accionRealizada = $accionRealizada; return $this; }

    public function getEstadoEquipoResultante(): ?EstadoEquipo { return $this->estadoEquipoResultante; }
    public function setEstadoEquipoResultante(?EstadoEquipo $estado): static { $this->estadoEquipoResultante = $estado; return $this; }

    public function getCosto(): ?string { return $this->costo; }
    public function setCosto(?string $costo): static { $this->costo = $costo; return $this; }

    public function getFechaMantenimiento(): ?\DateTimeInterface { return $this->fechaMantenimiento; }
    public function setFechaMantenimiento(?\DateTimeInterface $fecha): static { $this->fechaMantenimiento = $fecha; return $this; }
}
