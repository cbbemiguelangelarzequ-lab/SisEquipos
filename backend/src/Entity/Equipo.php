<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\EquipoRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: EquipoRepository::class)]
#[ORM\Table(name: 'equipo')]
#[ApiResource]
class Equipo
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 100, unique: true)]
    private ?string $codigoInventario = null;

    #[ORM\Column(type: 'string', length: 200)]
    private ?string $nombre = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $marca = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $modelo = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $numeroSerie = null;

    #[ORM\ManyToOne(targetEntity: CategoriaEquipo::class, inversedBy: 'equipos')]
    #[ORM\JoinColumn(name: 'categoria_id', referencedColumnName: 'id')]
    private ?CategoriaEquipo $categoria = null;

    #[ORM\ManyToOne(targetEntity: Seccion::class, inversedBy: 'equipos')]
    #[ORM\JoinColumn(name: 'seccion_id', referencedColumnName: 'id')]
    private ?Seccion $seccion = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(name: 'usuario_asignado_id', referencedColumnName: 'id', nullable: true)]
    private ?Usuario $usuarioAsignado = null;

    #[ORM\ManyToOne(targetEntity: EstadoEquipo::class, inversedBy: 'equipos')]
    #[ORM\JoinColumn(name: 'estado_id', referencedColumnName: 'id')]
    private ?EstadoEquipo $estado = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $fechaAdquisicion = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $fechaProximoMantenimiento = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $observaciones = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $vidaUtilMeses = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $creadoEn = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $actualizadoEn = null;

    #[ORM\OneToMany(mappedBy: 'equipo', targetEntity: ComponenteEquipo::class)]
    private Collection $componentes;

    #[ORM\OneToMany(mappedBy: 'equipo', targetEntity: FotoEquipo::class)]
    private Collection $fotos;

    public function __construct()
    {
        $this->componentes = new ArrayCollection();
        $this->fotos = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getCodigoInventario(): ?string { return $this->codigoInventario; }
    public function setCodigoInventario(string $codigoInventario): static { $this->codigoInventario = $codigoInventario; return $this; }

    public function getNombre(): ?string { return $this->nombre; }
    public function setNombre(string $nombre): static { $this->nombre = $nombre; return $this; }

    public function getMarca(): ?string { return $this->marca; }
    public function setMarca(?string $marca): static { $this->marca = $marca; return $this; }

    public function getModelo(): ?string { return $this->modelo; }
    public function setModelo(?string $modelo): static { $this->modelo = $modelo; return $this; }

    public function getNumeroSerie(): ?string { return $this->numeroSerie; }
    public function setNumeroSerie(?string $numeroSerie): static { $this->numeroSerie = $numeroSerie; return $this; }

    public function getCategoria(): ?CategoriaEquipo { return $this->categoria; }
    public function setCategoria(?CategoriaEquipo $categoria): static { $this->categoria = $categoria; return $this; }

    public function getSeccion(): ?Seccion { return $this->seccion; }
    public function setSeccion(?Seccion $seccion): static { $this->seccion = $seccion; return $this; }

    public function getUsuarioAsignado(): ?Usuario { return $this->usuarioAsignado; }
    public function setUsuarioAsignado(?Usuario $usuarioAsignado): static { $this->usuarioAsignado = $usuarioAsignado; return $this; }

    public function getEstado(): ?EstadoEquipo { return $this->estado; }
    public function setEstado(?EstadoEquipo $estado): static { $this->estado = $estado; return $this; }

    public function getFechaAdquisicion(): ?\DateTimeInterface { return $this->fechaAdquisicion; }
    public function setFechaAdquisicion(?\DateTimeInterface $fecha): static { $this->fechaAdquisicion = $fecha; return $this; }

    public function getFechaProximoMantenimiento(): ?\DateTimeInterface { return $this->fechaProximoMantenimiento; }
    public function setFechaProximoMantenimiento(?\DateTimeInterface $fecha): static { $this->fechaProximoMantenimiento = $fecha; return $this; }

    public function getObservaciones(): ?string { return $this->observaciones; }
    public function setObservaciones(?string $observaciones): static { $this->observaciones = $observaciones; return $this; }

    public function getCreadoEn(): ?\DateTimeInterface { return $this->creadoEn; }
    public function setCreadoEn(?\DateTimeInterface $creadoEn): static { $this->creadoEn = $creadoEn; return $this; }

    public function getActualizadoEn(): ?\DateTimeInterface { return $this->actualizadoEn; }
    public function setActualizadoEn(?\DateTimeInterface $actualizadoEn): static { $this->actualizadoEn = $actualizadoEn; return $this; }

    public function getComponentes(): Collection { return $this->componentes; }
    public function getFotos(): Collection { return $this->fotos; }

    public function getVidaUtilMeses(): ?int
    {
        return $this->vidaUtilMeses;
    }

    public function setVidaUtilMeses(?int $vidaUtilMeses): static
    {
        $this->vidaUtilMeses = $vidaUtilMeses;
        return $this;
    }

    /**
     * Calcula la fecha estimada de fin de vida útil.
     */
    public function getFechaFinVidaUtil(): ?\DateTimeInterface
    {
        if (!$this->fechaAdquisicion || !$this->vidaUtilMeses) {
            return null;
        }

        $fechaFin = clone $this->fechaAdquisicion;
        $fechaFin->modify('+' . $this->vidaUtilMeses . ' months');
        
        return $fechaFin;
    }

    /**
     * Devuelve verdadero si el equipo ya superó su tiempo de vida útil.
     */
    public function isObsoleto(): bool
    {
        $fechaFin = $this->getFechaFinVidaUtil();
        
        if (!$fechaFin) {
            return false;
        }
        
        return new \DateTime() > $fechaFin;
    }

    /**
     * Devuelve el porcentaje de vida útil consumido (0 a 100).
     */
    public function getPorcentajeVidaUtilConsumido(): ?float
    {
        if (!$this->fechaAdquisicion || !$this->vidaUtilMeses) {
            return null;
        }

        $fechaFin = $this->getFechaFinVidaUtil();
        $hoy = new \DateTime();

        if ($hoy < $this->fechaAdquisicion) {
            return 0.0;
        }

        if ($hoy >= $fechaFin) {
            return 100.0;
        }

        $diasTotales = $this->fechaAdquisicion->diff($fechaFin)->days;
        $diasTranscurridos = $this->fechaAdquisicion->diff($hoy)->days;

        if ($diasTotales === 0) {
            return 100.0;
        }

        return round(($diasTranscurridos / $diasTotales) * 100, 2);
    }
}
