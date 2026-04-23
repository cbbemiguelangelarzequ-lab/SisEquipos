<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\UsuarioRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: UsuarioRepository::class)]
#[ORM\Table(name: 'usuario')]
#[ApiResource(
    normalizationContext: ['groups' => ['usuario:read']],
    denormalizationContext: ['groups' => ['usuario:write']],
    paginationClientEnabled: true
)]
class Usuario implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['usuario:read', 'solicitud:read', 'historial:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 180)]
    #[Groups(['usuario:read', 'usuario:write', 'solicitud:read', 'historial:read'])]
    private ?string $nombre = null;

    #[ORM\Column(type: 'string', length: 180, unique: true)]
    #[Groups(['usuario:read', 'usuario:write', 'solicitud:read', 'historial:read'])]
    private ?string $email = null;

    #[ORM\Column(type: 'string')]
    #[Groups(['usuario:write'])]
    private ?string $password = null;

    #[ORM\ManyToOne(targetEntity: Rol::class, inversedBy: 'usuarios')]
    #[ORM\JoinColumn(name: 'rol_id', referencedColumnName: 'id')]
    #[Groups(['usuario:read', 'usuario:write'])]
    private ?Rol $rol = null;

    #[ORM\ManyToOne(targetEntity: Centro::class, inversedBy: 'usuarios')]
    #[ORM\JoinColumn(name: 'centro_id', referencedColumnName: 'id', nullable: true)]
    #[Groups(['usuario:read', 'usuario:write'])]
    private ?Centro $centro = null;

    public function getId(): ?int { return $this->id; }

    public function getNombre(): ?string { return $this->nombre; }
    public function setNombre(string $nombre): static { $this->nombre = $nombre; return $this; }

    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }

    public function getUserIdentifier(): string { return (string) $this->email; }

    public function getRoles(): array { return ['ROLE_USER']; }

    public function getPassword(): ?string { return $this->password; }
    public function setPassword(string $password): static { $this->password = $password; return $this; }

    public function eraseCredentials(): void {}

    public function getRol(): ?Rol { return $this->rol; }
    public function setRol(?Rol $rol): static { $this->rol = $rol; return $this; }

    public function getCentro(): ?Centro { return $this->centro; }
    public function setCentro(?Centro $centro): static { $this->centro = $centro; return $this; }
}
