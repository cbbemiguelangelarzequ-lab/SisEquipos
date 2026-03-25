<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\SolicitudMantenimientoRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SolicitudMantenimientoRepository::class)]
#[ORM\Table(name: 'solicitud_mantenimiento')]
#[ApiResource]
class SolicitudMantenimiento
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Equipo::class)]
    #[ORM\JoinColumn(name: 'equipo_id', referencedColumnName: 'id')]
    private ?Equipo $equipo = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'solicitante_id', referencedColumnName: 'id')]
    private ?Usuario $solicitante = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'tecnico_asignado_id', referencedColumnName: 'id', nullable: true)]
    private ?Usuario $tecnicoAsignado = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $descripcionFalla = null;

    #[ORM\Column(type: 'string', length: 50)]
    private ?string $estadoSolicitud = 'Pendiente'; // Pendiente, En Progreso, Finalizado, Rechazado

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    private ?string $prioridad = null; // Baja, Media, Alta, Crítica

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $fechaSolicitud = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $fechaResolucion = null;

    public function getId(): ?int { return $this->id; }

    public function getEquipo(): ?Equipo { return $this->equipo; }
    public function setEquipo(?Equipo $equipo): static { $this->equipo = $equipo; return $this; }

    public function getSolicitante(): ?Usuario { return $this->solicitante; }
    public function setSolicitante(?Usuario $solicitante): static { $this->solicitante = $solicitante; return $this; }

    public function getTecnicoAsignado(): ?Usuario { return $this->tecnicoAsignado; }
    public function setTecnicoAsignado(?Usuario $tecnicoAsignado): static { $this->tecnicoAsignado = $tecnicoAsignado; return $this; }

    public function getDescripcionFalla(): ?string { return $this->descripcionFalla; }
    public function setDescripcionFalla(?string $descripcionFalla): static { $this->descripcionFalla = $descripcionFalla; return $this; }

    public function getEstadoSolicitud(): ?string { return $this->estadoSolicitud; }
    public function setEstadoSolicitud(string $estadoSolicitud): static { $this->estadoSolicitud = $estadoSolicitud; return $this; }

    public function getPrioridad(): ?string { return $this->prioridad; }
    public function setPrioridad(?string $prioridad): static { $this->prioridad = $prioridad; return $this; }

    public function getFechaSolicitud(): ?\DateTimeInterface { return $this->fechaSolicitud; }
    public function setFechaSolicitud(?\DateTimeInterface $fechaSolicitud): static { $this->fechaSolicitud = $fechaSolicitud; return $this; }

    public function getFechaResolucion(): ?\DateTimeInterface { return $this->fechaResolucion; }
    public function setFechaResolucion(?\DateTimeInterface $fechaResolucion): static { $this->fechaResolucion = $fechaResolucion; return $this; }
}
