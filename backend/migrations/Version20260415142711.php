<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260415142711 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE seccion ADD centro_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE seccion ADD CONSTRAINT FK_E0BD15C9298137A7 FOREIGN KEY (centro_id) REFERENCES centro (id)');
        $this->addSql('CREATE INDEX IDX_E0BD15C9298137A7 ON seccion (centro_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE seccion DROP FOREIGN KEY FK_E0BD15C9298137A7');
        $this->addSql('DROP INDEX IDX_E0BD15C9298137A7 ON seccion');
        $this->addSql('ALTER TABLE seccion DROP centro_id');
    }
}
