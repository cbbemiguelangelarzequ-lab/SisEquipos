<?php

namespace App\Security;

use App\Entity\Usuario;
use App\Repository\UsuarioRepository;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

class UserByEmailOrCarnetProvider implements UserProviderInterface
{
    public function __construct(private UsuarioRepository $usuarioRepository)
    {
    }

    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        // Buscar primero por email, luego por carnet
        $user = $this->usuarioRepository->findOneBy(['email' => $identifier])
            ?? $this->usuarioRepository->findOneBy(['carnet' => $identifier]);

        if (!$user) {
            throw new UserNotFoundException(sprintf('Usuario "%s" no encontrado.', $identifier));
        }

        return $user;
    }

    public function refreshUser(UserInterface $user): UserInterface
    {
        return $this->loadUserByIdentifier($user->getUserIdentifier());
    }

    public function supportsClass(string $class): bool
    {
        return Usuario::class === $class || is_subclass_of($class, Usuario::class);
    }
}
