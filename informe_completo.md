# Informe de Avance del Proyecto: SisEquipos

**Sistema de Control y Seguimiento de Equipos — Caja Petrolera de Salud**

---

## Introducción

El presente informe describe de manera detallada el trabajo realizado durante el desarrollo del proyecto *SisEquipos*, un sistema integral diseñado para gestionar, controlar y dar seguimiento a los equipos tecnológicos y médicos de la Caja Petrolera de Salud. El documento abarca desde la configuración del entorno de desarrollo, pasando por el diseño del modelo de datos, hasta la implementación del frontend en React, explicando las decisiones técnicas tomadas y los problemas que se resolvieron a lo largo del proceso.

---

## 1. Entorno de Desarrollo y Tecnologías Utilizadas

Para el desarrollo de este sistema se optó por un stack tecnológico moderno y ampliamente respaldado por la industria. El backend fue construido sobre **Symfony 6.4**, un framework PHP de largo soporte (LTS), utilizando **PHP 8.1.10** como lenguaje base y **Composer 2.8** como gestor de paquetes.

La base de datos seleccionada fue **MySQL**, administrada mediante MySQL Workbench, con una instancia llamada `sis_equipos_cps` y credenciales locales de desarrollo bajo el usuario `root`.

---

## 2. Paquetes y Dependencias del Backend

Se instalaron las siguientes librerías para cubrir las necesidades específicas del sistema:

- **API Platform (v3.x):** Nos permitió generar de manera automática y completa todos los endpoints REST del sistema, evitando la escritura manual de controladores repetitivos.
- **Doctrine ORM y Migrations:** Se encargan de traducir las entidades PHP directamente a tablas en MySQL, facilitando el versionado del esquema de la base de datos.
- **Lexik JWT Authentication (v2.18):** Implementa el estándar de autenticación mediante JSON Web Tokens, garantizando conexiones seguras y sin estado (stateless).
- **Nelmio CORS Bundle:** Configura los encabezados de acceso cruzado para permitir que el frontend (alojado en un origen distinto) se comunique sin restricciones con el backend.
- **Symfony Maker Bundle:** Herramienta de desarrollo para generar rápidamente clases, comandos y controladores mediante la consola.
- **Symfony Validator y Serializer:** Módulos de soporte para validar datos de entrada y transformar objetos PHP a formato JSON.

---

## 3. Diseño del Modelo de Datos

Se realizó un análisis cuidadoso de los requerimientos del sistema, lo cual derivó en la creación de **13 entidades** que representan fielmente la estructura operativa de la organización:

1. **Rol** — Define los niveles de acceso y jerarquía dentro del sistema.
2. **Usuario** — Almacena las credenciales de acceso, incluyendo correo electrónico y contraseña cifrada, vinculada a un rol específico.
3. **Sección** — Representa las ubicaciones físicas donde se distribuyen los equipos. Se modificó la arquitectura para que cada catálogo de "Sección" esté estrictamente **descentralizado y vinculado a un Centro médico específico**, impidiendo el cruce de datos entre diferentes hospitales.
4. **Categoría de Equipo** — Clasifica los equipos por tipo, por ejemplo: computadoras, impresoras, servidores.
5. **Estado de Equipo** — Refleja la condición actual de cada equipo: operativo, en reparación, dado de baja, etc.
6. **Tipo de Componente** — Describe las categorías de piezas internas, como memorias RAM, discos duros o fuentes de poder.
7. **Repuesto de Inventario** — Controla el stock disponible de componentes de repuesto.
8. **Equipo** — Entidad central del sistema, enlazada a su sección, categoría y estado actual.
9. **Componente de Equipo** — Registra qué piezas están instaladas actualmente dentro de cada equipo.
10. **Foto de Equipo** — Galería de imágenes asociadas a los equipos para documentación visual.
11. **Solicitud de Mantenimiento** — Permite a los usuarios reportar fallas o solicitar reparaciones sobre equipos específicos.
12. **Historial de Mantenimiento** — Bitácora completa que documenta cada reparación realizada, con su informe técnico correspondiente.
13. **Reemplazo de Componente** — Trazabilidad individual de cada repuesto consumido durante un mantenimiento, conectando el historial con el inventario.
14. **Evidencia de Mantenimiento** — Soporte documental gráfico que permite adjuntar fotografías del antes y el después de una intervención técnica.

