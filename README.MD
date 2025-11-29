# AIDA – Adminstración Integral de Datos Académicos

Este es el repositorio correspondiente al Taller de Integración de Base de Datos.

Integrantes:

- Carlos Bottinelli L.U : 853/23
- Lisandro Córdoba Lazzaro L.U : 327/23
- Tiago Guerra L.U : 301/23
- Nicolás Marchetto L.U : 581/23

## Objetivo del Taller
El proyecto busca integrar base de datos, backend, frontend y procesos de despliegue, poniendo en práctica buenas prácticas de desarrollo y consideraciones de seguridad.

## Descripción del Sistema AIDA
Una facultad desea un sistema que centralice la información académica: resultados de alumnos, criterios automáticos para determinar elegibilidad para títulos, certificados, estadísticas de avance, egresos y deserción.

## Descripción de la Funcionalidad

La funcionalidad principal que agregamos fue la de distinguir roles de usuarios en el sistema. Los roles agregados son: alumno, profesor y secretario. Cada usuario puede tener más de un rol.

Luego de loguearse, el usuario accede a un menú de selección de roles. Si selecciona un rol que no posee, no avanza. Si selecciona un rol que posee, accede a un menu para ese rol. Para cualquier rol, el usuario puede cambiar su contraseña desde este menú. Además, cada rol puede acceder a diferentes funcionalidades:

### Alumno

- Ver materias cursadas.
- Si tiene título en trámite, puede descargar su certificado en .pdf.

### Profesor

- En su menú, ve una lista de las materias que dicta.
- Cuando accede a cada materia, puede cargar una cursada con su nota final, modificarla o eliminarla.

### Secretario

- Imprimir certificados en .pdf por LU y por fecha de trámite.
- Cargar alumnos, información de cursadas y planes de estudio de carreras con archivos .csv.
- Gestionar información de alumnos del sistema.
- Gestionar información de cursadas del sistema.
- Gestionar usuarios: dar de alta, editar datos y eliminar.
- Asignar profesores a materias.

## Características del Desarrollo

Cuando fue posible, generamos las tablas usando CRUD generico con un framework provisto por la cátedra, extendido para manejar tablas con JOIN y WHERE genéricos y para generar automáticamente los .html cada vez que carga el servidor.
En casos especiales, implementamos controllers, rutas y vistas particulares. Una prioridad futura para el proyecto sería abstraer el framework para manejar algunos casos particulares que tienen características comunes entre sí.
Para manejar los permisos de los distintos roles generamos middleware con dos enfoques:

- RequireRolApi en roles.ts y RequireRol en appRouter.ts permiten definir los roles que pueden acceder a un endpoint.
- RequireOwnershipAPI permite que un profesor o estudiante accedan a un endpoint por el método GET usando query parameters y chequea que sólo puedan ver los datos permitidos para ese usuario y rol.

## Instrucciones para levantar el proyecto

Este proyecto es una API web desarrollada en TypeScript, usando NPM para la gestión de dependencias y PostgreSQL como base de datos.

### Pasos para levantar el proyecto

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**
   Copiar el archivo de ejemplo `.env.example` a `.env` y completar las variables según tu entorno.


   Si la base de datos fue creada con nuestros scripts .sql, usar las siguientes variables:
   ```
   PGUSER=aida_admin
   PGPASSWORD=cambiar_esta_clave
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=aida_db
   ```
3. **Inicializar la base de datos**
   Ejecutar los scripts necesarios en el siguiente orden:
   - `creacion-db.sql`
   - `creacion-esquema.sql`
   - `carga-datos-prueba.sql`
   - `trigger-titulo.sql`

4. **Levantar la aplicación en modo desarrollo**
   ```bash
   npm run dev
    ```