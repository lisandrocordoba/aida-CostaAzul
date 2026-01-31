import { Request, Response } from 'express';
import * as aida from '../aida.js';
import * as csv from '../csv.js';
import * as fechas from '../fechas.js';
import { autenticarUsuario, crearUsuario, cambiarPassword } from '../auth.js';
import { Rol, obtenerDatosRol } from '../roles.js';
import { generarPdfCertificado } from '../certificados.js';
import { DatoAtomico } from '../tipos-atomicos.js';
import { pool } from '../database/db.js';

// --- LOGIN ---
export async function loginAPIController(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    const usuario = await autenticarUsuario(username, password);
    if (usuario) {
        req.session.usuario = usuario;
        res.json({ message: 'Autenticación exitosa' });
    } else {
        res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (error) {
    console.error('Error en loginAPIController:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// --- LOGOUT ---
export function logoutAPIController(req: Request, res: Response) {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
    res.clearCookie('connect.sid', { path: '/' });
    res.redirect('/app/login');
    return null;
  });
}

// --- REGISTER ---
export async function registerAPIController(req: Request, res: Response): Promise<void> {
  const { username, password, nombre, email } = req.body;
  await crearUsuario(username, password, nombre, email);
  res.status(201).send('Usuario creado');
}

// --- ROLES ---
export async function selectRolAPIController(req: Request, res: Response) {
  const usuario = req.session.usuario;
  const { rol } = req.body;
  req.session.rol = await obtenerDatosRol(usuario!, rol) as Rol | null;
  if(!req.session.rol) {
      return res.redirect('/app/seleccion-rol');
  } else {
      return res.json({ message: 'Autenticación exitosa' });
  }
}

export async function getRolAPIController(req: Request, res: Response) {
  const rol = req.session?.rol;
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
export async function getMateriasDeProfesorAPIController(req: Request, res: Response) {
  const rol = req.session.rol as Rol;
  const legajo = rol.legajo;
  const cursadas = await pool.query(
    `SELECT id_materia_DICTA, nombre_materia
                FROM aida.dicta
                JOIN aida.materias ON aida.dicta.id_materia_DICTA = aida.materias.id_materia
                WHERE aida.dicta.legajo_DICTA = $1
                `
   , [legajo]);
   return res.json(cursadas.rows);
}


export async function getCursadasDeProfesorAPIController(req: Request, res: Response) {
  const queryParams = req.query;
  const id_materia = queryParams.id_materia as string | undefined;
  const sql =`
    SELECT lu, apellido, nombre_usuario, anio, cuatrimestre, nota, nombre_materia, id_materia
    FROM aida.cursadas
    JOIN aida.materias ON aida.cursadas.id_materia_CURS = aida.materias.id_materia
    JOIN aida.alumnos ON aida.cursadas.lu_CURS = aida.alumnos.lu
    JOIN aida.usuarios ON aida.alumnos.id_usuario_ALU = aida.usuarios.id_usuario
    WHERE aida.cursadas.id_materia_CURS = $1
    ORDER BY anio, cuatrimestre
  `;
  const cursadas = await pool.query(sql, [id_materia]);
  return res.json(cursadas.rows);
}

export async function deleteCursadaProfesorController(req: Request, res: Response) {
  const { lu, id_materia, anio, cuatrimestre } = req.params;

  const legajo = req.session.rol?.legajo;
  if (!legajo) {
    return res.status(403).json({ error: "Acceso no autorizado." });
  }

  const checkSql = `
    SELECT 1
    FROM aida.dicta
    WHERE legajo_DICTA = $1 AND id_materia_DICTA = $2
  `;

  const check = await pool.query(checkSql, [legajo, id_materia]);

  if (check.rowCount === 0) {
    return res.status(403).json({
      error: "No es profesor de esta materia."
    });
  }

  try{
    const sql = `
      DELETE FROM aida.cursadas
      WHERE lu_CURS = $1
        AND id_materia_CURS = $2
        AND anio = $3
        AND cuatrimestre = $4
      RETURNING *;
    `;

    const result = await pool.query(sql, [lu, id_materia, anio, cuatrimestre]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cursada no encontrada" });
    }
    return res.json({ message: "Cursada eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar cursada (profesor):", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function updateCursadaProfesorController(req: Request, res: Response) {
  const { lu, id_materia, anio, cuatrimestre} = req.params;
  const { nota } = req.body;

  const legajo = req.session.rol?.legajo;
  if (!legajo) {
    return res.status(403).json({ error: "Acceso no autorizado." });
  }

  // Verificar que el profesor dicta la materia (MISMA LÓGICA QUE DELETE/CREATE)
  const checkSql = `
    SELECT 1
    FROM aida.dicta
    WHERE legajo_DICTA = $1 AND id_materia_DICTA = $2
  `;
  const check = await pool.query(checkSql, [legajo, id_materia]);

  if (check.rowCount === 0) {
    return res.status(403).json({
      error: "No es profesor de esta materia."
    });
  }

  try {
    const sql = `
      UPDATE aida.cursadas
      SET nota = $5
      WHERE lu_CURS = $1
        AND id_materia_CURS = $2
        AND anio = $3
        AND cuatrimestre = $4
      RETURNING *;
    `;

    const params = [lu, id_materia, anio, cuatrimestre, nota];

    const result = await pool.query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cursada no encontrada" });
    }

    return res.json({
      message: "Cursada actualizada correctamente",
      data: result.rows[0],
    });

  } catch (error) {
    console.error("Error al editar cursada (profesor):", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}


export async function createCursadaProfesorController(req: Request, res: Response) {
  const { lu_CURS, id_materia_CURS, anio, cuatrimestre, nota} = req.body;
  const legajo = req.session.rol?.legajo;
  if (!legajo) {
    return res.status(403).json({ error: "Acceso no autorizado." });
  }

  // Verificar que el profesor dicta la materia
  const checkSql = `
    SELECT 1
    FROM aida.dicta
    WHERE legajo_DICTA = $1 AND id_materia_DICTA = $2
  `;

  const check = await pool.query(checkSql, [legajo, id_materia_CURS]);

  if (check.rowCount === 0) {
    return res.status(403).json({
      error: "No es profesor de esta materia."
    });
  }

  try {
    const sql = `
      INSERT INTO aida.cursadas (lu_CURS, id_materia_CURS, anio, cuatrimestre, nota)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const params = [lu_CURS, id_materia_CURS, anio, cuatrimestre, nota];

    const result = await pool.query(sql, params);

    return res.json({
      message: "Cursada creada correctamente",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error al crear cursada (profesor):", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// --- ALUMNOS ---
export async function patchAlumnosController(req: Request, res: Response) {
  const { dataLines: listaDeAlumnosCompleta, columns: columnas } = await csv.parsearCSV(req.body.csvText);
  await aida.refrescarTablaAlumnos(listaDeAlumnosCompleta, columnas);
  res.status(200).send('Tabla de alumnos actualizada');
}

export async function patchCursadasController(req: Request, res: Response) {
  const { dataLines: listaDeCursadasCompleta, columns: columnas } = await csv.parsearCSV(req.body.csvText);
  await aida.refrescarTablaCursadas(listaDeCursadasCompleta, columnas);
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
    const carreraId = await aida.agregarCarrera(careerName.trim());
    const { dataLines, columns } = csv.parsearCSV(csvText);

    if (columns.length !== 1 || columns[0]!.toLowerCase() !== 'materias') {
      res.status(400).send('CSV inválido: se espera columna "materias"');
      return;
    }

    for (const line of dataLines) {
      const materiaNombre = line[0]!.trim();
      if (!materiaNombre) continue;

      const materiaId = await aida.agregarMateria(materiaNombre);
      await aida.agregarMateriaACarrera(carreraId, materiaId);
    }

    res.status(200).send(`Carrera "${careerName}" y materias asociadas procesadas correctamente.`);
  } catch (err) {
    console.error(err);
    res.status(500).send(String(err));
  }
}

// --- CERTIFICADOS ---           DEVOLVEMOS UNICAMENTE EL CERTIFICADO DEL PRIMER ALUMNO QUE COINCIDE CON EL FILTRO
export async function getCertificadosController(req: Request, res: Response) {
  const { lu, fecha } = req.query;
  var alumnos: Record<string, DatoAtomico>[] = [];
  try {
    if (lu) {
      alumnos = await aida.obtenerAlumnoQueNecesitaCertificado({ lu: lu as string });
    } else if (fecha) {
      alumnos = await aida.obtenerAlumnoQueNecesitaCertificado({ fecha: fechas.deISO(fecha as string) });
    } else {
        res.status(400).send("Falta parámetro LU o Fecha");
        return;
    }
    if (alumnos.length == 0) {
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

    const { password } = req.body;

    if (await cambiarPassword(req.session.usuario!.id, password)) {
      return res.status(200).json({ ok: true, message: 'Contraseña actualizada' });
    } else {
      return res.status(500).json({ ok: false, error: 'Error al actualizar la contraseña' });
    }

  }

  // --- USUARIOS ---
  export async function getUsuariosController(_: Request, res: Response) {
    const usuarios = await pool.query('SELECT id_usuario, username, nombre_usuario, apellido, email FROM aida.usuarios ORDER BY id_usuario');
    return res.status(200).json(usuarios.rows);
  }

  export async function agregarUsuarioController(req: Request, res: Response) {
    const { username, password, nombre_usuario, apellido, email } = req.body;
    try {
        await crearUsuario(username, password, nombre_usuario, apellido, email);
        return res.status(201).send('Usuario creado');
    } catch (error) {
      console.error('Error al crear usuario:', error);
      return res.status(500).json({ error: 'Error al crear usuario' });
    }
  }

  export async function eliminarUsuarioController(req: Request, res: Response) {
    const { id_usuario } = req.params;
    try {
        const result = await pool.query('DELETE FROM aida.usuarios WHERE id_usuario = $1 RETURNING *', [id_usuario]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        return res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      return res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }

  export async function modificarUsuarioController(req: Request, res: Response) {
    const { id_usuario } = req.params;
    const { nombre_usuario, apellido, email } = req.body;
    try {
        const result = await pool.query(
            `UPDATE aida.usuarios
             SET nombre_usuario = $1, apellido = $2, email = $3
             WHERE id_usuario = $4
             RETURNING *`,
            [ nombre_usuario, apellido, email, id_usuario]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        return res.status(200).json({ message: 'Usuario modificado correctamente', usuario: result.rows[0] });
    } catch (error) {
      console.error('Error al modificar usuario:', error);
      return res.status(500).json({ error: 'Error al modificar usuario' });
    }
  }


// DICTA - SECRETARIOS

export async function getDictaController(req: Request, res: Response) {
  try {
    const { legajo, lu } = req.query as { legajo?: string; lu?: string };

    let sql = `
      SELECT
        d.legajo_dicta      AS "legajo_DICTA",
        d.id_materia_dicta  AS "id_materia_DICTA",
        p.legajo            AS "legajo",
        u.nombre_usuario    AS "nombre_usuario",
        u.apellido          AS "apellido",
        m.nombre_materia    AS "nombre_materia"
      FROM aida.dicta d
      JOIN aida.profesores p
        ON p.legajo = d.legajo_dicta
      JOIN aida.usuarios u
        ON u.id_usuario = p.id_usuario_PROF
      JOIN aida.materias m
        ON m.id_materia = d.id_materia_dicta
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    // Si viene ?legajo=... filtrar por ese profesor
    if (legajo) {
      params.push(legajo);
      conditions.push(`d.legajo_DICTA = $${params.length}`);
    }

    // Si viene ?lu=... filtrar solo materias donde ese alumno está cursando
    if (lu) {
      params.push(lu);
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM aida.cursadas c
          WHERE c.id_materia_CURS = d.id_materia_DICTA
            AND c.lu_CURS = $${params.length}
        )
      `);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY d.legajo_DICTA, d.id_materia_DICTA;";

    const result = await pool.query(sql, params);
    return res.json(result.rows);

  } catch (error) {
    console.error("Error al obtener dicta:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}


export async function createDictaController(req: Request, res: Response) {
  try {
    const { legajo_DICTA, id_materia_DICTA } = req.body;

    if (!legajo_DICTA || !id_materia_DICTA) {
      return res.status(400).json({ error: "Faltan datos obligatorios." });
    }

    const sql = `
      INSERT INTO aida.dicta (legajo_DICTA, id_materia_DICTA)
      VALUES ($1, $2)
      RETURNING *;
    `;

    const result = await pool.query(sql, [
      legajo_DICTA,
      id_materia_DICTA
    ]);

    return res.json(result.rows[0]);

  } catch (error) {
    console.error("Error al crear dicta:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

export async function deleteDictaController(req: Request, res: Response) {
  try {
    const { legajo_DICTA, id_materia_DICTA } = req.params;

    const sql = `
      DELETE FROM aida.dicta
      WHERE legajo_DICTA = $1
      AND id_materia_DICTA = $2
      RETURNING *;
    `;

    const result = await pool.query(sql, [
      legajo_DICTA,
      id_materia_DICTA
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Registro no encontrado." });
    }

    return res.json({ message: "Registro eliminado correctamente." });

  } catch (error) {
    console.error("Error al eliminar dicta:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
