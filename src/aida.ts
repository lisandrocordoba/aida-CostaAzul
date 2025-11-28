import { Client } from "pg"
import { readFile, writeFile } from "fs/promises"
import * as Path from 'path';

import { Fecha } from "./fechas.js"
import * as Fechas from "./fechas.js";
import { DatoAtomico, datoATexto, sqlLiteral } from "./tipos-atomicos.js"
import { leerYParsearCsv } from "./csv.js"
import { DefinicionesDeOperaciones } from "./orquestador.js";

//QUEREMOS MANTENER LA FUNCIONALIDAD DE BORRAR ALUMNOS?
export async function refrescarTablaAlumnos(clientDb: Client, listaDeAlumnosCompleta:string[][], columnas:string[]){
    await clientDb.query("DELETE FROM aida.alumnos");
    for (const values of listaDeAlumnosCompleta) {
        await agregarAlumno(columnas, values, clientDb);
    }
}

export async function refrescarTablaCursadas(
    clientDb: Client,
    listaDeCursadasCompleta: string[][],
    columnas: string[]
): Promise<void> {

    for (const values of listaDeCursadasCompleta) {
        const query = `
            INSERT INTO aida.cursadas (${columnas.join(', ')}) VALUES
                (${values.map((value) => value == '' ? 'null' : sqlLiteral(value))})
        `;
        await clientDb.query(query);
    }

    console.log('Tabla de cursadas actualizada');
}


export async function actualizarAlumno(lu: string, columnas: string[], valores: string[], clientDb: Client) {
    const setClause = columnas.map((columna, index) => `${columna} = ${valores[index] == '' ? 'null' : sqlLiteral(valores[index]!)}`).join(', ');
    const query = `UPDATE aida.alumnos SET ${setClause} WHERE lu = ${sqlLiteral(lu)}`;
    await clientDb.query(query);
}

export async function actualizarCursada(lu: string, columnas: string[], valores: string[], clientDb: Client) {
    const setClause = columnas.map((columna, index) => `${columna} = ${valores[index] == '' ? 'null' : sqlLiteral(valores[index]!)}`).join(', ');
    const query = `UPDATE aida.cursadas SET ${setClause} WHERE alumno_lu = ${sqlLiteral(lu)}`;
    await clientDb.query(query);
}

export async function agregarAlumno(columnas: string[], values: string[], clientDb: Client) {
    const query = `
            INSERT INTO aida.alumnos (${columnas.join(', ')}) VALUES
                (${values.map((value) => value == '' ? 'null' : sqlLiteral(value))})
        `;
    console.log(query);
    const res = await clientDb.query(query);
    console.log(res.command, res.rowCount);
}

export async function obtenerTodosAlumnos(clientDb: Client): Promise<Record<string, (DatoAtomico)>[]> {
    const sql = `select lu, apellido, nombres, c.nombre as titulo, titulo_en_tramite, egreso
	                from aida.alumnos a join aida.carreras c on a.id_carrera = c.id`;
    const res = await clientDb.query(sql);
    return res.rows;
}

export type FiltroAlumnos = {fecha: Fecha} | {lu: string} | {uno: true} | {todos: true}

export async function obtenerAlumnoQueNecesitaCertificado(
    clientDb: Client,
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

      console.log("Corriendo query:", sql);

      const res = await clientDb.query(sql);

      console.log("Resultado de obtenerAlumnoQueNecesitaCertificado:", res.rows);

      return res.rows;
  }


async function generarCertificadoParaAlumno(pathPlantilla:string, alumno:Record<string, DatoAtomico>){
    let certificado = await generarHTMLcertificadoParaAlumno(pathPlantilla, alumno);
    await guardarCertificadoEnArchivo(alumno, certificado);
}

async function guardarCertificadoEnArchivo(alumno: Record<string, DatoAtomico>, certificado: string) {
    var nombreArchivoSalida = `certificado-de-${
        // @ts-ignore
        alumno.lu?.replace(/\W/g, '_') // cambio las barras `/` (o cualquier otro caracter que no sea un alfanumérico) por una raya `_`
        }-para-imprimir.html`;
    if (process.env.AIDA_CARPETA_INTERCAMBIO) {
        nombreArchivoSalida = Path.join(process.env.AIDA_CARPETA_INTERCAMBIO, 'salida', nombreArchivoSalida);
    } else {
        nombreArchivoSalida = Path.join('recursos', nombreArchivoSalida);
    }
    await writeFile(nombreArchivoSalida, certificado, 'utf-8');
    console.log('certificado impreso para alumno', alumno.lu);
}

export async function generarHTMLcertificadoParaAlumno(pathPlantilla: string, alumno: Record<string, DatoAtomico>) {
    let certificado = await readFile(pathPlantilla, { encoding: 'utf8' });
    for (const [key, value] of Object.entries(alumno)) {
        certificado = certificado.replace(
            `[#${key}]`,
            datoATexto(value)
        );
    }
    return certificado;
}

