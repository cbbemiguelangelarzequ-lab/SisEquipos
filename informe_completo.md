# Informe de Avance del Proyecto: SisEquipos

Sistema de Control y Seguimiento de Equipos Caja Petrolera de Salud



## Introducción

El presente informe describe de manera detallada el trabajo realizado durante el desarrollo del proyecto SisEquipos, un sistema integral diseñado para gestionar, controlar y dar seguimiento a los equipos tecnológicos y médicos de la Caja Petrolera de Salud. El documento abarca desde la configuración del entorno de desarrollo, pasando por el diseño del modelo de datos, la implementación del frontend en React, hasta las recientes optimizaciones del código y nuevos módulos de transferencias y reportes técnicos individuales, explicando las decisiones técnicas tomadas a lo largo del proceso.



## 1. Entorno de Desarrollo y Tecnologías Utilizadas

Para el desarrollo de este sistema se optó por un stack tecnológico moderno y ampliamente respaldado por la industria. El backend fue construido sobre Symfony 6.4, un framework PHP de largo soporte (LTS), utilizando PHP 8.1.10 como lenguaje base y Composer 2.8 como gestor de paquetes.

La base de datos seleccionada fue MySQL, administrada mediante MySQL Workbench, con una instancia llamada sis_equipos_cps y credenciales locales de desarrollo bajo el usuario root.



## 2. Paquetes y Dependencias del Backend

Se instalaron las siguientes librerías para cubrir las necesidades específicas del sistema:

- API Platform (v3.x): Nos permitió generar de manera automática y completa todos los endpoints REST del sistema, evitando la escritura manual de controladores repetitivos.
- Doctrine ORM y Migrations: Se encargan de traducir las entidades PHP directamente a tablas en MySQL, facilitando el versionado del esquema de la base de datos.
- Lexik JWT Authentication (v2.18): Implementa el estándar de autenticación mediante JSON Web Tokens, garantizando conexiones seguras y sin estado (stateless).
- Nelmio CORS Bundle: Configura los encabezados de acceso cruzado para permitir que el frontend (alojado en un origen distinto) se comunique sin restricciones con el backend.
- Symfony Maker Bundle: Herramienta de desarrollo para generar rápidamente clases, comandos y controladores mediante la consola.
- Symfony Validator y Serializer: Módulos de soporte para validar datos de entrada y transformar objetos PHP a formato JSON.
- Dompdf: Utilizado para la generación dinámica de reportes y fichas técnicas detalladas en formato PDF.



## 3. Diseño del Modelo de Datos

Se realizó un análisis cuidadoso de los requerimientos del sistema, lo cual derivó en la creación de múltiples entidades que representan fielmente la estructura operativa de la organización:

1. Rol Define los niveles de acceso y jerarquía dentro del sistema.
2. Usuario Almacena las credenciales de acceso, incluyendo correo electrónico, carnet de identidad y contraseña cifrada, vinculada a un rol específico. Se permite inicio de sesión dual (correo o carnet).
3. Sección Representa las ubicaciones físicas donde se distribuyen los equipos. Se modificó la arquitectura para que cada catálogo de Sección esté estrictamente descentralizado y vinculado a un Centro médico específico, impidiendo el cruce de datos entre diferentes hospitales.
4. Categoría de Equipo Clasifica los equipos por tipo.
5. Estado de Equipo Refleja la condición actual de cada equipo.
6. Tipo de Componente Describe las categorías de piezas internas.
7. Repuesto de Inventario Controla el stock disponible de componentes de repuesto en bodega.
8. Equipo Entidad central del sistema, enlazada a su sección, categoría y estado actual.
9. Componente de Equipo Registra qué piezas están instaladas actualmente dentro de cada equipo.
10. Foto de Equipo Galería de imágenes asociadas a los equipos.
11. Mantenimientos Gestiona las solicitudes, historiales y reemplazo de componentes técnicos.
12. Transferencia de Activo Documenta el traslado de equipos entre centros y secciones, guardando fecha, motivo, responsables y el estado de la solicitud.
13. Plan Mantenimiento Preventivo Agenda de futuras mantenciones basadas en frecuencia predefinida y cálculo automático de expiración.

Una vez definidas todas las entidades con sus relaciones, claves foráneas y restricciones, se ejecutó la migración de base de datos de forma exitosa, generando automáticamente las tablas en MySQL con integridad referencial completa.



## 4. Seguridad y Autenticación JWT

Generación de Llaves Criptográficas

El primer desafío fue generar las llaves RSA necesarias para la firma de tokens JWT mediante OpenSSL. Esto permitió configurar exitosamente los archivos private.pem y public.pem requeridos por Lexik JWT.

Endpoint de Login y Dual Login

Se configuró el punto de acceso API respectivo. El sistema permite ahora una autenticación dual, donde los usuarios pueden ingresar utilizando su correo electrónico institucional o su carnet de identidad, validando contra una contraseña cifrada (BCrypt/Sodium) y devolviendo un token JWT válido.

Protección de Datos Sensibles

Se implementaron grupos de serialización en la entidad Usuario para controlar qué campos se exponen en las respuestas de la API. Las contraseñas cifradas nunca son devueltas al consultar usuarios.



## 5. Lógica de Negocio Avanzada

Más allá de las operaciones básicas de lectura y escritura, se incorporaron reglas de negocio específicas y complejas:

- Campo de vida útil: Se añadió el campo para registrar la duración esperada de cada equipo y calcular fechas de expiración.
- Detección de equipos obsoletos: Identifica rápidamente qué equipos necesitan reemplazo en la infraestructura.
- Porcentaje de vida consumida: Calcula un valor entre 0% y 100% que indica cuánto de la vida útil del equipo ya ha transcurrido.
- Mantenimientos Preventivos: Lógica matemática de cálculo de fechas futuras de mantenimiento, alertando visualmente al personal qué equipos están próximos a vencer o ya han vencido.
- Transferencias Descentralizadas: Reglas de privacidad estrictas donde un usuario administrador de un centro específico solo puede ver e interactuar con las transferencias que entran o salen de su propio centro. Los superusuarios mantienen acceso global sin restricciones.



## 6. Desarrollo del Frontend en React

Configuración del Proyecto

El frontend fue inicializado utilizando Vite como empaquetador, React 19 como biblioteca de interfaz y TypeScript como lenguaje de tipado estricto. 

Cliente HTTP con Axios y Enrutamiento

Se configuró una instancia centralizada de Axios que inyecta automáticamente el token JWT en cada solicitud y detecta sesiones expiradas para proteger las vistas. Se organizó la navegación en rutas públicas y privadas mediante react-router-dom.

Diseño Visual e Interfaces Modulares

- Login: Formulario dual ágil y adaptativo.
- Dashboard: Panel de métricas en tiempo real con gráficos estadísticos, alertas críticas de mantenimientos y conteo de transferencias pendientes por atender.
- Inventario: Listados dinámicos de equipos con barras de progreso de su vida útil.
- Transferencias: Asistente visual e intuitivo para mover equipos de un centro a otro, con aprobación interactiva (mediante modales) de las transferencias entrantes o salientes.
- Branding Institucional: Se aplicó fielmente la identidad visual de la Caja Petrolera de Salud en toda la plataforma.



## 7. Sistema de Mantenimiento y Reportes PDF

Flujo de Mantenimiento Integral

Se implementó un ciclo completo y profesional para los tickets de soporte, desde la Solicitud Inicial hasta el Historial Final. Este flujo incluye la carga de Evidencias Fotográficas en formato Base64 directamente hacia la base de datos, eliminando por completo la dependencia de servidores de archivos estáticos externos.

Gestión Rigurosa de Stock e Inventario Financiero

El sistema realiza cálculos automatizados en tiempo real: al utilizar repuestos en un trabajo, deduce con exactitud el inventario físico disponible en la bodega y consolida el costo total del mantenimiento automáticamente sumando los precios unitarios correspondientes.

Ficha Técnica y Reportes Institucionales en PDF

Se diseñaron, desde cero, formatos de reporte con la máxima exigencia institucional. La Ficha Técnica Individual permite a los administradores generar un documento vertical que detalla exhaustivamente todas las características de un equipo, la tabla completa de sus partes internas y componentes instalados, el recuento histórico de sus reparaciones técnicas y su traza de ubicaciones (origen y destinos), convirtiéndolo en un documento de auditoría altamente confiable.



## 8. Optimizaciones, Refactorización y Limpieza de Código

Para garantizar la estabilidad y profesionalismo del código fuente antes de un pase inminente a producción, se ejecutaron las siguientes mejoras técnicas de alto impacto:

- Normalización de Datos Masivos: Se desarrollaron comandos (CLI) que limpiaron más de 1,400 activos heredados. Dichos scripts extrajeron marcas, modelos y componentes que venían incrustados erróneamente en el texto del nombre del equipo original, migrándolos de forma relacional y precisa.
- Limpieza de Scripts de Prueba: Se purgaron de manera sistemática más de 20 archivos de depuración (PHP, Python, logs de error y volcados JSON) creados a lo largo de las etapas de pruebas, dejando un entorno de carpetas impecable.
- Optimización de Comentarios y Formato: Mediante rutinas automáticas especializadas, se barrieron los extensos y densos bloques de comentarios PHPDoc antiguos, reemplazándolos por comentarios en línea modernos y sutiles, reduciendo notablemente el peso visual y mejorando la legibilidad de las clases del sistema.
- Estandarización de Interfaz: Se eliminaron las antiguas alertas nativas y bloqueantes del navegador. En su reemplazo, se construyeron ventanas modales de confirmación amigables y personalizadas, lo cual no solo elevó el nivel estético, sino que previno eficazmente los borrados accidentales de información.



## Conclusión

El proyecto SisEquipos ha evolucionado de forma excepcionalmente exitosa, escalando desde la concepción teórica de su modelo de datos hasta consolidarse como una plataforma integral, robusta y estable. 

El backend ofrece una protección férrea a través de criptografía JWT, garantizando un control de acceso descentralizado perfecto entre centros médicos y proveyendo la automatización requerida en procesos delicados como las transferencias de patrimonio y los registros de mantenimiento. Por su parte, el frontend entrega al usuario final una experiencia de vanguardia, completamente sintonizada con la identidad corporativa de la institución, resultando fluida, rápida y sumamente intuitiva de operar. 

Con todos los módulos operativos al cien por ciento, una base de código totalmente saneada, y un ecosistema de reportes profesionales en formato PDF, el sistema supera su propósito original y está listo para brindar a la Caja Petrolera de Salud una solución digital de última tecnología para la administración e inspección técnica de su vital infraestructura de equipos tecnológicos.

Documento actualizado y redactado como aval descriptivo del avance en el proceso de pasantía. Caja Petrolera de Salud.
