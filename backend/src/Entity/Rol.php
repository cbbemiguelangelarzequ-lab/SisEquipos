<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\RolRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: RolRepository::class)]
#[ORM\Table(name: 'rol')]
#[ApiResource(
    paginationClientEnabled: true
)]
class Rol
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['usuario:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 100)]
    #[Groups(['usuario:read'])]
    private ?string $nombre = null;

    #[ORM\OneToMany(mappedBy: 'rol', targetEntity: Usuario::class)]
    private Collection $usuarios;

    public function __construct()
    {
        $this->usuarios = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getNombre(): ?string { return $this->nombre; }
    public function setNombre(string $nombre): static { $this->nombre = $nombre; return $this; }

    public function getUsuarios(): Collection { return $this->usuarios; }
}
