<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\RepuestoInventarioRepository;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: RepuestoInventarioRepository::class)]
#[ORM\Table(name: 'repuesto_inventario')]
#[ApiResource(
    normalizationContext: ['groups' => ['repuesto:read']],
    denormalizationContext: ['groups' => ['repuesto:write']],
    paginationClientEnabled: true
)]
#[ApiFilter(SearchFilter::class, properties: ['centro' => 'exact', 'tipoComponente' => 'exact'])]
class RepuestoInventario
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['repuesto:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: TipoComponente::class, inversedBy: 'repuestos')]
    #[ORM\JoinColumn(name: 'tipo_componente_id', referencedColumnName: 'id')]
    #[Groups(['repuesto:read', 'repuesto:write'])]
    private ?TipoComponente $tipoComponente = null;

    #[ORM\ManyToOne(targetEntity: Centro::class, inversedBy: 'repuestos')]
    #[ORM\JoinColumn(name: 'centro_id', referencedColumnName: 'id', nullable: true)]
    #[Groups(['repuesto:read', 'repuesto:write'])]
    private ?Centro $centro = null;

    #[ORM\Column(type: 'string', length: 200)]
    #[Groups(['repuesto:read', 'repuesto:write'])]
    private ?string $nombre = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    #[Groups(['repuesto:read', 'repuesto:write'])]
    private ?string $numeroSerie = null;

    #[ORM\Column(type: 'integer', options: ['default' => 1])]
    #[Groups(['repuesto:read', 'repuesto:write'])]
    private int $cantidad = 1;

    #[ORM\Column(type: 'string', length: 50)]
    #[Groups(['repuesto:read', 'repuesto:write'])]
    private ?string $estado = null; // Disponible, Reservado, Agotado

    public function getId(): ?int { return $this->id; }

    public function getTipoComponente(): ?TipoComponente { return $this->tipoComponente; }
    public function setTipoComponente(?TipoComponente $tipoComponente): static { $this->tipoComponente = $tipoComponente; return $this; }

    public function getCentro(): ?Centro { return $this->centro; }
    public function setCentro(?Centro $centro): static { $this->centro = $centro; return $this; }

    public function getNombre(): ?string { return $this->nombre; }
    public function setNombre(string $nombre): static { $this->nombre = $nombre; return $this; }

    public function getNumeroSerie(): ?string { return $this->numeroSerie; }
    public function setNumeroSerie(?string $numeroSerie): static { $this->numeroSerie = $numeroSerie; return $this; }

    public function getCantidad(): int { return $this->cantidad; }
    public function setCantidad(int $cantidad): static { $this->cantidad = $cantidad; return $this; }

    public function getEstado(): ?string { return $this->estado; }
    public function setEstado(string $estado): static { $this->estado = $estado; return $this; }
}
