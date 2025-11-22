import { Request, Response } from 'express';
import { pool } from '../database/db.js';
import { ColumnName, TableDef } from '../applicationStructure.js';


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

    function mapColumn(colname: ColumnName): ColumnName[] {
        const fk = fks.find(fk => fk.column === colname);
        if(fk){
            return fk.referencesColumns;    // Asumimos que no hay columnas con mismo nombre en distintas tablas
        } else {
            return [colname];
        }
    }

    const getAllRecords = async (_req: Request, res: Response): Promise<void> => {
        try {
            const select = allColnames.map(colname => mapColumn(colname)).flat();
            let from = tablename;
            if(fks.length > 0){
                // Caso JOIN
                from = `${from} ` + fks.map(fk => {
                    return `JOIN aida.${fk.referencesTable} ON ${tablename}.${fk.column} = aida.${fk.referencesTable}.${fk.referencedColumn}`;
                }).join(' ');
            }
            console.log(`SELECT ${select} FROM ${from} ORDER BY ${orderBy ?? pk}`);
            const result = await pool.query(`SELECT ${select} FROM ${from} ORDER BY ${orderBy ?? pk}`);
            res.json(result.rows);
        } catch (error) {
            console.error(`Error al obtener ${tablename}:`, error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };

    const getRecord = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query(`SELECT * FROM ${tablename} WHERE ${pkDolarCondition(1)}`, pkParams(req.params));

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
        console.log(`DELETE FROM ${tablename} WHERE ${pkDolarCondition(1)}`, pkParams(req.params));
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