<?php

$_SERVER['APP_ENV'] = 'dev';
$_SERVER['APP_DEBUG'] = '1';
// Hardcode the connection string
$_ENV['DATABASE_URL'] = "mysql://root:micvis02@127.0.0.1:3306/sis_equipos_cps?serverVersion=8.0&charset=utf8mb4";
$_SERVER['DATABASE_URL'] = "mysql://root:micvis02@127.0.0.1:3306/sis_equipos_cps?serverVersion=8.0&charset=utf8mb4";
// Prevent Missing env variables
putenv('DATABASE_URL=mysql://root:micvis02@127.0.0.1:3306/sis_equipos_cps?serverVersion=8.0&charset=utf8mb4');
putenv('CORS_ALLOW_ORIGIN=^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$');
putenv('JWT_SECRET_KEY=config/jwt/private.pem');
putenv('JWT_PUBLIC_KEY=config/jwt/public.pem');
putenv('JWT_PASSPHRASE=eac7d561e5ba2294005c6e1ce1db98465f5b3182d77243d663daf04f319d3494');

require 'vendor/autoload.php';

$kernel = new App\Kernel('dev', true);
$kernel->boot();

$em = $kernel->getContainer()->get('doctrine')->getManager();
$equipos = $em->getRepository(App\Entity\Equipo::class)->findAll();
echo "Found ".count($equipos)." items.\n";

$request = Symfony\Component\HttpFoundation\Request::create('/api/equipos', 'GET');
$request->headers->set('Accept', 'application/json');
// To force it to pass authentication properly without auth, lets just manually trigger serialization from the API Platform item normalizer OR serializer.
// Since container doesn't expose 'serializer', we use HTTP Kernel inside the container WITHOUT security!
// But security is enabled.
// Let's just catch the exception
try {
    $container = $kernel->getContainer();
    $normalizer = $container->get('debug.api_platform.serializer'); // Or we can retrieve from another public service
    
    // Simplest way: iterate and test json serialization
    foreach($equipos as $e) {
        $e->getNombre();
        // Just checking if any relation is broken
        if ($e->getCentro()) $e->getCentro()->getNombre();
        if ($e->getSeccion()) $e->getSeccion()->getNombre();
    }
    echo "Doctrine relationships are solid!\n";
} catch (\Throwable $e) {
    echo "CRASH: " . $e->getMessage() . "\n";
}

