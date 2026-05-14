<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\PlanMantenimientoPreventivoRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: PlanMantenimientoPreventivoRepository::class)]
#[ORM\Table(name: 'plan_mantenimiento_preventivo')]
#[ApiResource(
    normalizationContext: ['groups' => ['plan:read']],
    denormalizationContext: ['groups' => ['plan:write']],
    uriTemplate: '/planes_preventivos',
    operations: [
        new \ApiPlatform\Metadata\GetCollection(),
        new \ApiPlatform\Metadata\Post(),
        new \ApiPlatform\Metadata\Get(uriTemplate: '/planes_preventivos/{id}'),
        new \ApiPlatform\Metadata\Put(uriTemplate: '/planes_preventivos/{id}'),
        new \ApiPlatform\Metadata\Patch(uriTemplate: '/planes_preventivos/{id}'),
        new \ApiPlatform\Metadata\Delete(uriTemplate: '/planes_preventivos/{id}'),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: ['equipo.centro' => 'exact', 'estado' => 'exact', 'equipo' => 'exact'])]
class PlanMantenimientoPreventivo
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['plan:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Equipo::class)]
    #[ORM\JoinColumn(name: 'equipo_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[Groups(['plan:read', 'plan:write'])]
    private ?Equipo $equipo = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'tecnico_asignado_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    #[Groups(['plan:read', 'plan:write'])]
    private ?Usuario $tecnicoAsignado = null;

    // Descripción de las tareas a realizar (checklist de acciones preventivas)
    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['plan:read', 'plan:write'])]
    private ?string $descripcionTareas = null;

    // Tipo de frecuencia: 'mensual', 'trimestral', 'semestral', 'anual', 'unico'
    #[ORM\Column(type: 'string', length: 50)]
    #[Groups(['plan:read', 'plan:write'])]
    private string $frecuencia = 'trimestral';

    // Intervalo en días (base de cálculo para reagendado automático)
    // Ej: 90 para trimestral, 180 para semestral, 365 para anual
    #[ORM\Column(type: 'integer', nullable: true)]
    #[Groups(['plan:read', 'plan:write'])]
    private ?int $intervaloDias = 90;

    // Fecha programada para el próximo mantenimiento preventivo
    #[ORM\Column(type: 'date')]
    #[Groups(['plan:read', 'plan:write'])]
    private ?\DateTimeInterface $fechaProximoMantenimiento = null;

    // Fecha en que se ejecutó el último mantenimiento de este plan
    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['plan:read', 'plan:write'])]
    private ?\DateTimeInterface $fechaUltimoMantenimiento = null;

    // Estado del plan: 'Activo', 'Pausado', 'Completado'
    #[ORM\Column(type: 'string', length: 50)]
    #[Groups(['plan:read', 'plan:write'])]
    private string $estado = 'Activo';

    // Prioridad: 'Alta', 'Media', 'Baja'
    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    #[Groups(['plan:read', 'plan:write'])]
    private ?string $prioridad = 'Media';

    // ── Getters & Setters ──────────────────────────────────────────────────

    public function getId(): ?int { return $this->id; }

    public function getEquipo(): ?Equipo { return $this->equipo; }
    public function setEquipo(?Equipo $equipo): static { $this->equipo = $equipo; return $this; }

    public function getTecnicoAsignado(): ?Usuario { return $this->tecnicoAsignado; }
    public function setTecnicoAsignado(?Usuario $tecnico): static { $this->tecnicoAsignado = $tecnico; return $this; }

    public function getDescripcionTareas(): ?string { return $this->descripcionTareas; }
    public function setDescripcionTareas(?string $desc): static { $this->descripcionTareas = $desc; return $this; }

    public function getFrecuencia(): string { return $this->frecuencia; }
    public function setFrecuencia(string $f): static { $this->frecuencia = $f; return $this; }

    public function getIntervaloDias(): ?int { return $this->intervaloDias; }
    public function setIntervaloDias(?int $d): static { $this->intervaloDias = $d; return $this; }

    public function getFechaProximoMantenimiento(): ?\DateTimeInterface { return $this->fechaProximoMantenimiento; }
    public function setFechaProximoMantenimiento(?\DateTimeInterface $f): static { $this->fechaProximoMantenimiento = $f; return $this; }

    public function getFechaUltimoMantenimiento(): ?\DateTimeInterface { return $this->fechaUltimoMantenimiento; }
    public function setFechaUltimoMantenimiento(?\DateTimeInterface $f): static { $this->fechaUltimoMantenimiento = $f; return $this; }

    public function getEstado(): string { return $this->estado; }
    public function setEstado(string $e): static { $this->estado = $e; return $this; }

    public function getPrioridad(): ?string { return $this->prioridad; }
    public function setPrioridad(?string $p): static { $this->prioridad = $p; return $this; }

    // ── Campos calculados (expuestos en la API) ────────────────────────────

    // Devuelve true si la fecha programada ya pasó y el plan sigue Activo.
    #[Groups(['plan:read'])]
    public function isVencido(): bool
    {
        if (!$this->fechaProximoMantenimiento || $this->estado !== 'Activo') {
            return false;
        }
        $hoy = new \DateTime();
        $hoy->setTime(0, 0, 0);
        return $this->fechaProximoMantenimiento < $hoy;
    }

    // Devuelve true si vence dentro de los próximos 7 días (sin estar ya vencido).
    #[Groups(['plan:read'])]
    public function isProximoAVencer(): bool
    {
        if (!$this->fechaProximoMantenimiento || $this->estado !== 'Activo') {
            return false;
        }
        if ($this->isVencido()) {
            return false;
        }
        $limite = (new \DateTime())->modify('+7 days');
        return $this->fechaProximoMantenimiento <= $limite;
    }

    // Calcula y devuelve los días restantes (positivo = futuro, negativo = vencido).
    #[Groups(['plan:read'])]
    public function getDiasRestantes(): ?int
    {
        if (!$this->fechaProximoMantenimiento) {
            return null;
        }
        $hoy = new \DateTime();
        $hoy->setTime(0, 0, 0);
        $diff = $hoy->diff($this->fechaProximoMantenimiento);
        $dias = (int) $diff->days;
        return $this->fechaProximoMantenimiento >= $hoy ? $dias : -$dias;
    }
}
