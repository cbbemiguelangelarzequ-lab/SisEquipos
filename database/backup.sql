CREATE DATABASE  IF NOT EXISTS `sis_equipos_cps` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sis_equipos_cps`;
-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: sis_equipos_cps
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categoria_equipo`
--

DROP TABLE IF EXISTS `categoria_equipo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria_equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoria_equipo`
--

LOCK TABLES `categoria_equipo` WRITE;
/*!40000 ALTER TABLE `categoria_equipo` DISABLE KEYS */;
INSERT INTO `categoria_equipo` VALUES (1,'Monitores',NULL),(2,'CPU',NULL),(3,'Impresoras',NULL),(4,'Fotocopiadoras',NULL),(5,'Teléfonos',NULL),(6,'Laptops',NULL),(7,'Routers',NULL),(8,'Teclados',NULL);
/*!40000 ALTER TABLE `categoria_equipo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `componente_equipo`
--

DROP TABLE IF EXISTS `componente_equipo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `componente_equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(200) DEFAULT NULL,
  `numero_serie` varchar(100) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `fecha_instalacion` date DEFAULT NULL,
  `equipo_id` int DEFAULT NULL,
  `tipo_componente_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_99AE7A1423BFBED` (`equipo_id`),
  KEY `IDX_99AE7A14BF50A21A` (`tipo_componente_id`),
  CONSTRAINT `FK_99AE7A1423BFBED` FOREIGN KEY (`equipo_id`) REFERENCES `equipo` (`id`),
  CONSTRAINT `FK_99AE7A14BF50A21A` FOREIGN KEY (`tipo_componente_id`) REFERENCES `tipo_componente` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `componente_equipo`
--

LOCK TABLES `componente_equipo` WRITE;
/*!40000 ALTER TABLE `componente_equipo` DISABLE KEYS */;
/*!40000 ALTER TABLE `componente_equipo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctrine_migration_versions`
--

DROP TABLE IF EXISTS `doctrine_migration_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctrine_migration_versions` (
  `version` varchar(191) NOT NULL,
  `executed_at` datetime DEFAULT NULL,
  `execution_time` int DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctrine_migration_versions`
--

LOCK TABLES `doctrine_migration_versions` WRITE;
/*!40000 ALTER TABLE `doctrine_migration_versions` DISABLE KEYS */;
INSERT INTO `doctrine_migration_versions` VALUES ('DoctrineMigrations\\Version20260320184744','2026-03-20 18:47:59',3372),('DoctrineMigrations\\Version20260325140131','2026-03-25 14:02:04',208);
/*!40000 ALTER TABLE `doctrine_migration_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipo`
--

DROP TABLE IF EXISTS `equipo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo_inventario` varchar(100) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `marca` varchar(100) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `numero_serie` varchar(100) DEFAULT NULL,
  `fecha_adquisicion` date DEFAULT NULL,
  `fecha_proximo_mantenimiento` date DEFAULT NULL,
  `observaciones` longtext,
  `creado_en` datetime DEFAULT NULL,
  `actualizado_en` datetime DEFAULT NULL,
  `categoria_id` int DEFAULT NULL,
  `seccion_id` int DEFAULT NULL,
  `usuario_asignado_id` int DEFAULT NULL,
  `estado_id` int DEFAULT NULL,
  `vida_util_meses` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_C49C530BFF61677D` (`codigo_inventario`),
  KEY `IDX_C49C530B3397707A` (`categoria_id`),
  KEY `IDX_C49C530B7A5A413A` (`seccion_id`),
  KEY `IDX_C49C530B7BB06BE1` (`usuario_asignado_id`),
  KEY `IDX_C49C530B9F5A440B` (`estado_id`),
  CONSTRAINT `FK_C49C530B3397707A` FOREIGN KEY (`categoria_id`) REFERENCES `categoria_equipo` (`id`),
  CONSTRAINT `FK_C49C530B7A5A413A` FOREIGN KEY (`seccion_id`) REFERENCES `seccion` (`id`),
  CONSTRAINT `FK_C49C530B7BB06BE1` FOREIGN KEY (`usuario_asignado_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `FK_C49C530B9F5A440B` FOREIGN KEY (`estado_id`) REFERENCES `estado_equipo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipo`
--

LOCK TABLES `equipo` WRITE;
/*!40000 ALTER TABLE `equipo` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estado_equipo`
--

DROP TABLE IF EXISTS `estado_equipo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estado_equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estado_equipo`
--

LOCK TABLES `estado_equipo` WRITE;
/*!40000 ALTER TABLE `estado_equipo` DISABLE KEYS */;
/*!40000 ALTER TABLE `estado_equipo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `foto_equipo`
--

DROP TABLE IF EXISTS `foto_equipo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foto_equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `url_foto` varchar(500) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `subido_en` datetime DEFAULT NULL,
  `equipo_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_F74DF95223BFBED` (`equipo_id`),
  CONSTRAINT `FK_F74DF95223BFBED` FOREIGN KEY (`equipo_id`) REFERENCES `equipo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `foto_equipo`
--

LOCK TABLES `foto_equipo` WRITE;
/*!40000 ALTER TABLE `foto_equipo` DISABLE KEYS */;
/*!40000 ALTER TABLE `foto_equipo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_mantenimiento`
--

DROP TABLE IF EXISTS `historial_mantenimiento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_mantenimiento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `accion_realizada` longtext,
  `costo` decimal(10,2) DEFAULT NULL,
  `fecha_mantenimiento` datetime DEFAULT NULL,
  `equipo_id` int DEFAULT NULL,
  `solicitud_id` int DEFAULT NULL,
  `tecnico_id` int DEFAULT NULL,
  `estado_equipo_resultante_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_6EC5338E1CB9D6E4` (`solicitud_id`),
  KEY `IDX_6EC5338E23BFBED` (`equipo_id`),
  KEY `IDX_6EC5338E841DB1E7` (`tecnico_id`),
  KEY `IDX_6EC5338EA654F656` (`estado_equipo_resultante_id`),
  CONSTRAINT `FK_6EC5338E1CB9D6E4` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud_mantenimiento` (`id`),
  CONSTRAINT `FK_6EC5338E23BFBED` FOREIGN KEY (`equipo_id`) REFERENCES `equipo` (`id`),
  CONSTRAINT `FK_6EC5338E841DB1E7` FOREIGN KEY (`tecnico_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `FK_6EC5338EA654F656` FOREIGN KEY (`estado_equipo_resultante_id`) REFERENCES `estado_equipo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_mantenimiento`
--

LOCK TABLES `historial_mantenimiento` WRITE;
/*!40000 ALTER TABLE `historial_mantenimiento` DISABLE KEYS */;
/*!40000 ALTER TABLE `historial_mantenimiento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reemplazo_componente`
--

DROP TABLE IF EXISTS `reemplazo_componente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reemplazo_componente` (
  `id` int NOT NULL AUTO_INCREMENT,
  `motivo_cambio` longtext,
  `historial_mantenimiento_id` int DEFAULT NULL,
  `componente_retirado_id` int DEFAULT NULL,
  `repuesto_utilizado_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_3CF725B6A13479A4` (`componente_retirado_id`),
  UNIQUE KEY `UNIQ_3CF725B662FD58FA` (`repuesto_utilizado_id`),
  KEY `IDX_3CF725B6928FA0DB` (`historial_mantenimiento_id`),
  CONSTRAINT `FK_3CF725B662FD58FA` FOREIGN KEY (`repuesto_utilizado_id`) REFERENCES `repuesto_inventario` (`id`),
  CONSTRAINT `FK_3CF725B6928FA0DB` FOREIGN KEY (`historial_mantenimiento_id`) REFERENCES `historial_mantenimiento` (`id`),
  CONSTRAINT `FK_3CF725B6A13479A4` FOREIGN KEY (`componente_retirado_id`) REFERENCES `componente_equipo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reemplazo_componente`
--

LOCK TABLES `reemplazo_componente` WRITE;
/*!40000 ALTER TABLE `reemplazo_componente` DISABLE KEYS */;
/*!40000 ALTER TABLE `reemplazo_componente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `repuesto_inventario`
--

DROP TABLE IF EXISTS `repuesto_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `repuesto_inventario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `numero_serie` varchar(100) DEFAULT NULL,
  `cantidad` int NOT NULL DEFAULT '1',
  `estado` varchar(50) NOT NULL,
  `fecha_ingreso` datetime DEFAULT NULL,
  `tipo_componente_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_B121E09FBF50A21A` (`tipo_componente_id`),
  CONSTRAINT `FK_B121E09FBF50A21A` FOREIGN KEY (`tipo_componente_id`) REFERENCES `tipo_componente` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repuesto_inventario`
--

LOCK TABLES `repuesto_inventario` WRITE;
/*!40000 ALTER TABLE `repuesto_inventario` DISABLE KEYS */;
/*!40000 ALTER TABLE `repuesto_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol`
--

DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol`
--

LOCK TABLES `rol` WRITE;
/*!40000 ALTER TABLE `rol` DISABLE KEYS */;
/*!40000 ALTER TABLE `rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seccion`
--

DROP TABLE IF EXISTS `seccion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seccion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `ubicacion_fisica` varchar(150) DEFAULT NULL,
  `descripcion` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seccion`
--

LOCK TABLES `seccion` WRITE;
/*!40000 ALTER TABLE `seccion` DISABLE KEYS */;
/*!40000 ALTER TABLE `seccion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitud_mantenimiento`
--

DROP TABLE IF EXISTS `solicitud_mantenimiento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_mantenimiento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `descripcion_falla` longtext,
  `estado_solicitud` varchar(50) NOT NULL,
  `prioridad` varchar(50) DEFAULT NULL,
  `fecha_solicitud` datetime DEFAULT NULL,
  `fecha_resolucion` datetime DEFAULT NULL,
  `equipo_id` int DEFAULT NULL,
  `solicitante_id` int DEFAULT NULL,
  `tecnico_asignado_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_F1B11EF323BFBED` (`equipo_id`),
  KEY `IDX_F1B11EF3C680A87` (`solicitante_id`),
  KEY `IDX_F1B11EF3FAA3A141` (`tecnico_asignado_id`),
  CONSTRAINT `FK_F1B11EF323BFBED` FOREIGN KEY (`equipo_id`) REFERENCES `equipo` (`id`),
  CONSTRAINT `FK_F1B11EF3C680A87` FOREIGN KEY (`solicitante_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `FK_F1B11EF3FAA3A141` FOREIGN KEY (`tecnico_asignado_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitud_mantenimiento`
--

LOCK TABLES `solicitud_mantenimiento` WRITE;
/*!40000 ALTER TABLE `solicitud_mantenimiento` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitud_mantenimiento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_componente`
--

DROP TABLE IF EXISTS `tipo_componente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_componente` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `descripcion` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_componente`
--

LOCK TABLES `tipo_componente` WRITE;
/*!40000 ALTER TABLE `tipo_componente` DISABLE KEYS */;
/*!40000 ALTER TABLE `tipo_componente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(180) NOT NULL,
  `email` varchar(180) NOT NULL,
  `password` varchar(255) NOT NULL,
  `creado_en` datetime DEFAULT NULL,
  `actualizado_en` datetime DEFAULT NULL,
  `rol_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_2265B05DE7927C74` (`email`),
  KEY `IDX_2265B05D4BAB96C` (`rol_id`),
  CONSTRAINT `FK_2265B05D4BAB96C` FOREIGN KEY (`rol_id`) REFERENCES `rol` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'Administrador del Sistema','admin@cps.gob.bo','$2y$13$5g2dkdET85AHwaZVAAfUz.3eVqGQKWsy7HrjAgZZncyEX94KwAY0W','2026-03-20 19:30:14',NULL,NULL);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-27  8:59:54
