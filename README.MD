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

## Funcionalidad agregada

La funcionalidad principal que agregamos fue la de distinguir roles de usuarios en el sistema. Los roles agregados son: alumno, profesor y secretario. Cada usuario puede tener más de un rol.

Luego de loguearse, el usuario accede a un menú de selección de roles Si selecciona un rol que no posee, es redireccionado al mismo menú. Si selecciona un rol que posee, accede a un menu para ese rol.

Los principales lugares del código donde se puede ver la implementación de nuestra funcionalidad:

## Instrucciones para levantar el proyecto
- Instalar dependencias node.
- Correr Scripts Postgres: creacionDB, creacion Esquema, carga datos prueba.
- Para correr.

