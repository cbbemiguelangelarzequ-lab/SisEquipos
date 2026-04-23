<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260327180714 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE centro (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(150) NOT NULL, direccion VARCHAR(255) DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE categoria_equipo ADD vida_util_por_defecto_meses INT DEFAULT NULL');
        $this->addSql('ALTER TABLE equipo ADD centro_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE equipo ADD CONSTRAINT FK_C49C530B298137A7 FOREIGN KEY (centro_id) REFERENCES centro (id)');
        $this->addSql('CREATE INDEX IDX_C49C530B298137A7 ON equipo (centro_id)');
        $this->addSql('ALTER TABLE usuario ADD centro_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE usuario ADD CONSTRAINT FK_2265B05D298137A7 FOREIGN KEY (centro_id) REFERENCES centro (id)');
        $this->addSql('CREATE INDEX IDX_2265B05D298137A7 ON usuario (centro_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE centro');
        $this->addSql('ALTER TABLE categoria_equipo DROP vida_util_por_defecto_meses');
        $this->addSql('ALTER TABLE equipo DROP FOREIGN KEY FK_C49C530B298137A7');
        $this->addSql('DROP INDEX IDX_C49C530B298137A7 ON equipo');
        $this->addSql('ALTER TABLE equipo DROP centro_id');
        $this->addSql('ALTER TABLE usuario DROP FOREIGN KEY FK_2265B05D298137A7');
        $this->addSql('DROP INDEX IDX_2265B05D298137A7 ON usuario');
        $this->addSql('ALTER TABLE usuario DROP centro_id');
    }
}
