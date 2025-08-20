import { Client } from 'pg'
const client = new Client()
await client.connect()
 
import { readFile } from 'node:fs/promises';

const filePath = `recursos/insert-ejemplo-alumnos.sql`;
const contents = await readFile(filePath, { encoding: 'utf8' });

const res = await client.query(contents)

console.log(res.command, res.rowCount) // Hello world!
await client.end()