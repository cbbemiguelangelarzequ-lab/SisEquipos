<?php

namespace App\EventSubscriber;

use App\Entity\Usuario;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class JWTSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            'lexik_jwt_authentication.on_jwt_created' => 'onJWTCreated',
        ];
    }

    public function onJWTCreated(JWTCreatedEvent $event): void
    {
        $payload = $event->getData();
        $user = $event->getUser();

        if ($user instanceof Usuario) {
            $payload['id'] = $user->getId();
            
            if ($user->getRol()) {
                $payload['rol'] = $user->getRol()->getNombre();
            }
            
            if ($user->getCentro()) {
                $payload['centro_id'] = $user->getCentro()->getId();
                $payload['centro_nombre'] = $user->getCentro()->getNombre();
            }
        }

        $event->setData($payload);
    }
}