Una vez definidas todas las entidades con sus relaciones, claves foráneas y restricciones, se ejecutó la migración de base de datos de forma exitosa, generando automáticamente las 14 tablas en MySQL con integridad referencial completa.

---

## 4. Seguridad y Autenticación JWT

### Generación de Llaves Criptográficas

El primer desafío fue generar las llaves RSA necesarias para la firma de tokens JWT. El entorno de Windows con Laragon no disponía de OpenSSL accesible directamente desde PowerShell, por lo que se elaboró un script PHP personalizado que invocó el binario de OpenSSL incluido en Laragon, utilizando su archivo de configuración `openssl.cnf`. Esto permitió generar exitosamente los archivos `private.pem` y `public.pem` requeridos por Lexik JWT.

### Endpoint de Login

Se configuró el punto de acceso `/api/login_check` mediante los archivos `routes.yaml` y `security.yaml`. El endpoint acepta peticiones POST con un cuerpo JSON que contiene los campos `email` y `password`, devolviendo un token JWT válido cuando las credenciales son correctas.

### Protección de Datos Sensibles

Se implementaron grupos de serialización en la entidad `Usuario` para controlar qué campos se exponen en las respuestas de la API. Gracias a esta configuración, las contraseñas cifradas nunca son devueltas al consultar usuarios, eliminando un riesgo de seguridad común.

### Creación del Usuario Administrador

Dado que las contraseñas se almacenan mediante hash unidireccional (BCrypt/Sodium), no es posible crear usuarios directamente en la base de datos. Se desarrolló un comando personalizado de consola (`php bin/console app:create-admin`) que genera un superusuario de forma segura. Las credenciales del administrador por defecto son:

- **Correo:** `admin@cps.gob.bo`
- **Contraseña:** `admin123`

--- 

## 5. Resolución de Problemas y Depuración

La integración de Symfony 6.4 con API Platform v3 y Lexik JWT presentó varios desafíos técnicos que fueron resueltos de manera progresiva:

- **Conflicto entre JWT y API Platform v3:** API Platform v3 introdujo configuraciones que entraban en conflicto directo con la carga de rutas de Lexik JWT, generando errores al intentar compilar el contenedor de servicios. Se implementó un parche temporal mediante un script PHP que intercepta y corrige la configuración antes de que Symfony la procese, además de ajustes en `api_platform.yaml` para aliviar la carga.

- **Fallo en la validación de parámetros de consulta:** El framework base de Symfony 6.4 no incluía ciertos servicios internos que API Platform requería para validar parámetros de consulta (query parameters). Se solucionó deshabilitando temporalmente la introspección GraphQL y habilitando manualmente el validador de Symfony en `framework.yaml`.

- **Incompatibilidad de versiones en documentación de APIs:** La versión 6 de `symfony/property-info` no era compatible con la versión 6 de `phpdocumentor/reflection-docblock`, lo cual impedía la generación de la documentación automática. Se realizaron ajustes precisos en las versiones de las dependencias mediante Composer, bajando `phpdocumentor/reflection-docblock` a la versión `^5.2` para restaurar la compatibilidad.

- **Errores falsos en VS Code (Intelephense):** El analizador de código de Visual Studio Code mostraba más de cien errores fantasma al escanear la carpeta `vendor`. Se modificó el archivo `.vscode/settings.json` para excluir dicha carpeta del análisis, limpiando significativamente la experiencia de desarrollo.

---

## 6. Estado Actual del Backend

A la fecha de este informe, el backend se encuentra en un estado completamente funcional:

- La base de datos está operativa, con todas las relaciones configuradas y los datos íntegros.
- La API RESTful expone **88 endpoints** que cubren todas las operaciones CRUD (crear, leer, actualizar, eliminar) sobre cada entidad, incluyendo filtrado, paginación y búsqueda.
- El sistema de seguridad mediante JWT está implementado y validado en modo stateless, protegiendo todos los recursos salvo la ruta de autenticación pública.

El backend está listo para ser consumido por cualquier cliente HTTP, ya sea una aplicación frontend, herramientas como Postman, o servicios de terceros.

---

## 7. Lógica de Negocio Avanzada

Más allá de las operaciones básicas de lectura y escritura, se incorporaron reglas de negocio específicas en la entidad `Equipo` para proporcionar inteligencia operativa:

