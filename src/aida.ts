import { Client } from "pg"
import { readFile, writeFile } from "fs/promises"
import * as Path from 'path';

import { Fecha } from "./fechas.js"
import * as Fechas from "./fechas.js";
import { DatoAtomico, datoATexto, sqlLiteral } from "./tipos-atomicos.js"
import { leerYParsearCsv } from "./csv.js"
import { DefinicionesDeOperaciones } from "./orquestador.js";


export async function refrescarTablaAlumnos(clientDb: Client, listaDeAlumnosCompleta:string[][], columnas:string[]){
    await clientDb.query("DELETE FROM aida.alumnos");
    for (const values of listaDeAlumnosCompleta) {
        await agregarAlumno(columnas, values, clientDb);
    }
}

export async function actualizarAlumno(lu: string, columnas: string[], valores: string[], clientDb: Client) {
    const setClause = columnas.map((columna, index) => `${columna} = ${valores[index] == '' ? 'null' : sqlLiteral(valores[index]!)}`).join(', ');
    const query = `UPDATE aida.alumnos SET ${setClause} WHERE lu = ${sqlLiteral(lu)}`;
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

export async function obtenerAlumnoQueNecesitaCertificado(clientDb: Client, filtro:FiltroAlumnos):Promise<Record<string, (DatoAtomico)>[]>{
    const sql = `SELECT *
    FROM aida.alumnos
    WHERE titulo IS NOT NULL AND titulo_en_tramite IS NOT NULL
        ${`lu` in filtro ? `AND lu = ${sqlLiteral(filtro.lu)}` : ``}
        ${`fecha` in filtro ? `AND titulo_en_tramite = ${sqlLiteral(filtro.fecha)}` : ``}
    ORDER BY egreso
    ${`uno` in filtro ? `LIMIT 1` : ``}`;
    const res = await clientDb.query(sql)
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
    const existing = await clientDb.query<{ id: number }>(`
        SELECT id FROM aida.carreras WHERE nombre = ${sqlLiteral(nombre)}
    `);

    if (existing.rows.length > 0) {
        throw new Error(`La carrera "${nombre}" ya existe en la base de datos`);
    }

    const res = await clientDb.query<{ id: number }>(`
        INSERT INTO aida.carreras (nombre)
        VALUES (${sqlLiteral(nombre)})
        RETURNING id
    `);

    return res.rows[0]!.id;
}

export async function agregarMateria(nombre: string, clientDb: Client): Promise<number> {
    const existing = await clientDb.query<{ id: number }>(`
        SELECT id FROM aida.materias WHERE nombre = ${sqlLiteral(nombre)}
    `);

    if (existing.rows.length > 0) {
        throw new Error(`La materia "${nombre}" ya existe en la base de datos`);
    }

    const res = await clientDb.query<{ id: number }>(`
        INSERT INTO aida.materias (nombre)
        VALUES (${sqlLiteral(nombre)})
        RETURNING id
    `);

    return res.rows[0]!.id;
}

export async function agregarMateriaACarrera(carreraId: number, materiaId: number, clientDb: Client): Promise<void> {
    const existing = await clientDb.query<{ exists: boolean }>(`
        SELECT 1 FROM aida.materiasEnCarrera
        WHERE carrera_id = ${carreraId} AND materia_id = ${materiaId}
    `);

    if (existing.rows.length > 0) {
        throw new Error(`La materia con ID ${materiaId} ya está asociada a la carrera con ID ${carreraId}`);
    }

    await clientDb.query(`
        INSERT INTO aida.materiasEnCarrera (carrera_id, materia_id)
        VALUES (${carreraId}, ${materiaId})
    `);
}

export const operacionesAida: DefinicionesDeOperaciones = [
    {operacion: 'prueba-primero', cantidadArgumentos: 0, accion: generarCertificadoAlumnoPrueba},
    {operacion: 'archivo'       , cantidadArgumentos: 1, accion: cargarNovedadesAlumnosDesdeCsv},
    {operacion: 'fecha'         , cantidadArgumentos: 1, accion: generarCertificadoAlumnoFecha },
    {operacion: 'lu'            , cantidadArgumentos: 1, accion: generarCertificadoAlumnoLu    },
]
