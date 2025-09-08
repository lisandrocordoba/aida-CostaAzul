import { Client } from 'pg'
import { readFile, writeFile } from 'node:fs/promises';


function isValidDate(dateStr) {
    // chequeo de formato primero
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

    const [year, month, day] = dateStr.split('-').map(Number);

    // Mes en JS es 0–11
    const d = new Date(year, month - 1, day);

    return (
        d.getFullYear() === year &&
        d.getMonth() === month - 1 &&
        d.getDate() === day
    );
}

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

async function generarCertificadosSegunFechaEnTramite(clientDb, fecha){
    if (!isValidDate(fecha)){
        console.error('La fecha debe tener el formato YYYY-MM-DD');
        process.exit(1);
    }

    // Buscamos todos los alumnos que tengan titulo_en_tramite = parametro
    const sql = `
    SELECT *
    FROM aida.alumnos
    WHERE titulo IS NOT NULL
          AND titulo_en_tramite = $1`;

    const alumnos_con_fecha = await clientDb.query(sql, [fecha]);

    // Generamos los certificados para cada uno
    for(const alumno of alumnos_con_fecha.rows){
        await generarCertificadoParaAlumno(`recursos/plantilla-certificado.html`, alumno);
    }
    console.log(`Se encontraron ${alumnos_con_fecha.rows.length} alumnos con titulo_en_tramite = ${fecha}`);
}

async function generarCertificadosSegunLU(clientDb, lu){
    // Buscamos todos los alumnos que tengan LU = parametro
    const sql = `
    SELECT *
    FROM aida.alumnos
    WHERE titulo IS NOT NULL
          AND titulo_en_tramite IS NOT NULL
          AND lu = $1`;
    const alumnos_con_lu = await clientDb.query(sql, [lu]);

    // Generamos los certificados para cada uno
    for(const alumno of alumnos_con_lu.rows){
        await generarCertificadoParaAlumno(`recursos/plantilla-certificado.html`, alumno);
    }
    console.log(`Se encontraron ${alumnos_con_lu.rows.length} alumnos con LU = ${lu}`);
}

function pasarAStringODarErrorComoCorresponda(value){
    var result = value == null ? '' :
            typeof value == "string" ? value :
            value instanceof Date ? value.toDateString() :
            null;
    if (result == null){
        throw new Error('No se puede convertir a string el valor: ' + value);
    }
    return result;
}

async function generarCertificadoParaAlumno(pathPlantilla, alumno){
    let certificado = await readFile(pathPlantilla, { encoding: 'utf8' });
    for (const [key, value] of Object.entries(alumno)) {
        certificado = certificado.replace(
            `[#${key}]`,
            pasarAStringODarErrorComoCorresponda(value)
        );
    }
    await writeFile(`certificados/certificado-${alumno.nombres}.html`, certificado, 'utf-8');
    console.log('certificado impreso para alumno', alumno.nombres);
}

async function principal(){
    const clientDb = new Client();
    await clientDb.connect();

    const comando = process.argv[process.argv.length-2];
    const parametro = process.argv[process.argv.length-1];

    if (comando == '--archivo'){
        await refrescarTablaAlumnos(clientDb, parametro);
    } else if (comando == '--fecha'){
        await generarCertificadosSegunFechaEnTramite(clientDb, parametro);
    } else if (comando == '--lu'){
        await generarCertificadosSegunLU(clientDb, parametro);
    }
    else {
        console.error('Comando no reconocido. Usar --archivo <path> o --fecha <YYYY-MM-DD> o --lu <LU>');
    }

    await clientDb.end();
    console.log('terminado');
    process.exit(0);
}

principal();