- **Campo de vida útil:** Se añadió el campo `vidaUtilMeses` para registrar la duración esperada de cada equipo.
- **Fecha de fin de vida útil:** El método `getFechaFinVidaUtil()` calcula dinámicamente cuándo expira la vida útil de un equipo, sumando los meses de vida útil a la fecha de adquisición.
- **Detección de equipos obsoletos:** El método `isObsoleto()` devuelve verdadero si la fecha actual supera la fecha de fin de vida útil, permitiendo identificar rápidamente qué equipos necesitan reemplazo.
- **Porcentaje de vida consumida:** El método `getPorcentajeVidaUtilConsumido()` calcula un valor entre 0% y 100% que indica cuánto de la vida útil del equipo ya ha transcurrido, útil para generar alertas preventivas.

---

## 8. Desarrollo del Frontend en React

### Configuración del Proyecto

El frontend fue inicializado utilizando **Vite** como empaquetador, **React 19** como biblioteca de interfaz y **TypeScript** como lenguaje. Esta combinación garantiza tiempos de compilación y recarga en caliente extremadamente rápidos durante el desarrollo.

### Sistema de Autenticación

Se implementó un contexto global de autenticación (`AuthContext`) que se encarga de:

- Leer el token JWT almacenado en el navegador al iniciar la aplicación.
- Decodificar el token usando la librería `jwt-decode` para extraer la información del usuario (correo y roles).
- Detectar automáticamente si el token ha expirado y cerrar la sesión si es necesario.

### Cliente HTTP con Axios

Se configuró una instancia centralizada de Axios (`api.ts`) que intercepta todas las peticiones HTTP para:

- Inyectar automáticamente la cabecera `Authorization: Bearer <token>` en cada solicitud.
- Detectar respuestas con código 401 (token expirado) y redirigir al usuario a la pantalla de login de forma transparente.

### Enrutamiento y Protección de Vistas

Mediante `react-router-dom`, se organizó la navegación en rutas públicas (pantalla de login) y rutas privadas (dashboard, inventario, secciones). Cualquier intento de acceder a una ruta protegida sin autenticación redirige automáticamente al login.

### Diseño Visual y Componentes

