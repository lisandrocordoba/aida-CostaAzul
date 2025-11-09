import express from "express";
import * as aida from "../aida.js";
//import * as fechas from "../src/fechas.js";
import * as csv from "../csv.js";

//Imports autenticacion
import { autenticarUsuario, crearUsuario, Usuario } from '../auth.js';
import { Request, Response, NextFunction } from "express";

// Extendemos los tipos de sesion
declare module 'express-session' {
  interface SessionData {
      usuario?: Usuario;
  }
}

import { Client } from 'pg'
//import { readFile } from "fs/promises";

// Leemos la variable de ambiente IS_DEVELOPMENT para saber que db levantar
let clientDb;
if (process.env.IS_DEVELOPMENT === 'true') {
    clientDb = new Client();
} else {
    clientDb = new Client({
        connectionString: process.env.DATABASE_URL
    });
}
clientDb.connect()

const APIRouter = express.Router();

// Middleware de autenticación para el backend
function requireAuthAPI(req: Request, res: Response, next: NextFunction) {
  if (req.session.usuario) {
      next();
  } else {
      res.status(401).json({ error: 'No autenticado' });
  }
}

// Definición de rutas de la API
// API de login
APIRouter.post('/auth/login', express.json(), async (req, res) => {
  const { username, password } = req.body;
  const usuario = await autenticarUsuario(clientDb, username, password);
  if (usuario) {
      req.session.usuario = usuario;
      res.json({ message: 'Autenticación exitosa' });
  } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Usamos el middleware requireAuthAPI para proteger las rutas de la API
APIRouter.use(requireAuthAPI);

// Tenemos que hacer que el boton se agregue solo si el usuario esta loggueado.
// API de logout
APIRouter.post('/auth/logout', (req, res) => {
  req.session.destroy(err => {
    console.log("estoy aca")
    if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
    res.clearCookie('connect.sid', { path: '/' });
    res.redirect('/app/login');
    return;
  });
});

APIRouter.post('/auth/register', async (req, res) => {
  console.log("entra");
  const { username, password, nombre, email } = req.body;
  crearUsuario(clientDb, username, password, nombre, email);
  res.status(201).send('Usuario creado');
});


// API DEL BACKEND
//var NO_IMPLEMENTADO='<code>ERROR 404 </code> <h1> No implementado aún ⚒<h1>';

APIRouter.get('/alumnos', async (_, res) => {

    //hago select tabla alumnos
    var alumnos = await aida.obtenerTodosAlumnos(clientDb);
    //pasar a json
    var jsonAlumnos = JSON.stringify(alumnos);
    //devolver al frontend
    res.status(200).send(jsonAlumnos);

})

APIRouter.post('/alumnos', async (req, res) => {
    const columnas = Object.keys(req.body);
    const valores = Object.values(req.body) as string[];
    await aida.agregarAlumno(columnas, valores, clientDb);

    res.status(200).send('Alumno agregado');
    console.log(req.body);
});

// PENSAR COMO QUEREMOS LIMITAR CAMBIOS
// EJEMPLO: ES POSIBLE QUE UN ALUMNO TENGA TITULO EN TRAMITE Y SE LE CAMBIE LA CARRERA
APIRouter.put('/alumnos/:lu', async (req, res) => {
    const lu = req.params.lu;
    const columnas = Object.keys(req.body);
    const valores = Object.values(req.body) as string[];
    await aida.actualizarAlumno(lu!, columnas, valores, clientDb);
    console.log(valores);
    res.status(200).send('Alumno actualizado');
});

// esto no tendria que ser api/v0/ ??
APIRouter.delete('/alumnos/:lu', async (req, res) => {
    const lu = req.params.lu;
    await clientDb.query(`DELETE FROM aida.alumnos WHERE lu = $1`, [lu]);
    res.status(200).send('Alumno eliminado');
});

// Actualizar la tabla de alumnos a partir de un CSV
APIRouter.patch('/alumnos', async (req, res) => {
    console.log(req.params, req.query, req.body);

    var {dataLines: listaDeAlumnosCompleta, columns: columnas} = await csv.parsearCSV(req.body.csvText);
    await aida.refrescarTablaAlumnos(clientDb, listaDeAlumnosCompleta, columnas);

    res.status(200).send('Tabla de alumnos actualizada');

})

//RUTAS DE CURSADAS

APIRouter.get('/cursadas', async (_, res) => {
    //hago select tabla cursadas
    var cursadas = await aida.obtenerTodasLasCursadas(clientDb);
    //pasar a json
    var jsonCursadas = JSON.stringify(cursadas);
    //devolver al frontend
    res.status(200).send(jsonCursadas);
});

// Ruta agrega cursada con su nota a la tabla cursadas
// IMPORTANTE: si es la última materia, un trigger en la db ingresa la fecha de título en trámite.
APIRouter.post('/cursadas', async (req, res) => {
  try {
      const columnas = Object.keys(req.body);
      const valores = Object.values(req.body);
      await aida.agregarCursada(columnas, valores as string[], clientDb);

      //Deberia devolver JSON
      res.status(200).send('Cursada agregada');
      console.log('Cursada agregada:', req.body);
  } catch (err) {
      console.error('Error al agregar cursada:', err);
      res.status(500).send('Error al agregar la cursada');
  }
});

// Edita tabla de cursadas
APIRouter.put('/cursadas/:lu', async (req, res) => {
  const lu = req.params.lu;
  const columnas = Object.keys(req.body);
  const valores = Object.values(req.body) as string[];
  console.log(valores);
  await aida.actualizarCursada(lu!, columnas, valores, clientDb);
  res.status(200).send('Cursada actualizada');
});

APIRouter.delete('/cursadas/:lu/:materia_id/:anio/:cuatrimestre', async (req, res) => {
  const { lu, materia_id, anio, cuatrimestre } = req.params;
  await clientDb.query(`DELETE FROM aida.cursadas WHERE alumno_lu = $1 AND materia_id = $2 AND anio = $3 AND cuatrimestre = $4`, [lu, materia_id, anio, cuatrimestre]);
  res.status(200).send('Cursada eliminado');
});

// Actualiza la tabla de cursadas a partir de un CSV
APIRouter.patch('/cursadas', async (req, res) => {
    console.log(req.params, req.query, req.body);

    var {dataLines: listaDeCursadasCompleta, columns: columnas} = await csv.parsearCSV(req.body.csvText);
    await aida.refrescarTablaCursadas(clientDb, listaDeCursadasCompleta, columnas);

    res.status(200).send('Tabla de cursadas actualizada');
  });

// Carrera con su plan de estudios a la base de datos a partir de un CSV
// Cambiar nombre de ruta a CARRERAS
APIRouter.patch('/plan_estudios', async (req, res) => {
  try {
      const { csvText, careerName } = req.body;

      if (!csvText || !careerName) {
          res.status(400).send('Faltan csvText o careerName');
      }

      // Agregar carrera
      const carreraId = await aida.agregarCarrera(careerName.trim(), clientDb);

      // Parsear CSV con materias
      const { dataLines, columns } = csv.parsearCSV(csvText);

      // Validar estructura del CSV: una sola columna llamada "materias"
      if (columns.length !== 1 || columns[0]!.toLowerCase() !== 'materias') {
          res.status(400).send('CSV inválido: se espera columna "materias"');
      }

      // Procesar cada materia
      for (const line of dataLines) {
          const materiaNombre = line[0]!.trim();
          if (!materiaNombre) continue;

          const materiaId = await aida.agregarMateria(materiaNombre, clientDb);

          await aida.agregarMateriaACarrera(carreraId, materiaId, clientDb);
      }

      res.status(200).send(`Carrera "${careerName}" y materias asociadas procesadas correctamente.`);
  } catch (err) {
      console.error(err);
      res.status(500).send(String(err));
  }
});


export default APIRouter;
