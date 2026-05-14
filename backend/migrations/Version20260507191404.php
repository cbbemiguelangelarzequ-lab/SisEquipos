<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

// Auto-generated Migration: Please modify to your needs!
final class Version20260507191404 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE transferencia_activo (id INT AUTO_INCREMENT NOT NULL, fecha_solicitud DATETIME NOT NULL, fecha_transferencia DATETIME DEFAULT NULL, estado VARCHAR(50) NOT NULL, motivo VARCHAR(255) DEFAULT NULL, centro_origen_id INT DEFAULT NULL, centro_destino_id INT DEFAULT NULL, seccion_origen_id INT DEFAULT NULL, seccion_destino_id INT DEFAULT NULL, solicitado_por_id INT DEFAULT NULL, autorizado_por_id INT DEFAULT NULL, INDEX IDX_57F2401D86996FC0 (centro_origen_id), INDEX IDX_57F2401D9A92B159 (centro_destino_id), INDEX IDX_57F2401DF26078E4 (seccion_origen_id), INDEX IDX_57F2401DA6E5AC9F (seccion_destino_id), INDEX IDX_57F2401D8F99DE26 (solicitado_por_id), INDEX IDX_57F2401D16AE1F09 (autorizado_por_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE transferencia_item (id INT AUTO_INCREMENT NOT NULL, estado_activo VARCHAR(50) NOT NULL, transferencia_id INT NOT NULL, equipo_id INT NOT NULL, INDEX IDX_A701B58BED8531B4 (transferencia_id), INDEX IDX_A701B58B23BFBED (equipo_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE transferencia_activo ADD CONSTRAINT FK_57F2401D86996FC0 FOREIGN KEY (centro_origen_id) REFERENCES centro (id)');
        $this->addSql('ALTER TABLE transferencia_activo ADD CONSTRAINT FK_57F2401D9A92B159 FOREIGN KEY (centro_destino_id) REFERENCES centro (id)');
        $this->addSql('ALTER TABLE transferencia_activo ADD CONSTRAINT FK_57F2401DF26078E4 FOREIGN KEY (seccion_origen_id) REFERENCES seccion (id)');
        $this->addSql('ALTER TABLE transferencia_activo ADD CONSTRAINT FK_57F2401DA6E5AC9F FOREIGN KEY (seccion_destino_id) REFERENCES seccion (id)');
        $this->addSql('ALTER TABLE transferencia_activo ADD CONSTRAINT FK_57F2401D8F99DE26 FOREIGN KEY (solicitado_por_id) REFERENCES usuario (id)');
        $this->addSql('ALTER TABLE transferencia_activo ADD CONSTRAINT FK_57F2401D16AE1F09 FOREIGN KEY (autorizado_por_id) REFERENCES usuario (id)');
        $this->addSql('ALTER TABLE transferencia_item ADD CONSTRAINT FK_A701B58BED8531B4 FOREIGN KEY (transferencia_id) REFERENCES transferencia_activo (id)');
        $this->addSql('ALTER TABLE transferencia_item ADD CONSTRAINT FK_A701B58B23BFBED FOREIGN KEY (equipo_id) REFERENCES equipo (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE transferencia_activo DROP FOREIGN KEY FK_57F2401D86996FC0');
        $this->addSql('ALTER TABLE transferencia_activo DROP FOREIGN KEY FK_57F2401D9A92B159');
        $this->addSql('ALTER TABLE transferencia_activo DROP FOREIGN KEY FK_57F2401DF26078E4');
        $this->addSql('ALTER TABLE transferencia_activo DROP FOREIGN KEY FK_57F2401DA6E5AC9F');
        $this->addSql('ALTER TABLE transferencia_activo DROP FOREIGN KEY FK_57F2401D8F99DE26');
        $this->addSql('ALTER TABLE transferencia_activo DROP FOREIGN KEY FK_57F2401D16AE1F09');
        $this->addSql('ALTER TABLE transferencia_item DROP FOREIGN KEY FK_A701B58BED8531B4');
        $this->addSql('ALTER TABLE transferencia_item DROP FOREIGN KEY FK_A701B58B23BFBED');
        $this->addSql('DROP TABLE transferencia_activo');
        $this->addSql('DROP TABLE transferencia_item');
    }
}
