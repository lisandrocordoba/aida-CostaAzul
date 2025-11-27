import { Request, Response } from 'express';
import * as aida from '../aida.js';
import * as csv from '../csv.js';
import * as fechas from '../fechas.js';
import { autenticarUsuario, hashPassword, crearUsuario } from '../auth.js';
import { Rol, obtenerDatosRol } from '../roles.js';
import { Client } from 'pg';
import { generarPdfCertificado } from '../certificados.js';
import { DatoAtomico } from '../tipos-atomicos.js';
import { pool } from '../database/db.js';


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
  req.session.rol = await obtenerDatosRol(usuario!, rol, clientDb) as Rol | null;
  console.log("Entra en controller selectRolAPIController", req.session.rol);
  if(!req.session.rol) {
      return res.redirect('/app/seleccion-rol');
  } else {
      return res.json({ message: 'Autenticación exitosa' });
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

// --- CURSADAS ---
export async function getCursadasDeProfesorAPIController(req: Request, res: Response) {
  const rol = req.session.rol as Rol;
  const legajo = rol.legajo;
  const cursadas = await pool.query(
    `SELECT lu_CURS,lu,id_usuario_ALU,nombre_usuario,apellido,id_materia_CURS,nombre_materia,anio,cuatrimestre,nota
                FROM aida.cursadas
                JOIN aida.alumnos ON aida.cursadas.lu_CURS = aida.alumnos.lu
                JOIN aida.usuarios ON aida.alumnos.id_usuario_ALU = aida.usuarios.id_usuario
                JOIN aida.materias ON aida.cursadas.id_materia_CURS = aida.materias.id_materia
                JOIN aida.dicta ON aida.cursadas.id_materia_CURS = aida.dicta.id_materia_DICTA
                WHERE aida.dicta.legajo_DICTA = ${legajo}
                ORDER BY anio,cuatrimestre`
   );
   res.json(cursadas.rows);
}

// --- ALUMNOS ---
export async function patchAlumnosController(req: Request, res: Response) {
  console.log(req.params, req.query, req.body);
  const { dataLines: listaDeAlumnosCompleta, columns: columnas } = await csv.parsearCSV(req.body.csvText);
  await aida.refrescarTablaAlumnos(clientDb, listaDeAlumnosCompleta, columnas);
  res.status(200).send('Tabla de alumnos actualizada');
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

// --- CAMBIO DE PASSWORD ---
export async function cambioPasswordAPIController(req: Request, res: Response) {

  const { username, password } = req.body;
    const hash = await hashPassword(password);
    console.log("Hash generado: ", hash);

    try {
          await clientDb.query('UPDATE aida.usuarios SET password_hash = $1 WHERE username = $2',[hash, username]);

        } catch (error) {

          console.error('Error al cambiar la contraseña:', error);
          return res.status(500).json({ error: 'Error al cambiar la contraseña' });

        }

    return res.status(200).json({ ok: true, message: 'Contraseña actualizada' });
}