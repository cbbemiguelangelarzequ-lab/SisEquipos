<?php
require __DIR__.'/vendor/autoload.php';

use App\Kernel;
use Symfony\Component\Dotenv\Dotenv;

function shutDownFunction() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        file_put_contents('error_log.txt', print_r($error, true));
    }
}
register_shutdown_function('shutDownFunction');

(new Dotenv())->bootEnv(__DIR__.'/.env');
$kernel = new Kernel($_SERVER['APP_ENV'], (bool) $_SERVER['APP_DEBUG']);
try {
    $kernel->boot();
    $router = $kernel->getContainer()->get('router');
    $routes = $router->getRouteCollection();
    echo "Router OK. Rutas: " . count($routes) . "\n";
} catch (\Throwable $e) {
    file_put_contents('error_log.txt', $e->getMessage() . "\n" . $e->getTraceAsString());
}
