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

[f1efde7](https://github.com/ari-dc-uba-ar/aida/commit/f1efde7f9f1b7c57f52b6c542d36de0c8e6f356d)

1. Instalamos la última versión disponible y estable de [PostgreSQL](https://www.postgresql.org/docs/) y [Node.js](https://nodejs.org/es/download)
2. Creamos un archivo _csv_ de ejemplo con los datos que tendríamos que tener
3. Creamos un script para crear la base de datos (o sea el contenedor de los datos)
y los dos usuarios, el dueño de la base de datos
y el que se usará para conectarse desde la aplicación
4. Creamos otro script para generar el esquema de la base de datos
conteniendo la tabla de alumnos

Usamos el pgAdmin (que se instaló con el PostgreSQL) para ejectuar estos scripts.
Para crea los usuarios y la base de datos fuimos ejecutando los comandos de a uno.
Luego refrescamos el panel donde se muestran las bases de datos para ver a `aida_db`
que fue recién creada.
Abrimos otro _Query Tool_ sobre esa base de datos para ejecutar el script de la creación del esquema.

### conceptos

Usando el ***PoMP*** _Principio de otorgar el Mínimo Permiso_ [^2]
creamos dos usuarios de base de datos que no sean _superusuarios_.
* _aida_owner_ será el dueño de la base de datos que tendrá permiso
para crear, eliminar y modificar la estructura de las tablas
y otros objetos de la base de datos.
Ese usuario [^3] no tendrá permiso para conectarse a la base de dato,
sirve para separar la coexistencia de distintas bases de datos manejadas por el mismo motor.
* _aida_admin_ será el usuario con el que el _CLI_ (y luego el backend)
se conectarán a la base de datos,
ese usuario tendrá los mínimos permisos necesarios para hacer funcionar el sistema:
agregar, cambiar y borrar alumnos en la tabla alumnos.
Este usuario no necesita crear objetos de la base ni poder eliminar tablas
ni otros objetos.

[^2]: Anderson, R. (2020). Distributed systems. In *Security engineering: A guide to building dependable distributed systems* (3rd ed., Cap 6). Wiley.

[^3]: https://www.postgresql.org/docs/current/sql-createuser.html

## 2. Hello World con Node.js y Postgres

[ca83996](https://github.com/ari-dc-uba-ar/aida/commit/ca83996ac73160ba2804f75e20b41325f9499635)

1. Mirando la documentación de https://node-postgres.com/ para ver cómo conectar ambos,
arrancamos con el ejemplo que tiene el _Hello world!_ que lo pusimos en `src/cli.js`,
lo corrimos `node src/cli.js` y vimos que no arrancaba.
2. Instalamos el módulo como dice la documentación `npm install pg`
3. Agregamos `type module` en el `package.json` como sugería un warnig al correrlo
4. Vimos que no conectaba.
5. En la documentación nos dice que podemos conectarnos creando ciertas variables de ambiente
así que las pusimos en `recursos/local-sets.bat` [^4]
e inmediatamente agregamos la excepción a `.gitignore` [^5] para que no se suba al repositorio
(todo lo que empiece con `local-` o termine con `-local` no se va a subir)
6. De paso subimos un ejemplo de las variables de ambiente pero con otra contraseña.

### conceptos

_Secure by Design_ prescribe pensar los aspectos de seguridad desde el inicio.
En el libro antes mencionado se le da mucha importancia a la usabilidad.
El uso de mecanismos como `.gitignore` es crucial a la hora de ayudarnos a no subir secretos [^5] al repositorio.
En este caso la usabilidad estamos delegando la responsabilidad de no subir nunca las claves al git
(aunque todavía el desarrollador podría olvidarse de poner eso en un archivo `local-xxxx`).
Otra manera de decirlo es preguntarse todo el tiempo ¿qué puede salir mal? como lo hace [^6]


[^4]: En https://12factor.net/es/config se recomienda guardar la configuración en el entorno

[^5]: Se llaman secretos no solo a las contraseñas sino a cualquier otra información de configuración
que en manos de un atacante podrían facilitarle acceder a recursos que deberían estar protegidos.
Son ejemplos: tokens de acceso, cadenas de conexión, direcciones físicas, puertos y otras.

[^6]: Shostack, A. (2014). *Threat modeling: Designing for security*. John Wiley & Sons.

## 3. Prueba de almacentamiento

[a811552](https://github.com/ari-dc-uba-ar/aida/commit/a811552fac2c3fc1b66b64b457fef9ac94a101a0)

El _Hello World!_ es clásico. Pero cómo ver la interacción real con la base de datos.
¿Cómo estar seguros de que realmente hubo una conexión exitosa y transmisión de datos?
Hay que insertar un dato dentro de la base y después verificar que el dato está ahí.

Vamos por pasos:
1. Escribimos una instrucción `insert` para agregar un alumno a la base de datos,
lo ponemos en el archivo `recursos/insert-ejemplo-alumnos.sql`.
2. Abrimos el _pgAdmin_, ejecutamos el script y luego abrimos la tabla para ver el renglón ahí.
3. Ahora queremos que ese script lo lea el _CLI_ del disco y lo ejecute en la base.
4. Miramos la documentación de node para ver cómo leer el contenido de un archivo de texto
https://nodejs.org/docs/latest/api/fs.html#fspromisesreadfilepath-options
5. Incorporamos la llamda a readFile en `src/cli.js` lo corremos, nos da error de clave duplicada
6. Borramos a mano desde el _pgAdmin_ la tabla `delete from aida.alumnos;`
7. Volvemos a correr el _CLI_ `node src/cli.js`
8. Vemos el contenido de la tabla recién insertado.

## 4. Levantar el _CSV_

[78e1877](https://github.com/ari-dc-uba-ar/aida/commit/78e187708a593281d2b70ee565448b35f917350d)

Queremos que el _CLI_ levante el archivo de texto separado por comas y lo inserte en la base.
Ya sabemos cómo ejecutar un `INSERT` y cómo levantar un archivo de texto.
Ahora lo separamos en líneas, las líneas en columnas, en la primera línea están los nombres de campos
en el resto los valores a insertar.
Uno a uno ejecutamos los insert, para eso entrecomillamos los valores.
Enseguida nos dimos cuenta que dos comas pegadas (o un string de longitud cero)
en un _csv_ significa que quiero guardar un valor `null` en la base de datos.

Hicimos los cambios, lo ejecutamos y ahí están los datos.

### aclaración

**Así no se parsea un _CSV_** hay que mirar un poco más la documentación del csv y preguntarse
¿qué pasa si quiero poner una coma dentro de un campo? Se tiene que poder ¿cómo se hace?

**Es inseguro, así no se arman los SQL** Esto es importante. Lo vemos las próximas clases.


