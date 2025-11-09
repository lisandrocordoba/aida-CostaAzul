import express from "express";
import * as aida from "../src/aida.js";
import * as fechas from "../src/fechas.js";
import * as csv from "../src/csv.js";

//Imports autenticacion
import session/*, { SessionData }*/ from 'express-session';
import { autenticarUsuario, crearUsuario, Usuario } from '../src/auth.js';
import { Request, Response, NextFunction } from "express";

// Extendemos los tipos de sesion
declare module 'express-session' {
  interface SessionData {
      usuario?: Usuario;
  }
}

import { Client } from 'pg'
import { readFile } from "fs/promises";

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

//Agregamos el middleware de session
APIRouter.use(session({
  secret: process.env.SESSION_SECRET || 'cambiar_este_secreto_en_produccion', //usar variable de entorno en produccion?
  resave: false,
  saveUninitialized: false,
  cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 1 día
  }
}));


// Middleware de autenticación para el backend
function requireAuthAPI(req: Request, res: Response, next: NextFunction) {
  if (req.session.usuario) {
      next();
  } else {
      res.status(401).json({ error: 'No autenticado' });
  }
}

// Usamos el middleware requireAuthAPI para proteger las rutas de la API
APIRouter.use(requireAuthAPI);




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

// Tenemos que hacer que el boton se agregue solo si el usuario esta loggueado.
// API de logout
APIRouter.post('/auth/logout', requireAuthAPI, (req, res) => {
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

APIRouter.get('/lu/:lu', requireAuthAPI, async (req, res) => {
    console.log(req.params, req.query, req.body);

    let certificadoHTML;
    var alumnos = await aida.obtenerAlumnoQueNecesitaCertificado(clientDb, {lu: req.params.lu!});
    if (alumnos.length == 0){
        console.log('No hay alumnos que necesiten certificado para el lu', req.params.lu);
        res.status(404).send("El alumno no necesita certificado o no existe.");
    } else {
        for (const alumno of alumnos) {
            certificadoHTML = await aida.generarHTMLcertificadoParaAlumno(`views/plantilla-certificado.html`, alumno);
        }
        res.status(200).send(certificadoHTML);
    }
})

APIRouter.get('/fecha/:fecha', requireAuthAPI, async (req, res) => {
    console.log(req.params, req.query, req.body);

    let certificadoHTML;
    const fecha = fechas.deCualquierTexto(req.params.fecha!);

    var alumnos = await aida.obtenerAlumnoQueNecesitaCertificado(clientDb, {fecha: fecha});
    if (alumnos.length == 0){
        console.log('No hay alumnos que necesiten certificado para la fecha', fecha);
        res.status(404).send('No hay alumnos que necesiten certificado para la fecha');
    } else {
        for (const alumno of alumnos) {
        certificadoHTML = await aida.generarHTMLcertificadoParaAlumno(`views/plantilla-certificado.html`, alumno);
      }
      res.status(200).send(certificadoHTML);
    }
})

// Actualizar la tabla de alumnos a partir de un CSV
APIRouter.patch('/alumnos', requireAuthAPI, async (req, res) => {
    console.log(req.params, req.query, req.body);

    var {dataLines: listaDeAlumnosCompleta, columns: columnas} = await csv.parsearCSV(req.body.csvText);
    await aida.refrescarTablaAlumnos(clientDb, listaDeAlumnosCompleta, columnas);

    res.status(200).send('Tabla de alumnos actualizada');

})

// esto no tendria que ser api/v0/ ??
APIRouter.get('/tablaAlumnos', requireAuthAPI, async (_, res) => {

    //hago select tabla alumnos
    var alumnos = await aida.obtenerTodosAlumnos(clientDb);
    //pasar a json
    var jsonAlumnos = JSON.stringify(alumnos);
    //devolver al frontend
    res.status(200).send(jsonAlumnos);

})

// esto no tendria que ser api/v0/ ??
APIRouter.post('/tablaAlumnos', requireAuthAPI, async (req, res) => {
    const columnas = Object.keys(req.body);
    const valores = Object.values(req.body) as string[];
    await aida.agregarAlumno(columnas, valores, clientDb);

    res.status(200).send('Alumno agregado');
    console.log(req.body);
});

// esto no tendria que ser api/v0/ ??
APIRouter.delete('/tablaAlumnos/:lu', requireAuthAPI, async (req, res) => {
    const lu = req.params.lu;
    await clientDb.query(`DELETE FROM aida.alumnos WHERE lu = $1`, [lu]);
    res.status(200).send('Alumno eliminado');
});

// PENSAR COMO QUEREMOS LIMITAR CAMBIOS
// EJEMPLO: ES POSIBLE QUE UN ALUMNO TENGA TITULO EN TRAMITE Y SE LE CAMBIE LA CARRERA
APIRouter.put('/tablaAlumnos/:lu', requireAuthAPI, async (req, res) => {
    const lu = req.params.lu;
    const columnas = Object.keys(req.body);
    const valores = Object.values(req.body) as string[];
    await aida.actualizarAlumno(lu!, columnas, valores, clientDb);
    console.log(valores);
    res.status(200).send('Alumno actualizado');
});

APIRouter.get('/cursadas', requireAuthAPI, async (_, res) => {
  let plantillaTablaCursadas = await readFile('views/plantilla-tabla-cursadas.html', { encoding: 'utf8' });
  res.status(200).send(plantillaTablaCursadas);
})

APIRouter.get('/tablaCursadas', requireAuthAPI, async (_, res) => {
    //hago select tabla cursadas
    var cursadas = await aida.obtenerTodasLasCursadas(clientDb);
    //pasar a json
    var jsonCursadas = JSON.stringify(cursadas);
    //devolver al frontend
    res.status(200).send(jsonCursadas);
});

// Ruta agrega cursada con su nota a la tabla cursadas
// IMPORTANTE: si es la última materia, un trigger en la db ingresa la fecha de título en trámite.
APIRouter.post('/tablaCursadas', requireAuthAPI, async (req, res) => {
  try {
      const columnas = Object.keys(req.body);
      const valores = Object.values(req.body);
      await aida.agregarCursada(columnas, valores as string[], clientDb);

      res.status(200).send('Cursada agregada');
      console.log('Cursada agregada:', req.body);
  } catch (err) {
      console.error('Error al agregar cursada:', err);
      res.status(500).send('Error al agregar la cursada');
  }
});

// Edita tabla de cursadas
APIRouter.put('/tablaCursadas/:lu', requireAuthAPI, async (req, res) => {
  const lu = req.params.lu;
  const columnas = Object.keys(req.body);
  const valores = Object.values(req.body) as string[];
  console.log(valores);
  await aida.actualizarCursada(lu!, columnas, valores, clientDb);
  res.status(200).send('Cursada actualizada');
});

APIRouter.delete('/tablaCursadas/:lu/:materia_id/:anio/:cuatrimestre', requireAuthAPI, async (req, res) => {
  const { lu, materia_id, anio, cuatrimestre } = req.params;
  await clientDb.query(`DELETE FROM aida.cursadas WHERE alumno_lu = $1 AND materia_id = $2 AND anio = $3 AND cuatrimestre = $4`, [lu, materia_id, anio, cuatrimestre]);
  res.status(200).send('Cursada eliminado');
});

// Carrera con su plan de estudios a la base de datos a partir de un CSV
APIRouter.patch('/plan_estudios', requireAuthAPI, async (req, res) => {
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

// Actualiza la tabla de cursadas a partir de un CSV
APIRouter.patch('/cursadas', requireAuthAPI, async (req, res) => {
  console.log(req.params, req.query, req.body);

  var {dataLines: listaDeCursadasCompleta, columns: columnas} = await csv.parsearCSV(req.body.csvText);
  await aida.refrescarTablaCursadas(clientDb, listaDeCursadasCompleta, columnas);

  res.status(200).send('Tabla de cursadas actualizada');
});

export default APIRouter;
