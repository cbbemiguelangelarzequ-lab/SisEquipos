<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\EvidenciaMantenimientoRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: EvidenciaMantenimientoRepository::class)]
#[ORM\Table(name: 'evidencia_mantenimiento')]
#[ApiResource(
    normalizationContext: ['groups' => ['evidencia:read']],
    denormalizationContext: ['groups' => ['evidencia:write']],
    paginationClientEnabled: true
)]
#[ApiFilter(SearchFilter::class, properties: ['historial' => 'exact'])]
class EvidenciaMantenimiento
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['evidencia:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: HistorialMantenimiento::class)]
    #[ORM\JoinColumn(name: 'historial_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[Groups(['evidencia:read', 'evidencia:write'])]
    private ?HistorialMantenimiento $historial = null;

    /**
     * Tipo: 'antes' (componente viejo/falla) o 'despues' (componente nuevo/reparado)
     */
    #[ORM\Column(type: 'string', length: 20)]
    #[Groups(['evidencia:read', 'evidencia:write'])]
    private string $tipo = 'antes';

    /**
     * Imagen en formato base64 Data URL (data:image/jpeg;base64,...)
     */
    #[ORM\Column(type: 'text', length: 16777215)]
    #[Groups(['evidencia:read', 'evidencia:write'])]
    private ?string $imagenBase64 = null;

    #[ORM\Column(type: 'string', length: 300, nullable: true)]
    #[Groups(['evidencia:read', 'evidencia:write'])]
    private ?string $descripcion = null;

    public function getId(): ?int { return $this->id; }

    public function getHistorial(): ?HistorialMantenimiento { return $this->historial; }
    public function setHistorial(?HistorialMantenimiento $historial): static { $this->historial = $historial; return $this; }

    public function getTipo(): string { return $this->tipo; }
    public function setTipo(string $tipo): static { $this->tipo = $tipo; return $this; }

    public function getImagenBase64(): ?string { return $this->imagenBase64; }
    public function setImagenBase64(?string $imagenBase64): static { $this->imagenBase64 = $imagenBase64; return $this; }

    public function getDescripcion(): ?string { return $this->descripcion; }
    public function setDescripcion(?string $descripcion): static { $this->descripcion = $descripcion; return $this; }
}
