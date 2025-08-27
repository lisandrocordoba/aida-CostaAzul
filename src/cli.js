import { Client } from 'pg'
import { readFile } from 'node:fs/promises';

async function leerYParsearCsv(filePath){
    const contents = await readFile(filePath, { encoding: 'utf8' });
    const header = contents.split(/\r?\n/)[0];
    const columns = header.split(',').map(col => col.trim());
    const dataLines = contents.split(/\r?\n/).slice(1).filter(line => line.trim() !== '');
    return {dataLines, columns};
}

async function refrescarTablaAlumnos(clientDb, listaDeAlumnosCompleta, columnas){
    await clientDb.query("DELETE FROM aida.alumnos");
    for (const line of listaDeAlumnosCompleta) {
        const values = line.split(',');
        const query = `
            INSERT INTO aida.alumnos (${columnas.join(', ')}) VALUES 
                (${values.map((value) => value == '' ? 'null' : `'` + value + `'`).join(', ')})
        `;
        console.log(query)
        const res = await clientDb.query(query)
        console.log(res.command, res.rowCount)
    }
}

async function principal(){
    const clientDb = new Client()
    const filePath = `recursos/alumnos.csv`;
    await clientDb.connect()
    var {dataLines: listaDeAlumnosCompleta, columns: columnas} = await leerYParsearCsv(filePath)
    await refrescarTablaAlumnos(clientDb, listaDeAlumnosCompleta, columnas);
    await clientDb.end()
}

principal();