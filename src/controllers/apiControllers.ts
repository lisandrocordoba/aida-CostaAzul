import { Request, Response } from 'express';
import * as aida from '../aida.js';
import * as csv from '../csv.js';
import * as fechas from '../fechas.js';
import { autenticarUsuario, crearUsuario } from '../auth.js';
import { Rol, verificarRol, obtenerDatosRol } from '../roles.js';
import { Client } from 'pg';
import { generarPdfCertificado } from '../certificados.js';
import { DatoAtomico } from '../tipos-atomicos.js';


// Cliente DB para el modulo
// Pensar si conviene hacerlo en cada función
let clientDb: Client;
if (process.env.IS_DEVELOPMENT === 'true') {
    clientDb = new Client();
} else {
    clientDb = new Client({
        connectionString: process.env.DATABASE_URL
    });
}
clientDb.connect();

// --- LOGIN ---
export async function loginAPIController(req: Request, res: Response) {
  const { username, password } = req.body;
  const usuario = await autenticarUsuario(clientDb, username, password);
  if (usuario) {
      req.session.usuario = usuario;
      res.json({ message: 'Autenticación exitosa' });
  } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
  }
}

// --- LOGOUT ---
export function logoutAPIController(req: Request, res: Response) {
  req.session.destroy(err => {
    console.log("estoy aca");
    if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
    res.clearCookie('connect.sid', { path: '/' });
    res.redirect('/app/login');
    return;
  });
}

// --- REGISTER ---
export async function registerAPIController(req: Request, res: Response) {
  console.log("entra");
  const { username, password, nombre, email } = req.body;
  await crearUsuario(clientDb, username, password, nombre, email);
  res.status(201).send('Usuario creado');
}

// --- ROLES ---

// Hay que agregar tipo ROL, por ahora solo es string
export async function selectRolAPIController(req: Request, res: Response) {
  const usuario = req.session.usuario; //handlear null
  const { rol } = req.body;
  if (verificarRol(usuario!, rol)) {
      req.session.rol = await obtenerDatosRol(usuario!, rol, clientDb) as Rol | null;
      return res.json({ message: 'Autenticación exitosa' });
  } else {
      return res.status(401).json({ error: 'Credenciales inválidas' });
  }
}

export async function getRolAPIController(req: Request, res: Response) {
  const rol = req.session?.rol;
  console.log("Entra en controller getRolAPIController", rol);
  if (!rol) {
    return res.status(401).json({ error: 'No hay rol seleccionado' });
  }
  if (rol.nombreRol === 'alumno') {
    const alumno =  {   nombreRol: req.session.rol?.nombreRol,
                        lu: req.session.rol?.lu,
                        nombre: req.session.usuario?.nombre,
                        apellido: req.session.usuario?.apellido,
                        carrera: req.session.rol?.carrera
                    }
    return res.status(200).send(JSON.stringify(alumno));
  }
  if (rol.nombreRol === 'profesor') {
    const profesor =  {
                          nombreRol: req.session.rol?.nombreRol,
                          legajo: req.session.rol?.legajo,
                          nombre: req.session.usuario?.nombre,
                          apellido: req.session.usuario?.apellido
                      }
    return res.status(200).send(JSON.stringify(profesor));
  }
  if (rol.nombreRol === 'secretario') {
    const secretario =  {
                          nombreRol: req.session.rol?.nombreRol,
                          nombre: req.session.usuario?.nombre,
                          apellido: req.session.usuario?.apellido
                      }
    return res.status(200).send(JSON.stringify(secretario));
  }
  return res.status(500).send('Error interno al obtener rol');
}

// --- ALUMNOS ---

export async function addAlumnoActual(req: Request, res: Response) {
  const columnas = Object.keys(req.body);
  const valores = Object.values(req.body) as string[];
  await aida.agregarAlumno(columnas, valores, clientDb);
  res.status(200).send('Alumno agregado');
  console.log(req.body);
}

// PENSAR COMO QUEREMOS LIMITAR CAMBIOS
// EJEMPLO: ES POSIBLE QUE UN ALUMNO TENGA TITULO EN TRAMITE Y SE LE CAMBIE LA CARRERA
export async function updateAlumnoController(req: Request, res: Response) {
  const lu = req.params.lu;
  const columnas = Object.keys(req.body);
  const valores = Object.values(req.body) as string[];
  await aida.actualizarAlumno(lu!, columnas, valores, clientDb);
  console.log(valores);
  res.status(200).send('Alumno actualizado');
}

