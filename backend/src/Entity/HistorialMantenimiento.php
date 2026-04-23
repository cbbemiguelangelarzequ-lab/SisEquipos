<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\HistorialMantenimientoRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: HistorialMantenimientoRepository::class)]
#[ORM\Table(name: 'historial_mantenimiento')]
#[ApiResource(
    normalizationContext: ['groups' => ['historial:read']],
    denormalizationContext: ['groups' => ['historial:write']],
    uriTemplate: '/historials',
    operations: [
        new \ApiPlatform\Metadata\GetCollection(),
        new \ApiPlatform\Metadata\Post(),
        new \ApiPlatform\Metadata\Get(uriTemplate: '/historials/{id}'),
        new \ApiPlatform\Metadata\Put(uriTemplate: '/historials/{id}'),
        new \ApiPlatform\Metadata\Patch(uriTemplate: '/historials/{id}'),
        new \ApiPlatform\Metadata\Delete(uriTemplate: '/historials/{id}'),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: ['equipo.centro' => 'exact', 'solicitud' => 'exact'])]
class HistorialMantenimiento
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['historial:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Equipo::class)]
    #[ORM\JoinColumn(name: 'equipo_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[Groups(['historial:read', 'historial:write'])]
    private ?Equipo $equipo = null;

    #[ORM\ManyToOne(targetEntity: SolicitudMantenimiento::class)]
    #[ORM\JoinColumn(name: 'solicitud_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    #[Groups(['historial:read', 'historial:write'])]
    private ?SolicitudMantenimiento $solicitud = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'tecnico_id', referencedColumnName: 'id')]
    #[Groups(['historial:read', 'historial:write'])]
    private ?Usuario $tecnico = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['historial:read', 'historial:write'])]
    private ?string $accionRealizada = null;

    #[ORM\ManyToOne(targetEntity: EstadoEquipo::class)]
    #[ORM\JoinColumn(name: 'estado_equipo_resultante_id', referencedColumnName: 'id', nullable: true)]
    #[Groups(['historial:read', 'historial:write'])]
    private ?EstadoEquipo $estadoEquipoResultante = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    #[Groups(['historial:read', 'historial:write'])]
    private ?string $costo = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    #[Groups(['historial:read', 'historial:write'])]
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