export async function cargarNovedadesAlumnosDesdeCsv(clientDb:Client, archivoCsv:string){
    if (process.env.AIDA_CARPETA_INTERCAMBIO) {
        archivoCsv = Path.join(process.env.AIDA_CARPETA_INTERCAMBIO, 'entrada', archivoCsv);
    }
    var {dataLines: listaDeAlumnosCompleta, columns: columnas} = await leerYParsearCsv(archivoCsv)
    await refrescarTablaAlumnos(clientDb, listaDeAlumnosCompleta, columnas);
}

async function generarCertificadoAlumno(clientDb:Client, filtro:FiltroAlumnos){
    var alumnos = await obtenerAlumnoQueNecesitaCertificado(clientDb, filtro);
    if (alumnos.length == 0){
        console.log('No hay alumnos que necesiten certificado para el filtro', filtro);
    }
    for (const alumno of alumnos) {
        await generarCertificadoParaAlumno(`recursos/plantilla-certificado.html`, alumno);
    }
}

export async function generarCertificadoAlumnoPrueba(clientDb:Client){
    return generarCertificadoAlumno(clientDb, {uno:true})
}

export async function generarCertificadoAlumnoLu(clientDb:Client, lu:string){
    return generarCertificadoAlumno(clientDb, {lu})
}

export async function generarCertificadoAlumnoFecha(clientDb:Client, fechaEnTexto:string){
    const fecha = Fechas.deCualquierTexto(fechaEnTexto)
    return generarCertificadoAlumno(clientDb, {fecha})
}

export async function obtenerTodasLasCursadas(clientDb: Client): Promise<Record<string, (DatoAtomico)>[]> {
    const sql = `SELECT * FROM aida.cursadas`;
    const res = await clientDb.query(sql);
    return res.rows;
}

export async function agregarCursada(columnas: string[], valores: string[], clientDb: Client) {
    const columnasSQL = columnas.map(c => `"${c}"`).join(', ');
    const placeholders = columnas.map((_, i) => `$${i + 1}`).join(', ');
    const query = `
        INSERT INTO aida.cursadas (${columnasSQL})
        VALUES (${placeholders});
    `;
    await clientDb.query(query, valores);
}

export async function agregarCarrera(nombre: string, clientDb: Client): Promise<number> {
    const existing = await clientDb.query<{ id_carrera: number }>(`
        SELECT id_carrera FROM aida.carreras WHERE nombre_carrera = ${sqlLiteral(nombre)}
    `);

    if (existing.rows.length > 0) {
        throw new Error(`La carrera "${nombre}" ya existe en la base de datos`);
    }

    const res = await clientDb.query<{ id_carrera: number }>(`
        INSERT INTO aida.carreras (nombre_carrera)
        VALUES (${sqlLiteral(nombre)})
        RETURNING id_carrera
    `);

    return res.rows[0]!.id_carrera;
}

export async function agregarMateria(nombre: string, clientDb: Client): Promise<number> {
    console.log('Agregando materia:', nombre);

    const existing = await clientDb.query<{ id_materia: number }>(`
        SELECT id_materia FROM aida.materias WHERE nombre_materia = ${sqlLiteral(nombre)}
    `);

    if (existing.rows.length > 0) {
        throw new Error(`La materia "${nombre}" ya existe en la base de datos`);
    }

    const res = await clientDb.query<{ id_materia: number }>(`
        INSERT INTO aida.materias (nombre_materia)
        VALUES (${sqlLiteral(nombre)})
        RETURNING id_materia
    `);

    return res.rows[0]!.id_materia;
}


export async function agregarMateriaACarrera(
    carreraId: number,
    materiaId: number,
    clientDb: Client
): Promise<void> {

    const existing = await clientDb.query<{ exists: boolean }>(`
        SELECT 1 FROM aida.materiasEnCarrera
        WHERE id_carrera_MEC = ${carreraId}
          AND id_materia_MEC = ${materiaId}
    `);

    if (existing.rows.length > 0) {
        throw new Error(`La materia con ID ${materiaId} ya está asociada a la carrera con ID ${carreraId}`);
    }

    await clientDb.query(`
        INSERT INTO aida.materiasEnCarrera (id_carrera_MEC, id_materia_MEC)
        VALUES (${carreraId}, ${materiaId})
    `);
}


export const operacionesAida: DefinicionesDeOperaciones = [
    {operacion: 'prueba-primero', cantidadArgumentos: 0, accion: generarCertificadoAlumnoPrueba},
    {operacion: 'archivo'       , cantidadArgumentos: 1, accion: cargarNovedadesAlumnosDesdeCsv},
    {operacion: 'fecha'         , cantidadArgumentos: 1, accion: generarCertificadoAlumnoFecha },
    {operacion: 'lu'            , cantidadArgumentos: 1, accion: generarCertificadoAlumnoLu    },
]
