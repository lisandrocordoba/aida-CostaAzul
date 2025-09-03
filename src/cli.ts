import { Client } from 'pg'
import { readFile } from 'node:fs/promises';

async function leerYParsearCsv(filePath){
    const contents = await readFile(filePath, { encoding: 'utf8' });
    const header = contents.split(/\r?\n/)[0];
    const columns = header.split(',').map(col => col.trim());
    const dataLines = contents.split(/\r?\n/).slice(1).filter(line => line.trim() !== '');
    return {dataLines, columns};
}

async function refrescarTablaAlumnos(clientDb, filepath){
    var {dataLines: listaDeAlumnosCompleta, columns: columnas} = await leerYParsearCsv(filepath);

    for (const line of listaDeAlumnosCompleta) {
        const values = line.split(',');
        const query = `
            INSERT INTO aida.alumnos (${columnas.join(', ')}) VALUES
                (${values.map((value) => value == '' ? 'null' : `'` + value + `'`).join(', ')})
        `;
        console.log(query)
        try {
            const res = await clientDb.query(query)
            console.log(res.command, res.rowCount)
        } catch (e) {
            console.error('Error al insertar alumno:', e.message, '\nlu: ', values[0]);
        }
    }
}

async function obtenerPrimerAlumnoQueNecesitaCertificado(clientDb){
    const sql = `SELECT *
    FROM aida.alumnos
    WHERE titulo IS NOT NULL AND titulo_en_tramite IS NOT NULL
    ORDER BY egreso
	LIMIT 1`;
    const res = await clientDb.query(sql)
    if (res.rows.length > 0){
        return res.rows[0];
    } else {
        return null;
    }
}
async function generarCertificadosSegunFechaEnTramite(clientDb, fecha){
    // buscar todos los alumnos que tengan titulo_en_tramite = parametro
    // for alumno in alumnos_con_fecha{
    //   generarCertificadoParaAlumno(alumno)
    // }
}

async function generarCertificadoParaAlumno(clientDb, alumno){
    console.log('alumno', alumno);
}

async function principal(){
    const clientDb = new Client()
    await clientDb.connect()

    const comando = process.argv[process.argv.length-2];
    const parametro = process.argv[process.argv.length-1];

    if (comando == '--archivo'){
        await refrescarTablaAlumnos(clientDb, parametro);
        process.exit(1);
    } else if (comando == '--fecha'){
        await generarCertificadosSegunFechaEnTramite(clientDb, parametro);
        process.exit(1);
    } else {
        console.log('Uso: node cli.js --archivo <ruta-al-archivo-csv>')
        process.exit(1);
    }

    var alumno = await obtenerPrimerAlumnoQueNecesitaCertificado(clientDb);
    if (alumno == null){
        console.log('No hay alumnos que necesiten certificado');
    } else {
        await generarCertificadoParaAlumno(clientDb, alumno);
    }

    await clientDb.end()
}

principal();