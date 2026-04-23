<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260417132956 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE foto_equipo DROP FOREIGN KEY FK_F74DF95223BFBED');
        $this->addSql('DROP TABLE foto_equipo');
        $this->addSql('ALTER TABLE categoria_equipo DROP descripcion, DROP vida_util_por_defecto_meses');
        $this->addSql('ALTER TABLE centro DROP direccion');
        $this->addSql('ALTER TABLE equipo DROP FOREIGN KEY FK_C49C530B7BB06BE1');
        $this->addSql('DROP INDEX IDX_C49C530B7BB06BE1 ON equipo');
        $this->addSql('ALTER TABLE equipo DROP fecha_proximo_mantenimiento, DROP creado_en, DROP actualizado_en, DROP usuario_asignado_id');
        $this->addSql('ALTER TABLE evidencia_mantenimiento DROP subido_en');
        $this->addSql('ALTER TABLE reemplazo_componente DROP FOREIGN KEY FK_3CF725B6A13479A4');
        $this->addSql('DROP INDEX IDX_3CF725B6A13479A4 ON reemplazo_componente');
        $this->addSql('ALTER TABLE reemplazo_componente DROP componente_retirado_id');
        $this->addSql('ALTER TABLE repuesto_inventario DROP fecha_ingreso');
        $this->addSql('ALTER TABLE rol DROP descripcion');
        $this->addSql('ALTER TABLE seccion DROP ubicacion_fisica, DROP descripcion');
        $this->addSql('ALTER TABLE solicitud_mantenimiento DROP FOREIGN KEY FK_F1B11EF3FAA3A141');
        $this->addSql('DROP INDEX IDX_F1B11EF3FAA3A141 ON solicitud_mantenimiento');
        $this->addSql('ALTER TABLE solicitud_mantenimiento DROP tecnico_asignado_id');
        $this->addSql('ALTER TABLE tipo_componente DROP descripcion');
        $this->addSql('ALTER TABLE usuario DROP creado_en, DROP actualizado_en');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE foto_equipo (id INT AUTO_INCREMENT NOT NULL, url_foto VARCHAR(500) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_0900_ai_ci`, descripcion VARCHAR(200) CHARACTER SET utf8mb4 DEFAULT NULL COLLATE `utf8mb4_0900_ai_ci`, subido_en DATETIME DEFAULT NULL, equipo_id INT DEFAULT NULL, INDEX IDX_F74DF95223BFBED (equipo_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_0900_ai_ci` ENGINE = InnoDB COMMENT = \'\' ');
        $this->addSql('ALTER TABLE foto_equipo ADD CONSTRAINT FK_F74DF95223BFBED FOREIGN KEY (equipo_id) REFERENCES equipo (id) ON UPDATE NO ACTION ON DELETE CASCADE');
        $this->addSql('ALTER TABLE categoria_equipo ADD descripcion LONGTEXT DEFAULT NULL, ADD vida_util_por_defecto_meses INT DEFAULT NULL');
        $this->addSql('ALTER TABLE equipo ADD fecha_proximo_mantenimiento DATE DEFAULT NULL, ADD creado_en DATETIME DEFAULT NULL, ADD actualizado_en DATETIME DEFAULT NULL, ADD usuario_asignado_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE equipo ADD CONSTRAINT FK_C49C530B7BB06BE1 FOREIGN KEY (usuario_asignado_id) REFERENCES usuario (id) ON UPDATE NO ACTION ON DELETE NO ACTION');
        $this->addSql('CREATE INDEX IDX_C49C530B7BB06BE1 ON equipo (usuario_asignado_id)');
        $this->addSql('ALTER TABLE solicitud_mantenimiento ADD tecnico_asignado_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE solicitud_mantenimiento ADD CONSTRAINT FK_F1B11EF3FAA3A141 FOREIGN KEY (tecnico_asignado_id) REFERENCES usuario (id) ON UPDATE NO ACTION ON DELETE NO ACTION');
        $this->addSql('CREATE INDEX IDX_F1B11EF3FAA3A141 ON solicitud_mantenimiento (tecnico_asignado_id)');
        $this->addSql('ALTER TABLE centro ADD direccion VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE seccion ADD ubicacion_fisica VARCHAR(150) DEFAULT NULL, ADD descripcion LONGTEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE evidencia_mantenimiento ADD subido_en DATETIME NOT NULL');
        $this->addSql('ALTER TABLE reemplazo_componente ADD componente_retirado_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE reemplazo_componente ADD CONSTRAINT FK_3CF725B6A13479A4 FOREIGN KEY (componente_retirado_id) REFERENCES componente_equipo (id) ON UPDATE NO ACTION ON DELETE NO ACTION');
        $this->addSql('CREATE INDEX IDX_3CF725B6A13479A4 ON reemplazo_componente (componente_retirado_id)');
        $this->addSql('ALTER TABLE usuario ADD creado_en DATETIME DEFAULT NULL, ADD actualizado_en DATETIME DEFAULT NULL');
        $this->addSql('ALTER TABLE tipo_componente ADD descripcion LONGTEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE repuesto_inventario ADD fecha_ingreso DATETIME DEFAULT NULL');
        $this->addSql('ALTER TABLE rol ADD descripcion LONGTEXT DEFAULT NULL');
    }
}