- **Login:** Formulario centrado, responsivo y validado que consume directamente el endpoint `/api/login_check` del backend Symfony.
- **Dashboard:** Panel de métricas en tiempo real que utiliza `recharts` para renderizar gráficos de barras y gráficos circulares, mostrando estadísticas como el total de equipos, mantenimientos por mes, solicitudes pendientes y costo total de reparaciones. Las consultas están optimizadas mediante `@tanstack/react-query` para cachear respuestas y evitar peticiones innecesarias.
- **Inventario:** Tabla dinámica con búsqueda por nombre o código de inventario, barras de progreso que indican el porcentaje de vida útil consumida por cada equipo, y acciones de edición y eliminación.
- **Secciones:** Módulo para gestionar las ubicaciones físicas donde se distribuyen los equipos, con visualización en formato de tarjetas.
- **Branding Institucional:** Se aplicó la identidad visual de la Caja Petrolera de Salud, utilizando el color corporativo teal (#3e7365) como color primario, el logotipo oficial en la barra lateral y tipografía coherente en toda la aplicación. El frontend utiliza una combinación de Tailwind CSS v4 para los componentes del dashboard y variables CSS personalizadas para el resto de la interfaz.

---

## 9. Módulo de Mantenimiento y Control de Roles

Durante las últimas fases del desarrollo, se priorizó la finalización del módulo de mantenimiento, que es el núcleo operativo del sistema, junto con un robusto control de accesos:

- **Flujo de Mantenimiento:** Se implementó un ciclo de vida completo para los tickets de soporte, desde la creación de una "Solicitud de Mantenimiento" hasta la finalización en un "Historial de Mantenimiento". Los usuarios pueden interactuar con interfaces dinámicas que muestran detalles técnicos e información del solicitante.
- **Mantenimiento Directo:** Se añadió un flujo de "Mantenimiento Directo" para permitir a los técnicos registrar intervenciones rápidas sin necesidad de un ticket previo.
- **Soporte de Evidencias Fotográficas (Base64):** Se configuraron las entidades (`EvidenciaMantenimiento`) para soportar tipos de dato `LONGTEXT` en la base de datos MySQL, lo que permitió procesar y guardar imágenes y fotografías ("antes y después" de la reparación) decodificadas directamente en flujos Base64 desde el frontend, evitando la sobrecarga de un servidor de archivos externo.
- **Gestión Rigurosa de Stock e Inventario:** Se ajustó la lógica transaccional para que, al momento de cerrar un mantenimiento con uso de repuestos, el sistema realice un precálculo asegurando que haya stock disponible y deduzca de manera exacta matemáticamente la cantidad usada de la tabla `Repuesto`.
- **Resolución de Conflictos de Relación de Entidades:** Se repararon errores de integridad de base de datos (relaciones `OneToOne`) al registrar reemplazos y generar mantenimientos múltiples desde una misma solicitud, reutilizando los historiales existentes inteligentemente en vez de forzar inserciones duplicadas.
- **Generación de Reportes:** Se integró la capacidad de generar informes diagnósticos imprimibles directamente desde el panel de tickets, mejorando la trazabilidad documental de cada reparación técnica.
- **Gestión de Roles y Permisos:** Se perfeccionó el control de acceso en la aplicación. El sistema ahora distingue entre "SuperUsuarios" (acceso completo) y "Usuarios Estándar" (limitados según su ubicación de trabajo). Las vistas de Administración se han restringido para proteger la información sensible.

---

## 10. Despliegue en Producción e Integración Final

El proyecto superó la fase local y se preparó para el entorno de producción de la institución:

- **Configuración de Servidor y Subdirectorios:** Para alojar el frontend dentro de un dominio institucional, se configuraron reglas precisas en el servidor Apache para servir desde el subdirectorio `/ecomcb/`. Esto implicó sincronizar las configuraciones de Vite y React Router (`basename`) para evitar problemas de enrutamiento y pantallas en blanco.
- **Integridad de Transacciones en la API:** Durante las pruebas en vivo del módulo de mantenimiento, se corrigieron bugs relacionados con la actualización de estados de los tickets. La interacción HTTP se refactorizó de peticiones `PUT` a peticiones `PATCH` específicas, asegurando la no sobrescritura accidental de datos y garantizando actualizaciones parciales 100% íntegras.
- **Optimización de Interfaz:** Se aplicaron filtros avanzados e interactivos para la visualización de los equipos, junto con modal expandibles para los historiales, garantizando rapidez y claridad visual en procesos con alto volumen de información.

---

## 11. Normalización de Datos Masivos y Limpieza de Inventario

Uno de los hitos más importantes para la estabilización del sistema fue la normalización de la base de datos heredada. El registro inicial constaba de más de 1,400 activos importados donde la columna `nombre` almacenaba información redundante y desestructurada (mezclando nombre semántico, marca, modelo, número de serie y especificaciones internas como la RAM o el CPU).

Para resolver este desafío sin comprometer la integridad del parque de equipos:
- **Scripts de Extracción (CLI):** Se diseñaron comandos personalizados de la consola de Symfony (`app:extraer-modelos`, `app:extraer-marcas`, `app:extraer-componentes`) que utilizaron expresiones regulares avanzadas para recorrer toda la base de datos.
- **Poblado Relacional:** La información técnica (CPU, RAM, Disco Duro) extraída del texto plano fue poblada automáticamente como registros individuales dentro de la entidad `ComponenteEquipo`.
- **Limpieza de Redundancias:** Un comando final (`app:limpiar-nombres`) se encargó de expurgar los textos redundantes (por ejemplo, removiendo la marca "INTEL" o el modelo "CORE I3" del nombre del activo), garantizando que columnas específicas como Marca, Modelo y Serie tomaran la responsabilidad de esos datos.
- **Mejoras de Tipado:** En paralelo, se refinaron las interfaces de TypeScript en React para manejar correctamente los valores nulos (`null`) resultantes de la normalización, evitando errores del compilador y caídas en la renderización del catálogo.

Esto dejó una tabla de interfaz gráfica limpia, profesional y libre de información duplicada visualmente.

---

## Conclusión

El proyecto SisEquipos ha evolucionado exitosamente desde la concepción del modelo de datos hasta convertirse en una plataforma integral estable, desplegada en un entorno de producción funcional. El backend ofrece seguridad robusta mediante JWT, control de acceso granular y una sólida lógica de negocio. El frontend, por su parte, entrega una experiencia moderna, en sintonía con la identidad de la institución, fluida e intuitiva. 

Con los módulos de mantenimiento activos, una base de código preparada para escalar y los problemas técnicos de infraestructura resueltos, el sistema cumple su propósito fundacional: proporcionar a la Caja Petrolera de Salud una herramienta efectiva, moderna y segura para el seguimiento integral de su parque de activos informáticos y equipos médicos.

---

*Documento actualizado y elaborado como parte del proceso de pasantía — Caja Petrolera de Salud.*
