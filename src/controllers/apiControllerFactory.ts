import { Request, Response } from 'express';
import { pool } from '../database/db.js';
import { ColumnName, ForeignKeyDef, TableDef, TableName } from '../applicationStructure.js';
import { tableDefs } from "../applicationStructure.js";

export function controllers(tableDef: TableDef){

    const tablename = 'aida.'+tableDef.name;
    const allColnames = tableDef.columns.map(def => def.name);
    const {pk} = tableDef;
    const {fks} = tableDef;
    const orderBy = tableDef.orderBy ?? pk
    const elementName = tableDef.elementName ?? 'registro de ' + tableDef.name
    const pkDolarCondition = (startingOn:number) => pk.map((colname,i) => `${colname} = \$${i+startingOn}`).join(' AND ')
    const pkParams = (params:Record<string, any>) => pk.map(colname => params[colname])
    const allParams = (params:Record<string, any>) => allColnames.map(colname => params[colname])
    const allTableDefs = tableDefs;



    // Mapea una columna a todas las columnas necesarias para hacer joins y obtenerla
    function mapColumnGenerico(colname: ColumnName, tableName: TableName): ColumnName[] {
        const tabla = allTableDefs.find(tabla => tabla.name === tableName);
        const fk = tabla!.fks.find(fk => fk.column === colname);
        if(fk){
            return [colname, ...fk.referencesColumns.map(referenceColname => mapColumnGenerico(referenceColname, fk.referencesTable)).flat()];    // Asumimos que no hay columnas con mismo nombre en distintas tablas
        } else {
            return [colname];
        }
    }

    function mapColumn(colname: ColumnName): ColumnName[] {
        const fk = fks.find(fk => fk.column === colname);
        if(fk){
            return [colname, ...fk.referencesColumns];    // Asumimos que no hay columnas con mismo nombre en distintas tablas
        } else {
            return [colname];
        }
    }

    // Mapea recursivamente los joins necesarios para obtener una columna via foreign keys
    function recursiveJoin(fk: ForeignKeyDef, tablename: TableName): string{
        if (!fk){
            return ''
        };
        const tabla = allTableDefs.find(tabla => tabla.name === fk.referencesTable);

        let second_fk;
        for (const column of fk.referencesColumns) {
            second_fk = tabla!.fks.find(second_fk => second_fk.column === column);
        }

        return `JOIN aida.${fk.referencesTable} ON aida.${tablename}.${fk.column} = aida.${fk.referencesTable}.${fk.referencedColumn} ` + recursiveJoin(second_fk!, tabla!.name)
    }


    const getAllRecords = async (req: Request, res: Response): Promise<void> => {
        try {
            const select = allColnames.map(colname => mapColumnGenerico(colname,tableDef.name)).flat();

            let from = tablename;
            if(fks.length > 0){
                from = `${from} ` + fks.map(fk => recursiveJoin(fk, tableDef.name)).join(' ');
            }

            let where = '';
            const queryParams = req.query;
            if (Object.keys(queryParams).length > 0) {
                where = 'WHERE ';
                let tableWhere: TableDef | undefined;
                for(const [key, value] of Object.entries(queryParams)) {
                    // Para cada query param que nos pasen, vamos a buscar en que tabla está esa columna
                    // Ejemplo: si nos pasan ?lu=1234, vamos a tener tableWhere = alumnos y x lo tanto
                    // WHERE aida.alumnos.lu = '1234'
                    // Notar que si nos hubieran pasado ?alumno_lu=1234, la tabla seria cursadas
                    // Notar que esto funciona ya que asumimos NO hay columnas de igual nombre en distintas tablas
                    tableWhere = allTableDefs.find(tabla => tabla.columns.some(colDef => colDef.name === key));
                    if(!tableWhere || !from.includes(`aida.${tableWhere.name}`)){
                        res.status(400).json({ error: `Columna ${key} no es filtro valido` });
                        return;
                    }
                    where += `aida.${tableWhere.name}.${key} = '${value}' AND `;
                };
                where = where.slice(0, -5); // sacar el ultimo AND, podriamos repensar la logica para evitar esto
            }

            const result = await pool.query(`
                SELECT ${select}
                FROM ${from}
                ${where}
                ORDER BY ${orderBy ?? pk}
            `);
            res.json(result.rows);

        } catch (error) {
            console.error(`Error al obtener ${tablename}:`, error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };

    const getRecord = async (req: Request, res: Response): Promise<void> => {
    try {
        const select = allColnames.map(colname => mapColumn(colname)).flat();
        let from = tablename;
        if(fks.length > 0){
            // Caso JOIN
            from = `${from} ` + fks.map(fk => {
                return `JOIN aida.${fk.referencesTable} ON ${tablename}.${fk.column} = aida.${fk.referencesTable}.${fk.referencedColumn}`;
            }).join(' ');
        }
        const result = await pool.query(`SELECT ${select} FROM ${from} WHERE ${pkDolarCondition(1)}`, pkParams(req.params));
        if (result.rows.length === 0) {
        res.status(404).json({ error: `${elementName} no encontrado` });
        return;
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(`Error al obtener ${elementName}:`, error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
    };

    const createRecord = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query(
        `INSERT INTO ${tablename} (${allColnames}) VALUES (${allColnames.map((_,i)=>`\$${i+1}`)}) RETURNING *`,
        allParams(req.body)
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(`Error al crear ${elementName}:`, error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
    };


    // OBS: No se puede cambiar carrera al alumno.
    const updateRecord = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query(
        `UPDATE ${tablename} SET ${allColnames.map((colname, i)=>`${colname}=\$${i+1}`)} WHERE ${pkDolarCondition(allColnames.length + 1)} RETURNING *`,
        [...allParams(req.body), ...pkParams(req.params)]
        );

        if (result.rows.length === 0) {
        res.status(404).json({ error: `${elementName} no encontrado` });
        return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(`Error al actualizar ${elementName}:`, error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
    };

    const deleteRecord = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query(
        `DELETE FROM ${tablename} WHERE ${pkDolarCondition(1)} RETURNING *`,
        pkParams(req.params)
        );

        if (result.rows.length === 0) {
        res.status(404).json({ error: `${elementName} no encontrado` });
        return;
        }

        res.json({ message: `${elementName} eliminado correctamente` });
    } catch (error) {
        console.error(`Error al eliminar ${elementName}:`, error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
    };

    return {getRecord, getAllRecords, createRecord, updateRecord, deleteRecord};

}