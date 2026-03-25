# Informe Detallado: Proyecto SisEquipos (Backend)

Este documento detalla todas las configuraciones, implementaciones y resoluciones de problemas realizadas hasta el momento en el backend del *Sistema de Control y Seguimiento de Equipos de la Caja Petrolera de Salud*.

## 1. Entorno de Desarrollo y Framework
- **Lenguaje:** PHP 8.1.10.
- **Framework Ocupado:** Symfony 6.4 (esqueleto base).
- **Gestor de Dependencias:** Composer 2.8.
- **Base de Datos:** MySQL (con Workbench). 
  - **Base de datos:** `sis_equipos_cps`
  - **Usuario:** `root`
  - **Contraseña:** `micvis02`

## 2. Dependencias y Paquetes Core Instalados
Se instalaron librerías especializadas para agilizar el desarrollo de una API profesional:
- `api-platform/core` (versión 3.x): Para generar de forma instantánea todos los endpoints (Rutas) API RESTful.
- `doctrine/orm-pack` y `doctrine/doctrine-migrations-bundle`: Para mapear objetos directamente a tablas SQL.
- `lexik/jwt-authentication-bundle` (v2.18): Estándar de la industria para generar JSON Web Tokens (JWT) seguros.
- `nelmio/cors-bundle`: Para permitir el acceso desde interfaces gráficas separadas (como React o Vue) al backend.
- `symfony/maker-bundle`: Utilidad para crear clases, comandos y controladores rápidamente.
- Módulos de validación: `symfony/validator` y `symfony/serializer-pack`.

## 3. Modelo de Datos Entidad-Relación (13 Tablas)
Se analizaron los requerimientos iniciales y se transcribieron en 13 Entidades en Symfony (usando PHP Atributos para Doctrine):
1. **Rol:** Jerarquías del sistema.
2. **Usuario:** Credenciales y rol asociado (`email`, `password` hasheada).
3. **Seccion:** Ubicaciones físicas.
4. **CategoriaEquipo:** Ej. Computadoras, Impresoras.
5. **EstadoEquipo:** Operativo, Reparación, Baja.
6. **TipoComponente:** RAM, Discos Duros.
7. **RepuestoInventario:** Componentes para stock y repuestos.
8. **Equipo:** Tabla central, vincula sección, categoría y estado.
9. **ComponenteEquipo:** Elementos actualmente instalados dentro de un Equipo.
10. **FotoEquipo:** Galería de imágenes vinculada a los equipos.
11. **SolicitudMantenimiento:** Peticiones hechas por los usuarios sobre equipos dañados.
12. **HistorialMantenimiento:** Bitácora de las reparaciones realizadas e informes técnicos.
13. **ReemplazoComponente:** Rastreo individual de los repuestos consumidos en un mantenimiento y retirados del inventario.

> Tras generar estas 13 entidades, se ejecutó la Migración de SQL exitosamente, poblando la base de datos MySQL con todas sus claves foráneas.

