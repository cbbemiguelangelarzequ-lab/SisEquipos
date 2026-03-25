<?php

$file = __DIR__ . '/vendor/api-platform/symfony/Bundle/DependencyInjection/ApiPlatformExtension.php';

if (!file_exists($file)) {
    die("El archivo no existe.\n");
}

$content = file_get_contents($file);

// El bloque a remover:
// if (isset($container->getParameterBag()->all()['lexik_jwt_authentication.api_platform.check_path'])) {
//     $container->prependExtensionConfig('lexik_jwt_authentication', ['api_platform' => ['enabled' => true]]);
// }

$pattern = '/if\s*\(\s*isset\(\$container->getParameterBag\(\)->all\(\)\[\'lexik_jwt_authentication\.api_platform\.check_path\'\]\)\s*\)\s*\{\s*\$container->prependExtensionConfig\(\'lexik_jwt_authentication\'\s*,\s*\[\'api_platform\'\s*=>\s*\[\'enabled\'\s*=>\s*true\]\]\);\s*\}/s';

$newContent = preg_replace($pattern, '', $content);

if ($newContent !== $content) {
    file_put_contents($file, $newContent);
    echo "Parche aplicado correctamente.\n";
} else {
    echo "El bloque no fue encontrado o ya fue parcheado.\n";
}
