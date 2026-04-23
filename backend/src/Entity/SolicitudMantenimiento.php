<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\SolicitudMantenimientoRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: SolicitudMantenimientoRepository::class)]
#[ORM\Table(name: 'solicitud_mantenimiento')]
#[ApiResource(
    normalizationContext: ['groups' => ['solicitud:read']],
    denormalizationContext: ['groups' => ['solicitud:write']],
    uriTemplate: '/solicitudes',
    operations: [
        new \ApiPlatform\Metadata\GetCollection(),
        new \ApiPlatform\Metadata\Post(),
        new \ApiPlatform\Metadata\Get(uriTemplate: '/solicitudes/{id}'),
        new \ApiPlatform\Metadata\Put(uriTemplate: '/solicitudes/{id}'),
        new \ApiPlatform\Metadata\Patch(uriTemplate: '/solicitudes/{id}'),
        new \ApiPlatform\Metadata\Delete(uriTemplate: '/solicitudes/{id}'),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: ['equipo.centro' => 'exact'])]
class SolicitudMantenimiento
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['solicitud:read', 'historial:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Equipo::class)]
    #[ORM\JoinColumn(name: 'equipo_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[Groups(['solicitud:read', 'solicitud:write', 'historial:read'])]
    private ?Equipo $equipo = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'solicitante_id', referencedColumnName: 'id')]
    #[Groups(['solicitud:read', 'solicitud:write', 'historial:read'])]
    private ?Usuario $solicitante = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['solicitud:read', 'solicitud:write', 'historial:read'])]
    private ?string $descripcionFalla = null;

    #[ORM\Column(type: 'string', length: 50)]
    #[Groups(['solicitud:read', 'solicitud:write', 'historial:read'])]
    private ?string $estadoSolicitud = 'Pendiente';

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    #[Groups(['solicitud:read', 'solicitud:write', 'historial:read'])]
    private ?string $prioridad = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    #[Groups(['solicitud:read', 'solicitud:write', 'historial:read'])]
    private ?\DateTimeInterface $fechaSolicitud = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    #[Groups(['solicitud:read', 'solicitud:write', 'historial:read'])]
    private ?\DateTimeInterface $fechaResolucion = null;

    public function getId(): ?int { return $this->id; }

    public function getEquipo(): ?Equipo { return $this->equipo; }
    public function setEquipo(?Equipo $equipo): static { $this->equipo = $equipo; return $this; }

    public function getSolicitante(): ?Usuario { return $this->solicitante; }
    public function setSolicitante(?Usuario $solicitante): static { $this->solicitante = $solicitante; return $this; }

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