## 4. Configuración de Seguridad y JWT
1. **Generación de Llaves RSA:** 
   Debido a una ausencia nativa de comandos OpenSSL en el PowerShell de Windows, se diseñó un script PHP local que utilizó explícitamente el archivo [openssl.cnf](file:///C:/laragon/bin/php/php-8.1.10-Win32-vs16-x64/extras/ssl/openssl.cnf) de Laragon. Esto nos permitió generar satisfactoriamente `private.pem` y `public.pem`.
2. **Endpoint de Autenticación (`/api/login_check`):**
   Se configuró el router [routes.yaml](file:///c:/Users/Usuario/Documents/Pasantia/SisEquipos/backend/config/routes.yaml) y el firewall ([security.yaml](file:///c:/Users/Usuario/Documents/Pasantia/SisEquipos/backend/config/packages/security.yaml)). El sistema ahora escucha peticiones POST con un JSON estructurado así:
   `{"email": "...", "password": "..."}`
3. **Ocultamiento de Contraseñas (Serialización):**
   Se configuraron **Grupos de Lectura/Escritura** en la tabla **Usuario** (`#[Groups]`) para asegurar que nuestra API jamás devuelva o imprima las contraseñas cifradas al consultar usuarios por la API RESTful.
4. **Script Generador de Usuarios Administradores:**
   Dado que las contraseñas deben estar guardadas al estilo *hash* unidireccional (BCrypt/Sodium), hemos elaborado un comando en la consola de Symfony (`php bin/console app:create-admin`) que inserta un superusuario funcional automáticamente y cifra su contraseña.
   - **Superusuario Inyectado:** `admin@cps.gob.bo`
   - **Contraseña:** `admin123`

## 5. Caza de Bugs (Troubleshooting) y Depuración
El proyecto enfrentó considerables desafíos en las configuraciones de versiones al tratar de acoplar Symfony 6.4 (LTS estable) con API Platform v3 y Lexik JWT. Todas resueltas:
- **Conflicto JWT + API Platform (v3.4.0):** API Platform v3 trae una configuración obligatoria conflictiva que inyectaba bloques YAML corrompidos en el `LexikJWT`. Esto se parchó diseñando un limpiador en PHP para eludir temporalmente la lógica dañada dentro del script fuente original hasta lograr mitigarlo a través de [api_platform.yaml](file:///c:/Users/Usuario/Documents/Pasantia/SisEquipos/backend/config/routes/api_platform.yaml).
- **Conflicto de Validaciones y Query Parameters:** Se deshabilitó la introspección GraphQL y se activó el `validator` de Symfony manualmente en [framework.yaml](file:///c:/Users/Usuario/Documents/Pasantia/SisEquipos/backend/config/packages/framework.yaml) porque el framework minimalista carecía de servicios internos (ej. `query_parameter_validate`) que API Platform solicitaba por obligación para arrancar y esto crasheaba la consola.
- **Compatibilidad del Analizador de Documentación:** Hubo incompatibilidades con `symfony/property-info` versión 6 que no soportaba la versión 6 de `phpdocumentor`. Efectuamos *downgrades* precisos y seguros de las librerías `phpdocumentor/reflection-docblock` y `phpdocumentor/type-resolver` con Composer hacia las versiones correctas que restauraron la compatibilidad mutua.
- **Intelephense (Falsos Positivos VS Code):** Se modificó tu archivo [.vscode/settings.json](file:///c:/Users/Usuario/Documents/Pasantia/SisEquipos/backend/.vscode/settings.json) para indicarle al analizador de código de la IDE que ignorara la carpeta `vendor`, silenciando más de cien errores "fantasma".

## 6. Estado Actual del Software
1. **Base de Datos:** Disponible, Relacionada e Íntegra.
2. **CRUD API:** Totalmente operativo (Ruteo exitosamente validado con 88 Endpoints expuestos, incluyendo filtrados y métodos GET/POST/PUT/DELETE).
3. **Seguridad Firewall:** Implementada y validada en modo JWT Stateless.

**Todo está compilado y listo para que las conexiones desde Frontends o Postman comiencen a consumir los datos y la lógica.**

## 7. Fase 2: Lógica de Negocio Avanzada
Durante esta fase, comprobamos y nos aseguramos de la total automatización de la API gracias a **API Platform**:
1. **Atributos `#[ApiResource]`**: Todo el inventario (`Equipo`, `Seccion`, `CategoriaEquipo`, etc.) ha sido expuesto con operaciones CRUD transaccionales completas (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
2. **Cálculo de Vida Útil**: Se actualizó la lógica de la entidad `Equipo` agregando nuevas columnas y métodos virtuales calculados al vuelo por el Backend:
   - Nuevo campo `vidaUtilMeses`.
   - Fechas calculadas dinámicamente: `getFechaFinVidaUtil` (sumando meses a la fecha de adquisición).
   - Discriminación y porcentajes: `isObsoleto` (booleano) y `getPorcentajeVidaUtilConsumido` (0 a 100%).

## 8. Fase 3: Iniciando Frontend en React
Para el frontend que consumirá la API de Symfony de manera asíncrona, se ha avanzado rápidamente con la arquitectura central:
1. **Configuración Inicial del Proyecto**: 
   - Generación del esqueleto usando **Vite** + **React** + **TypeScript**. Esto asegura tiempos de carga y compilación casi nulos en el servidor de desarrollo en frío. 
2. **Setup de Servicios y Autenticación Global (Global State)**:
   - Implementado el **AuthContext** (`src/context/AuthContext.tsx`), que lee, almacena y decodifica localmente el Json Web Token usando `jwt-decode`.
   - Cliente **Axios** en `src/services/api.ts` interceptando todas las peticiones salientes para inyectar automáticamente la cabecera `Authorization: Bearer <token>`, manejando respuestas nulas o caducadas y expulsando iterativamente al usuario si el token vence (Código 401).
3. **Enrutamiento Protegido**:
   - Vía `react-router-dom`, organizando rutas públicas (Pantalla Login) y privadas (`Layout` del Dashboard).
4. **Diseño Visual e Interfaces (UI)**:
   - Elaborado mediante Vanilla CSS moderno (`index.css`) sin dependencias externas pesadas.
   - **Login.tsx**: Formulario diseñado, centrado, validado y responsivo, consumiendo directamente a través de un `POST` el endpoint `/api/login_check` originado en el Symfony.
   - **Optimización del Dashboard**: Se integró Tailwind CSS v4 para construir un panel de métricas avanzado, utilizando `recharts` para gráficos de anillos y barras interactivas, e implementando consultas cacheadas mediante `@tanstack/react-query`.
   - **Módulos de Inventario y Secciones**: Las pantallas faltantes del inventario se completaron (`Inventario.tsx` y `Secciones.tsx`), conectando tablas inteligentes, visualizadores dinámicos de vida útil de equipos, y componentes modulares de tarjetas para gestionar las ubicaciones. Todo consumiendo los endpoints de Doctrine.
   - **Branding Institucional**: Se aplicó una capa de personalización completa sobre los CSS (tanto en Tailwind como variables nativas) extrayendo la identidad corporativa color Teal (#3e7365) del logotipo oficial de la Caja Petrolera de Salud, junto al logo dinámico en la Sidebar superior y los favicons del navegador.

> **Hito Alcanzado:** La Fase 3 (Estructura y flujos básicos del FrontEnd) ha sido concluida al 100%. La aplicación reacciona en tiempo real a las métricas e inventarios de la Base de Datos.
