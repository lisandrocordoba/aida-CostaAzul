import {readFile} from 'fs/promises'

export async function leerYParsearCsv(filePath:string){
    const contents = await readFile(filePath, { encoding: 'utf8' });
    return parsearCSV(contents);
}
export function parsearCSV(contents: string) {
    const header = contents.split(/\r?\n/)[0];
    if (header == null) throw new Error("archivo .csv vacio");
    const columns = header.split(',').map(col => col.trim());
    const dataLines = contents.split(/\r?\n/).slice(1).filter(line => line.trim() !== '').map(line => line.split(','));
    return { dataLines, columns };
}