export async function deleteAlumnoController(req: Request, res: Response) {
  const lu = req.params.lu;
  await clientDb.query(`DELETE FROM aida.alumnos WHERE lu = $1`, [lu]);
  res.status(200).send('Alumno eliminado');
}

export async function patchAlumnosController(req: Request, res: Response) {
  console.log(req.params, req.query, req.body);
  const { dataLines: listaDeAlumnosCompleta, columns: columnas } = await csv.parsearCSV(req.body.csvText);
  await aida.refrescarTablaAlumnos(clientDb, listaDeAlumnosCompleta, columnas);
  res.status(200).send('Tabla de alumnos actualizada');
}

// --- CURSADAS ---
export async function getCursadasController(_: Request, res: Response) {
  const cursadas = await aida.obtenerTodasLasCursadas(clientDb);
  res.status(200).send(JSON.stringify(cursadas));
}

// IMPORTANTE: si es la última materia, un trigger en la db ingresa la fecha de título en trámite.
// Deberia devolver JSON
export async function addCursadaController(req: Request, res: Response) {
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
}

export async function updateCursadaController(req: Request, res: Response) {
  const lu = req.params.lu;
  const columnas = Object.keys(req.body);
  const valores = Object.values(req.body) as string[];
  await aida.actualizarCursada(lu!, columnas, valores, clientDb);
  console.log(valores);
  res.status(200).send('Cursada actualizada');
}

export async function deleteCursadaController(req: Request, res: Response) {
  const { lu, materia_id, anio, cuatrimestre } = req.params;
  await clientDb.query(
    `DELETE FROM aida.cursadas WHERE alumno_lu = $1 AND materia_id = $2 AND anio = $3 AND cuatrimestre = $4`,
    [lu, materia_id, anio, cuatrimestre]
  );
  res.status(200).send('Cursada eliminado');
}

export async function patchCursadasController(req: Request, res: Response) {
  console.log(req.params, req.query, req.body);
  const { dataLines: listaDeCursadasCompleta, columns: columnas } = await csv.parsearCSV(req.body.csvText);
  await aida.refrescarTablaCursadas(clientDb, listaDeCursadasCompleta, columnas);
  res.status(200).send('Tabla de cursadas actualizada');
}

// --- PLAN DE ESTUDIOS ---
export async function patchPlanEstudiosController(req: Request, res: Response) {
  try {
    const { csvText, careerName } = req.body;
    if (!csvText || !careerName) {
      res.status(400).send('Faltan csvText o careerName');
      return;
    }
    // Agregar carrera
    const carreraId = await aida.agregarCarrera(careerName.trim(), clientDb);

    // Parsear CSV con materias
    const { dataLines, columns } = csv.parsearCSV(csvText);

    // Validar estructura del CSV: una sola columna llamada "materias"
    if (columns.length !== 1 || columns[0]!.toLowerCase() !== 'materias') {
      res.status(400).send('CSV inválido: se espera columna "materias"');
      return;
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
}

// --- CERTIFICADOS ---           VER: ESTAMOS DEVOLVIENDO UNICAMENTE EL CERTIFICADO DEL PRIMER ALUMNO QUE COINCIDE CON EL FILTRO
export async function getCertificadosController(req: Request, res: Response) {
  const { lu, fecha } = req.query;
  var alumnos: Record<string, DatoAtomico>[] = [];
  try {
    if (lu) {
      alumnos = await aida.obtenerAlumnoQueNecesitaCertificado(clientDb, { lu: lu as string });
    } else if (fecha) {
      alumnos = await aida.obtenerAlumnoQueNecesitaCertificado(clientDb, { fecha: fechas.deISO(fecha as string) });
    } else {
        res.status(400).send("Falta parámetro LU o Fecha");
        return;
    }
    if (alumnos.length == 0) {
      console.log(`No hay alumnos que necesiten certificado para el parametro `, lu ?? fecha);
      res.status(404).send("El alumno no necesita certificado o no existe.");
    } else {
      generarPdfCertificado(alumnos[0]!, res);
    }
  } catch (error){
    res.status(500).send("Error interno" + error);
  }
}

