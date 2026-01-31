import { Fecha } from "./fechas.js"
import { DatoAtomico, sqlLiteral } from "./tipos-atomicos.js"
import { pool } from './database/db.js';


//QUEREMOS MANTENER LA FUNCIONALIDAD DE BORRAR ALUMNOS?
export async function refrescarTablaAlumnos(listaDeAlumnosCompleta:string[][], columnas:string[]){
    for (const values of listaDeAlumnosCompleta) {
        await agregarAlumno(columnas, values);
    }
}

export async function refrescarTablaCursadas(
    listaDeCursadasCompleta: string[][],
    columnas: string[]
): Promise<void> {

    for (const values of listaDeCursadasCompleta) {
        const query = `
            INSERT INTO aida.cursadas (${columnas.join(', ')}) VALUES
                (${values.map((value) => value == '' ? 'null' : sqlLiteral(value))})
        `;
        await pool.query(query);
    }

}

export async function agregarAlumno(columnas: string[], values: string[]) {
    const query = `
            INSERT INTO aida.alumnos (${columnas.join(', ')}) VALUES
                (${values.map((value) => value == '' ? 'null' : sqlLiteral(value))})
        `;
    await pool.query(query);
}

export type FiltroAlumnos = {fecha: Fecha} | {lu: string} | {uno: true} | {todos: true}

export async function obtenerAlumnoQueNecesitaCertificado(
    filtro: FiltroAlumnos
  ): Promise<Record<string, DatoAtomico>[]> {

      const sql = `
          SELECT
              al.lu,
              u.apellido,
              u.nombre_usuario AS nombre,
              ca.nombre_carrera AS titulo,
              al.titulo_en_tramite
          FROM aida.alumnos al
          JOIN aida.usuarios u
              ON al.id_usuario_ALU = u.id_usuario
          JOIN aida.carreras ca
              ON al.id_carrera_ALU = ca.id_carrera
          WHERE al.titulo_en_tramite IS NOT NULL
              ${"lu" in filtro ? `AND al.lu = ${sqlLiteral(filtro.lu)}` : ""}
              ${"fecha" in filtro ? `AND al.titulo_en_tramite = ${sqlLiteral(filtro.fecha)}` : ""}
          ORDER BY al.egreso
          ${"uno" in filtro ? `LIMIT 1` : ""}
      `;

      const res = await pool.query(sql);

      return res.rows;
  }

export async function agregarCarrera(nombre: string): Promise<number> {
    const existing = await pool.query<{ id_carrera: number }>(`
        SELECT id_carrera FROM aida.carreras WHERE nombre_carrera = ${sqlLiteral(nombre)}
    `);

    if (existing.rows.length > 0) {
        throw new Error(`La carrera "${nombre}" ya existe en la base de datos`);
    }

    const res = await pool.query<{ id_carrera: number }>(`
        INSERT INTO aida.carreras (nombre_carrera)
        VALUES (${sqlLiteral(nombre)})
        RETURNING id_carrera
    `);

    return res.rows[0]!.id_carrera;
}

export async function agregarMateria(nombre: string): Promise<number> {

    const existing = await pool.query<{ id_materia: number }>(`
        SELECT id_materia FROM aida.materias WHERE nombre_materia = ${sqlLiteral(nombre)}
    `);

    if (existing.rows.length > 0) {
        throw new Error(`La materia "${nombre}" ya existe en la base de datos`);
    }

    const res = await pool.query<{ id_materia: number }>(`
        INSERT INTO aida.materias (nombre_materia)
        VALUES (${sqlLiteral(nombre)})
        RETURNING id_materia
    `);

    return res.rows[0]!.id_materia;
}


export async function agregarMateriaACarrera(
    carreraId: number,
    materiaId: number
): Promise<void> {

    const existing = await pool.query<{ exists: boolean }>(`
        SELECT 1 FROM aida.materiasEnCarrera
        WHERE id_carrera_MEC = $1
          AND id_materia_MEC = $2
    `, [carreraId, materiaId]);

    if (existing.rows.length > 0) {
        throw new Error(`La materia con ID ${materiaId} ya está asociada a la carrera con ID ${carreraId}`);
    }

    await pool.query(`
        INSERT INTO aida.materiasEnCarrera (id_carrera_MEC, id_materia_MEC)
        VALUES ($1, $2)
    `, [carreraId, materiaId]);
}

