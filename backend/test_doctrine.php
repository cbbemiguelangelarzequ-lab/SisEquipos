<?php

require 'vendor/autoload.php';

use Symfony\Component\Dotenv\Dotenv;

$dotenv = new Dotenv();
$dotenv->loadEnv(__DIR__.'/../.env');

$kernel = new App\Kernel('dev', true);
$kernel->boot();

$em = $kernel->getContainer()->get('doctrine')->getManager();
try {
    $equipos = $em->getRepository(App\Entity\Equipo::class)->findAll();
    echo "Hydrated " . count($equipos) . " Equipos successfully.\n";
    
    // Now test API platform normalization
    $normalizer = $kernel->getContainer()->get('serializer');
    $normalized = $normalizer->normalize($equipos, 'json', ['groups' => ['equipo:read']]);
    echo "Normalized successfully. Count: " . count($normalized) . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
} catch (\Error $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
}
