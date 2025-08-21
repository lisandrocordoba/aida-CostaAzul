# Clase 1

20/8/2025 – 17hs – Aula 1101

# Elección del MVP

**CLI – Centralizar La Información – Impresión de Certificado de Título en Trámite**

Basándonos en que el usuario tiene la información sobre alumnos en una planilla de cálculo
(con LU, nombre, título obtenido y fecha del trámite),
decidimos hacer una aplicación de línea de comandos que
suba la información de los alumnos y sus trámites a la base de datos [^1]
y desde ahí genere unos HTML con los certificados listos para imprimir.

Suponemos que esto se puede hacer en dos clases, el objetivo de esta clase
es instalar la infraestructura en la máquina del desarrollador,
generar una base de datos de ejemplo, lograr conectarse desde la aplicación _CLI_
y que el _CLI_ levante un archivo _csv_ y lo guarde en la base de datos.

[^1]: Si bien no estricamente necesario subir los datos a una base de datos
tiene sentido hacerlo en el contexto del taller
y podría tener sentido hacerlo en un contexto real donde
a la vez que se produce funcionalidad para el usuario
se va creando una arquitectura sólida del sistema.

# Pasos

## 1. Creación de la base de datos

En https://github.com/ari-dc-uba-ar/aida/commit/f1efde7f9f1b7c57f52b6c542d36de0c8e6f356d
1. Instalamos la última versión disponible y estable de [PostgreSQL](https://www.postgresql.org/docs/) y [Node.js](https://nodejs.org/es/download)
2. Creamos un archivo _csv_ de ejemplo con los datos que tendríamos que tener
3. Creamos un script para crear la base de datos (o sea el contenedor de los datos)
y los dos usuarios, el dueño de la base de datos
y el que se usará para conectarse desde la aplicación
4. Creamos otro script para generar el esquema de la base de datos
conteniendo la tabla de alumnos

### conceptos

Usando el ***PoMP*** _Principio de otorgar el Mínimo Permiso_[^2]
creamos dos usuarios de base de datos que no sean _superusuarios_.
* _aida_owner_ será el dueño de la base de datos que tendrá permiso
para crear, eliminar y modificar la estructura de las tablas
y otros objetos de la base de datos.
Ese usuario[^3] no tendrá permiso para conectarse a la base de dato,
sirve para separar la coexistencia de distintas bases de datos manejadas por el mismo motor.
* _aida_admin_ será el usuario con el que el _CLI_ (y luego el backend)
se conectarán a la base de datos,
ese usuario tendrá los mínimos permisos necesarios para hacer funcionar el sistema:
agregar, cambiar y borrar alumnos en la tabla alumnos.
Este usuario no necesita crear objetos de la base ni poder eliminar tablas
ni otros objetos.

[^2] Anderson, R. (2020). Distributed systems. In *Security engineering: A guide to building dependable distributed systems* (3rd ed., Cap 6). Wiley.

[^3] https://www.postgresql.org/docs/current/sql-createuser.html
