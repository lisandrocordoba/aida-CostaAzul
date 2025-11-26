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




    // CHEQUEAR COMO INCLUIR LAS TABLE DEFS EN EL MODULO
    function mapColumnGenerico(colname: ColumnName, tableName: TableName): ColumnName[] {
        //obtener fk de "tableName" en la tableDef.

        const tabla = allTableDefs.find(tabla => tabla.name === tableName);
        //console.log(allTableDefs);
        //console.log(tabla);
        const fk = tabla!.fks.find(fk => fk.column === colname); //             HABRIA QUE ATRAPAR EL CASO TABLA = NULL
        //console.log(fk);
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

    function recursiveJoin(fk: ForeignKeyDef, tablename: TableName): string{
        if (!fk){
            return ''
        };
        const tabla = allTableDefs.find(tabla => tabla.name === fk.referencesTable); // tabla alumnos
        //console.log(tabla);

        let second_fk;
        for (const column of fk.referencesColumns) {
            second_fk = tabla!.fks.find(second_fk => second_fk.column === column);
        }    //             HABRIA QUE ATRAPAR EL CASO TABLA = NULL
        console.log(second_fk);
        console.log(fk);

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
                    if(!tableWhere || !from.includes(`aida.${tableWhere.name}`)){   // Si no encontramos la tabla o la tabla no está en el from crasheamos
                        res.status(400).json({ error: `Columna ${key} no es filtro valido` });
                        return;
                    }
                    where += `aida.${tableWhere.name}.${key} = '${value}' AND `;
                };
                where = where.slice(0, -5); // sacar el ultimo AND, podriamos repensar la logica para evitar esto
            }

            /*
            YA no va, lo dejo para que vean como era el caso NO generico

            const lu = queryParams.lu as string | undefined;
            if (lu) {
                where = `WHERE aida.alumnos.lu = '${lu}'`;
            }

            if(legajo) {
                where = `WHERE aida.profesores.legajo = '${legajo}'`;
            }
            */
            console.log(`
                SELECT ${select}
                FROM ${from}
                ${where}
                ORDER BY ${orderBy ?? pk}
            `);

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
        console.log(`SELECT ${select} FROM ${from} WHERE ${pkDolarCondition(1)}`, pkParams(req.params));
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


    // No se puede cambiar carrera al alumno.
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