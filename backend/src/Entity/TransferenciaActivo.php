<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use App\Repository\TransferenciaActivoRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: TransferenciaActivoRepository::class)]
#[ORM\Table(name: 'transferencia_activo')]
#[ApiResource(
    normalizationContext: ['groups' => ['transferencia:read']],
    denormalizationContext: ['groups' => ['transferencia:write']],
    paginationClientEnabled: true
)]
#[ApiFilter(SearchFilter::class, properties: ['centroOrigen' => 'exact', 'centroDestino' => 'exact', 'estado' => 'exact'])]
#[ApiFilter(OrderFilter::class, properties: ['fechaSolicitud', 'id'], arguments: ['orderParameterName' => 'order'])]
class TransferenciaActivo
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['transferencia:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centro::class)]
    #[Groups(['transferencia:read', 'transferencia:write'])]
    private ?Centro $centroOrigen = null;

    #[ORM\ManyToOne(targetEntity: Centro::class)]
    #[Groups(['transferencia:read', 'transferencia:write'])]
    private ?Centro $centroDestino = null;

    #[ORM\ManyToOne(targetEntity: Seccion::class)]
    #[Groups(['transferencia:read', 'transferencia:write'])]
    private ?Seccion $seccionOrigen = null;

    #[ORM\ManyToOne(targetEntity: Seccion::class)]
    #[Groups(['transferencia:read', 'transferencia:write'])]
    private ?Seccion $seccionDestino = null;

    #[ORM\Column(type: 'datetime')]
    #[Groups(['transferencia:read', 'transferencia:write'])]
    private ?\DateTimeInterface $fechaSolicitud = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    #[Groups(['transferencia:read', 'transferencia:write'])]
    private ?\DateTimeInterface $fechaTransferencia = null;

    #[ORM\Column(type: 'string', length: 50)]
    #[Groups(['transferencia:read', 'transferencia:write'])]
    private string $estado = 'Pendiente'; // Pendiente, Completada, Rechazada

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[Groups(['transferencia:read', 'transferencia:write'])]
    private ?Usuario $solicitadoPor = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[Groups(['transferencia:read', 'transferencia:write'])]
    private ?Usuario $autorizadoPor = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['transferencia:read', 'transferencia:write'])]
    private ?string $motivo = null;

    #[ORM\OneToMany(mappedBy: 'transferencia', targetEntity: TransferenciaItem::class, cascade: ['persist', 'remove'])]
    #[Groups(['transferencia:read', 'transferencia:write'])]
    private Collection $items;

    public function __construct()
    {
        $this->items = new ArrayCollection();
        $this->fechaSolicitud = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }

    public function getCentroOrigen(): ?Centro { return $this->centroOrigen; }
    public function setCentroOrigen(?Centro $centroOrigen): self { $this->centroOrigen = $centroOrigen; return $this; }

    public function getCentroDestino(): ?Centro { return $this->centroDestino; }
    public function setCentroDestino(?Centro $centroDestino): self { $this->centroDestino = $centroDestino; return $this; }

    public function getSeccionOrigen(): ?Seccion { return $this->seccionOrigen; }
    public function setSeccionOrigen(?Seccion $seccionOrigen): self { $this->seccionOrigen = $seccionOrigen; return $this; }

    public function getSeccionDestino(): ?Seccion { return $this->seccionDestino; }
    public function setSeccionDestino(?Seccion $seccionDestino): self { $this->seccionDestino = $seccionDestino; return $this; }

    public function getFechaSolicitud(): ?\DateTimeInterface { return $this->fechaSolicitud; }
    public function setFechaSolicitud(\DateTimeInterface $fechaSolicitud): self { $this->fechaSolicitud = $fechaSolicitud; return $this; }

    public function getFechaTransferencia(): ?\DateTimeInterface { return $this->fechaTransferencia; }
    public function setFechaTransferencia(?\DateTimeInterface $fechaTransferencia): self { $this->fechaTransferencia = $fechaTransferencia; return $this; }

    public function getEstado(): string { return $this->estado; }
    public function setEstado(string $estado): self { $this->estado = $estado; return $this; }

    public function getSolicitadoPor(): ?Usuario { return $this->solicitadoPor; }
    public function setSolicitadoPor(?Usuario $solicitadoPor): self { $this->solicitadoPor = $solicitadoPor; return $this; }

    public function getAutorizadoPor(): ?Usuario { return $this->autorizadoPor; }
    public function setAutorizadoPor(?Usuario $autorizadoPor): self { $this->autorizadoPor = $autorizadoPor; return $this; }

    public function getMotivo(): ?string { return $this->motivo; }
    public function setMotivo(?string $motivo): self { $this->motivo = $motivo; return $this; }

    // @return Collection<int, TransferenciaItem>
    public function getItems(): Collection { return $this->items; }

    public function addItem(TransferenciaItem $item): self
    {
        if (!$this->items->contains($item)) {
            $this->items->add($item);
            $item->setTransferencia($this);
        }
        return $this;
    }

    public function removeItem(TransferenciaItem $item): self
    {
        if ($this->items->removeElement($item)) {
            if ($item->getTransferencia() === $this) {
                $item->setTransferencia(null);
            }
        }
        return $this;
    }
}
