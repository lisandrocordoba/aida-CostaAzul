# AIDA – Adminstración Integral de Datos Académicos

Este es el repositorio correspondiente al Taller de Integración de Base de Datos.

Integrantes:

- Carlos Bottinelli L.U : 853/23
- Lisandro Córdoba Lazzaro L.U : 327/23
- Tiago Guerra L.U : 301/23
- Nicolás Marchetto L.U : 581/23

## Objetivo del taller

Manteniendo el foco en el aprendizaje integrador vamos a desarrollar un sistema de punta a punta,
integrando la base de datos a un backend, un frontend
y las operaciones que permitan desplegarlo en una máquina de desarrollo o en un servidor.

Trataremos de no perder de vista la mejores prácticas de desarrollo
y los temas de seguridad informática.

## Descripción del sistema AIDA

> Una facultad quiere desarrollar un sistema que integre todos sus procesos
empezando por los resultados académicos de los alumnos.
Quieren tener automatizado el criterio para identificar
los alumnos que cumplen las condiciones para pedir su título de grado.
Teniendo la información de carreras, planes de estudio y actas,
desean también generar los certificados de alumno regular y hacer estadísticas
(alumnos activos, egresados, los que interrumpieron la carrera, el tiempo que lleva recibirse, etc...).

## Instrucciones para levantar el proyecto



Se encuentran en [./back/README.md](./back/README.md) y [./aida-app/README.md](./aida-app/README.md). Todos los comandos, como `build` o `run dev` tienen un comando desde root para ejecutar el comando tanto back como front a la vez con un solo comando, para eso revisar [./package.json](./package.json).




## Índice por clase en donde encontrar el trabajo realizado

Hay fragmentos de código que, para no estropear la codebase, fuimos removiendo a medida que veíamos que no se utilizaban en cómo se escalaba el proyecto, así que algunas cosas se pueden ver mejor en commits viejos.

- Clase 1 a 4: hay partes de la funcionalidad que sobrevivieron en: [./back/src/presenters](./back/src/presenters), [./back/infrastructure/files/generador-certificados.ts](./back/infrastructure/files/generador-certificados.ts), en [./back/src/certificates](./back/src/certificates) y hay parte de la lógica en [./back/domain/business/business.ts](./back/domain/business/business.ts) y [./back/application/controllers/controller-alumno.ts](./back/application/controllers/controller-alumno.ts). Pero en este [commit viejo](https://github.com/matiWaisman/ARI-AIDA-2C-2025/tree/5a1e2c6fcc9faf5afa7a4a5e82c1207c05c54ff2) debería estar mejor ordenado todo si se quiere revisar esa funcionalidad en particular.
- Clase 5:
  - Para el front la lógica está en las carpetas [./aida-app/app/lu](./aida-app/app/lu), [./aida-app/app/fecha](./aida-app/app/fecha) y [./aida-app/app/archivo](./aida-app/app/archivo).
  - Para el back están definidas las rutas en [./back/infrastructure/http/routes/routes-alumno.ts](./back/infrastructure/http/routes/routes-alumno.ts) y se puede seguir la cadena para ver la lógica de los endpoints.
- Clase 6:
  - Para el front la lógica principal está en la carpeta [./aida-app/app/alumnos](./aida-app/app/alumnos).
  - Para el back la lógica también se puede seguir a partir de [./back/infrastructure/http/routes/routes-alumno.ts](./back/infrastructure/http/routes/routes-alumno.ts).
- Clase 7:
  - Para el front la página de logueo está en [./aida-app/app/login/page.tsx](./aida-app/app/login/page.tsx), y usa la feature en [./aida-app/features/loginFeature.ts](./aida-app/features/loginFeature.ts). La página de registro está en [./aida-app/app/register/page.tsx](./aida-app/app/register/page.tsx) y también tiene un feature. Con [./aida-app/contexts/UserContext.tsx](./aida-app/contexts/UserContext.tsx) controlamos si el usuario está logueado o no; en caso de que lo esté usamos el contexto para compartir los datos necesarios del usuario con los componentes y, en caso de que no esté logueado, se lo redirige a que se loguee.
  - En el back la lógica del logueo está en el router [./back/infrastructure/http/routes/routes-user.ts](./back/infrastructure/http/routes/routes-user.ts).
- Clase 8: se encuentra en [./back/infrastructure/db/alumno-repository.ts](./back/infrastructure/db/alumno-repository.ts).
- Clase 9: se agregó lógica en [./back/infrastructure/db/db-client.ts](./back/infrastructure/db/db-client.ts) para diferenciar si leer la base de datos local o la subida en la nube.
- Clase 10: El frontend se encuentra andando en: https://aida-app.onrender.com/, el back en: https://back-aida.onrender.com/.
- Clase 11: Los workflows se encuentran en la carpeta: [./.github/workflows](./.github/workflows).

## Funcionalidad agregada

La funcionalidad principal que agregamos fue la de las encuestas.
El flujo es el siguiente:

- Un administrador agrega a la base de datos una nueva materia en un cuatrimestre.
- Todos los usuarios que se registren como profesores pueden anotarse a dictar está materia.
- Todos los usuarios que se registren como usuarios pueden anotarse a cursar está materia. No hay restricciones de correlatividades o cosas del estilo, podría ser un trabajo futuro.
- Un profesor puede ponerle una nota a sus alumnos que están cursando sus materias.
- Tanto alumnos como profesores pueden completar la encuesta de la cursada, la encuesta solo se puede completar una única vez.
  - Los alumnos pueden puntuar y comentar acerca de la materia, los profesores y sus propios compañeros. No es necesario tener una nota para poder completar la encuesta.
  - Los profesores solo pueden puntuar y comentar a los alumnos.
- Tanto profesores como alumnos pueden visualizar los resultados de las encuestas. Para esto se puede acceder a las encuestas de una cursada. Aquí se pueden ver los resultados a las preguntas tanto de la materia, de los profesores y los alumnos. En las respuestas a los alumnos no se distingue si la respondieron compañeros o profesores del alumno.

Los principales lugares del código donde se puede ver la implementación de las encuestas:

- Frontend:
  - Páginas y flujo principal en [./aida-app/app/encuestas](./aida-app/app/encuestas).
  - Componentes en [./aida-app/components/encuestas](./aida-app/components/encuestas).
  - Feature en [./aida-app/features/completarEncuestasFeature.ts](./aida-app/features/completarEncuestasFeature.ts).
- Backend:
  - Tablas relacionadas con encuestas definidas en [./back/infrastructure/db/create-schema.sql](./back/infrastructure/db/create-schema.sql).
  - Queries en [./back/infrastructure/db/encuestas-repository.ts](./back/infrastructure/db/encuestas-repository.ts).
  - Endpoints en [./back/application/controllers/controller-encuestas.ts](./back/application/controllers/controller-encuestas.ts) y [./back/infrastructure/http/routes/routes-encuestas.ts](./back/infrastructure/http/routes/routes-encuestas.ts).



<p align="center">
  <img src="assets/chiqui.gif" alt="chiqui" />
</p>