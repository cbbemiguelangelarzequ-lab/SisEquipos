<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\TransferenciaItemRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: TransferenciaItemRepository::class)]
#[ORM\Table(name: 'transferencia_item')]
#[ApiResource(
    normalizationContext: ['groups' => ['transferencia_item:read']],
    denormalizationContext: ['groups' => ['transferencia_item:write']]
)]
#[ApiFilter(SearchFilter::class, properties: ['equipo' => 'exact'])]
class TransferenciaItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['transferencia:read', 'transferencia_item:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: TransferenciaActivo::class, inversedBy: 'items')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['transferencia_item:write'])]
    private ?TransferenciaActivo $transferencia = null;

    #[ORM\ManyToOne(targetEntity: Equipo::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['transferencia:read', 'transferencia_item:read', 'transferencia_item:write'])]
    private ?Equipo $equipo = null;

    #[ORM\Column(type: 'string', length: 50)]
    #[Groups(['transferencia:read', 'transferencia_item:read', 'transferencia_item:write'])]
    private string $estadoActivo = '1 - Nuevo'; 

    public function getId(): ?int { return $this->id; }

    public function getTransferencia(): ?TransferenciaActivo { return $this->transferencia; }
    public function setTransferencia(?TransferenciaActivo $transferencia): self { $this->transferencia = $transferencia; return $this; }

    public function getEquipo(): ?Equipo { return $this->equipo; }
    public function setEquipo(?Equipo $equipo): self { $this->equipo = $equipo; return $this; }

    public function getEstadoActivo(): string { return $this->estadoActivo; }
    public function setEstadoActivo(string $estadoActivo): self { $this->estadoActivo = $estadoActivo; return $this; }
}
