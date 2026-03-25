<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260320184744 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE categoria_equipo (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(100) NOT NULL, descripcion LONGTEXT DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE componente_equipo (id INT AUTO_INCREMENT NOT NULL, descripcion VARCHAR(200) DEFAULT NULL, numero_serie VARCHAR(100) DEFAULT NULL, estado VARCHAR(50) DEFAULT NULL, fecha_instalacion DATE DEFAULT NULL, equipo_id INT DEFAULT NULL, tipo_componente_id INT DEFAULT NULL, INDEX IDX_99AE7A1423BFBED (equipo_id), INDEX IDX_99AE7A14BF50A21A (tipo_componente_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE equipo (id INT AUTO_INCREMENT NOT NULL, codigo_inventario VARCHAR(100) NOT NULL, nombre VARCHAR(200) NOT NULL, marca VARCHAR(100) DEFAULT NULL, modelo VARCHAR(100) DEFAULT NULL, numero_serie VARCHAR(100) DEFAULT NULL, fecha_adquisicion DATE DEFAULT NULL, fecha_proximo_mantenimiento DATE DEFAULT NULL, observaciones LONGTEXT DEFAULT NULL, creado_en DATETIME DEFAULT NULL, actualizado_en DATETIME DEFAULT NULL, categoria_id INT DEFAULT NULL, seccion_id INT DEFAULT NULL, usuario_asignado_id INT DEFAULT NULL, estado_id INT DEFAULT NULL, UNIQUE INDEX UNIQ_C49C530BFF61677D (codigo_inventario), INDEX IDX_C49C530B3397707A (categoria_id), INDEX IDX_C49C530B7A5A413A (seccion_id), INDEX IDX_C49C530B7BB06BE1 (usuario_asignado_id), INDEX IDX_C49C530B9F5A440B (estado_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE estado_equipo (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(100) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE foto_equipo (id INT AUTO_INCREMENT NOT NULL, url_foto VARCHAR(500) NOT NULL, descripcion VARCHAR(200) DEFAULT NULL, subido_en DATETIME DEFAULT NULL, equipo_id INT DEFAULT NULL, INDEX IDX_F74DF95223BFBED (equipo_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE historial_mantenimiento (id INT AUTO_INCREMENT NOT NULL, accion_realizada LONGTEXT DEFAULT NULL, costo NUMERIC(10, 2) DEFAULT NULL, fecha_mantenimiento DATETIME DEFAULT NULL, equipo_id INT DEFAULT NULL, solicitud_id INT DEFAULT NULL, tecnico_id INT DEFAULT NULL, estado_equipo_resultante_id INT DEFAULT NULL, INDEX IDX_6EC5338E23BFBED (equipo_id), UNIQUE INDEX UNIQ_6EC5338E1CB9D6E4 (solicitud_id), INDEX IDX_6EC5338E841DB1E7 (tecnico_id), INDEX IDX_6EC5338EA654F656 (estado_equipo_resultante_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE reemplazo_componente (id INT AUTO_INCREMENT NOT NULL, motivo_cambio LONGTEXT DEFAULT NULL, historial_mantenimiento_id INT DEFAULT NULL, componente_retirado_id INT DEFAULT NULL, repuesto_utilizado_id INT DEFAULT NULL, INDEX IDX_3CF725B6928FA0DB (historial_mantenimiento_id), UNIQUE INDEX UNIQ_3CF725B6A13479A4 (componente_retirado_id), UNIQUE INDEX UNIQ_3CF725B662FD58FA (repuesto_utilizado_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE repuesto_inventario (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(200) NOT NULL, numero_serie VARCHAR(100) DEFAULT NULL, cantidad INT DEFAULT 1 NOT NULL, estado VARCHAR(50) NOT NULL, fecha_ingreso DATETIME DEFAULT NULL, tipo_componente_id INT DEFAULT NULL, INDEX IDX_B121E09FBF50A21A (tipo_componente_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE rol (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(100) NOT NULL, descripcion LONGTEXT DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE seccion (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(150) NOT NULL, ubicacion_fisica VARCHAR(150) DEFAULT NULL, descripcion LONGTEXT DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE solicitud_mantenimiento (id INT AUTO_INCREMENT NOT NULL, descripcion_falla LONGTEXT DEFAULT NULL, estado_solicitud VARCHAR(50) NOT NULL, prioridad VARCHAR(50) DEFAULT NULL, fecha_solicitud DATETIME DEFAULT NULL, fecha_resolucion DATETIME DEFAULT NULL, equipo_id INT DEFAULT NULL, solicitante_id INT DEFAULT NULL, tecnico_asignado_id INT DEFAULT NULL, INDEX IDX_F1B11EF323BFBED (equipo_id), INDEX IDX_F1B11EF3C680A87 (solicitante_id), INDEX IDX_F1B11EF3FAA3A141 (tecnico_asignado_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE tipo_componente (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(150) NOT NULL, descripcion LONGTEXT DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE usuario (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(180) NOT NULL, email VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, creado_en DATETIME DEFAULT NULL, actualizado_en DATETIME DEFAULT NULL, rol_id INT DEFAULT NULL, UNIQUE INDEX UNIQ_2265B05DE7927C74 (email), INDEX IDX_2265B05D4BAB96C (rol_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE componente_equipo ADD CONSTRAINT FK_99AE7A1423BFBED FOREIGN KEY (equipo_id) REFERENCES equipo (id)');
        $this->addSql('ALTER TABLE componente_equipo ADD CONSTRAINT FK_99AE7A14BF50A21A FOREIGN KEY (tipo_componente_id) REFERENCES tipo_componente (id)');
        $this->addSql('ALTER TABLE equipo ADD CONSTRAINT FK_C49C530B3397707A FOREIGN KEY (categoria_id) REFERENCES categoria_equipo (id)');
        $this->addSql('ALTER TABLE equipo ADD CONSTRAINT FK_C49C530B7A5A413A FOREIGN KEY (seccion_id) REFERENCES seccion (id)');
        $this->addSql('ALTER TABLE equipo ADD CONSTRAINT FK_C49C530B7BB06BE1 FOREIGN KEY (usuario_asignado_id) REFERENCES usuario (id)');
        $this->addSql('ALTER TABLE equipo ADD CONSTRAINT FK_C49C530B9F5A440B FOREIGN KEY (estado_id) REFERENCES estado_equipo (id)');
        $this->addSql('ALTER TABLE foto_equipo ADD CONSTRAINT FK_F74DF95223BFBED FOREIGN KEY (equipo_id) REFERENCES equipo (id)');
        $this->addSql('ALTER TABLE historial_mantenimiento ADD CONSTRAINT FK_6EC5338E23BFBED FOREIGN KEY (equipo_id) REFERENCES equipo (id)');
        $this->addSql('ALTER TABLE historial_mantenimiento ADD CONSTRAINT FK_6EC5338E1CB9D6E4 FOREIGN KEY (solicitud_id) REFERENCES solicitud_mantenimiento (id)');
        $this->addSql('ALTER TABLE historial_mantenimiento ADD CONSTRAINT FK_6EC5338E841DB1E7 FOREIGN KEY (tecnico_id) REFERENCES usuario (id)');
        $this->addSql('ALTER TABLE historial_mantenimiento ADD CONSTRAINT FK_6EC5338EA654F656 FOREIGN KEY (estado_equipo_resultante_id) REFERENCES estado_equipo (id)');
        $this->addSql('ALTER TABLE reemplazo_componente ADD CONSTRAINT FK_3CF725B6928FA0DB FOREIGN KEY (historial_mantenimiento_id) REFERENCES historial_mantenimiento (id)');
        $this->addSql('ALTER TABLE reemplazo_componente ADD CONSTRAINT FK_3CF725B6A13479A4 FOREIGN KEY (componente_retirado_id) REFERENCES componente_equipo (id)');
        $this->addSql('ALTER TABLE reemplazo_componente ADD CONSTRAINT FK_3CF725B662FD58FA FOREIGN KEY (repuesto_utilizado_id) REFERENCES repuesto_inventario (id)');
        $this->addSql('ALTER TABLE repuesto_inventario ADD CONSTRAINT FK_B121E09FBF50A21A FOREIGN KEY (tipo_componente_id) REFERENCES tipo_componente (id)');
        $this->addSql('ALTER TABLE solicitud_mantenimiento ADD CONSTRAINT FK_F1B11EF323BFBED FOREIGN KEY (equipo_id) REFERENCES equipo (id)');
        $this->addSql('ALTER TABLE solicitud_mantenimiento ADD CONSTRAINT FK_F1B11EF3C680A87 FOREIGN KEY (solicitante_id) REFERENCES usuario (id)');
        $this->addSql('ALTER TABLE solicitud_mantenimiento ADD CONSTRAINT FK_F1B11EF3FAA3A141 FOREIGN KEY (tecnico_asignado_id) REFERENCES usuario (id)');
        $this->addSql('ALTER TABLE usuario ADD CONSTRAINT FK_2265B05D4BAB96C FOREIGN KEY (rol_id) REFERENCES rol (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE componente_equipo DROP FOREIGN KEY FK_99AE7A1423BFBED');
        $this->addSql('ALTER TABLE componente_equipo DROP FOREIGN KEY FK_99AE7A14BF50A21A');
        $this->addSql('ALTER TABLE equipo DROP FOREIGN KEY FK_C49C530B3397707A');
        $this->addSql('ALTER TABLE equipo DROP FOREIGN KEY FK_C49C530B7A5A413A');
        $this->addSql('ALTER TABLE equipo DROP FOREIGN KEY FK_C49C530B7BB06BE1');
        $this->addSql('ALTER TABLE equipo DROP FOREIGN KEY FK_C49C530B9F5A440B');
        $this->addSql('ALTER TABLE foto_equipo DROP FOREIGN KEY FK_F74DF95223BFBED');
        $this->addSql('ALTER TABLE historial_mantenimiento DROP FOREIGN KEY FK_6EC5338E23BFBED');
        $this->addSql('ALTER TABLE historial_mantenimiento DROP FOREIGN KEY FK_6EC5338E1CB9D6E4');
        $this->addSql('ALTER TABLE historial_mantenimiento DROP FOREIGN KEY FK_6EC5338E841DB1E7');
        $this->addSql('ALTER TABLE historial_mantenimiento DROP FOREIGN KEY FK_6EC5338EA654F656');
        $this->addSql('ALTER TABLE reemplazo_componente DROP FOREIGN KEY FK_3CF725B6928FA0DB');
        $this->addSql('ALTER TABLE reemplazo_componente DROP FOREIGN KEY FK_3CF725B6A13479A4');
        $this->addSql('ALTER TABLE reemplazo_componente DROP FOREIGN KEY FK_3CF725B662FD58FA');
        $this->addSql('ALTER TABLE repuesto_inventario DROP FOREIGN KEY FK_B121E09FBF50A21A');
        $this->addSql('ALTER TABLE solicitud_mantenimiento DROP FOREIGN KEY FK_F1B11EF323BFBED');
        $this->addSql('ALTER TABLE solicitud_mantenimiento DROP FOREIGN KEY FK_F1B11EF3C680A87');
        $this->addSql('ALTER TABLE solicitud_mantenimiento DROP FOREIGN KEY FK_F1B11EF3FAA3A141');
        $this->addSql('ALTER TABLE usuario DROP FOREIGN KEY FK_2265B05D4BAB96C');
        $this->addSql('DROP TABLE categoria_equipo');
        $this->addSql('DROP TABLE componente_equipo');
        $this->addSql('DROP TABLE equipo');
        $this->addSql('DROP TABLE estado_equipo');
        $this->addSql('DROP TABLE foto_equipo');
        $this->addSql('DROP TABLE historial_mantenimiento');
        $this->addSql('DROP TABLE reemplazo_componente');
        $this->addSql('DROP TABLE repuesto_inventario');
        $this->addSql('DROP TABLE rol');
        $this->addSql('DROP TABLE seccion');
        $this->addSql('DROP TABLE solicitud_mantenimiento');
        $this->addSql('DROP TABLE tipo_componente');
        $this->addSql('DROP TABLE usuario');
    }
}
