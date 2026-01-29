# ADR 001: Estandarización de Configuración y Manejo de Entornos

* **Fecha:** 2026-01-29
* **Autor:** Lisandro

## Contexto y Problema
Inicialmente, el proyecto manejaba la carga de variables de entorno de forma inconsistente:
1. En desarrollo local, usábamos el flag nativo de Node `--env-file=.env`.
2. En los tests (Mocha), dependíamos de `import 'dotenv/config'`.
3. No existía una forma clara de diferenciar la base de datos de "Desarrollo" de la de "Testing" sin riesgo de borrar datos manualmente, y Windows no soporta la asignación directa de variables (ej: `NODE_ENV=test`).

## Decisión
Decidimos **desacoplar el mecanismo de carga de variables de la ejecución de scripts** y centralizar la configuración en un único módulo.

1. **Centralización (`src/config.ts`):** Creamos un módulo que centraliza la lectura del `.env`, la validación de tipos (puertos numéricos) y la lógica de selección de base de datos. El resto de la app (Server, DB) consume este objeto, no `process.env` directamente.
2. **Uso de `dotenv`:** Estandarizamos el uso de la librería `dotenv` para la carga de archivos `.env`, descartando el flag nativo `--env-file`.
3. **Uso de `cross-env`:** Implementamos `cross-env` para inyectar `NODE_ENV=test` en los scripts de NPM, garantizando que el comando funcione idéntico en Windows, Linux y CI.
4. **Base de Datos de Test Aislada:** La configuración detecta automáticamente el entorno `test` y fuerza la conexión a una base de datos efímera (`aida_test`), protegiendo la base de datos de desarrollo (`aida`).

## Consecuencias
* Seguridad: es imposible borrar la DB de desarrollo corriendo tests por error.
* Portabilidad: El proyecto corre en cualquier sistema operativo sin ajustar scripts.
* Mantenibilidad: Si cambiamos la librería de envs en el futuro, solo hay que modificar el objeto exportado por `src/config.ts`.
