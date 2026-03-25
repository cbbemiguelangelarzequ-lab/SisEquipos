<?php

namespace App\Command;

use App\Entity\Usuario;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(name: 'app:create-admin', description: 'Crea un usuario administrador con contraseña cifrada')]
class CreateAdminCommand extends Command
{
    private $entityManager;
    private $passwordHasher;

    public function __construct(EntityManagerInterface $entityManager, UserPasswordHasherInterface $passwordHasher)
    {
        $this->entityManager = $entityManager;
        $this->passwordHasher = $passwordHasher;
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $email = 'admin@cps.gob.bo';
        $user = $this->entityManager->getRepository(Usuario::class)->findOneBy(['email' => $email]);
        
        if ($user) {
            $output->writeln('El usuario ' . $email . ' ya existe en la base de datos.');
            return Command::SUCCESS;
        }

        $user = new Usuario();
        $user->setNombre('Administrador del Sistema');
        $user->setEmail($email);
        $user->setCreadoEn(new \DateTime());
        
        $hashedPassword = $this->passwordHasher->hashPassword($user, 'admin123');
        $user->setPassword($hashedPassword);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $output->writeln('Administrador creado:'. "\nEmail: " . $email . "\nPassword: " . 'admin123');

        return Command::SUCCESS;
    }
}
