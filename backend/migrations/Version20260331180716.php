<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260331180716 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE repuesto_inventario ADD centro_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE repuesto_inventario ADD CONSTRAINT FK_B121E09F298137A7 FOREIGN KEY (centro_id) REFERENCES centro (id)');
        $this->addSql('CREATE INDEX IDX_B121E09F298137A7 ON repuesto_inventario (centro_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE repuesto_inventario DROP FOREIGN KEY FK_B121E09F298137A7');
        $this->addSql('DROP INDEX IDX_B121E09F298137A7 ON repuesto_inventario');
        $this->addSql('ALTER TABLE repuesto_inventario DROP centro_id');
    }
}
