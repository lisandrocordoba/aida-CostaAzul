import { Router } from 'express';
import { controllers } from '../controllers/apiControllerFactory.js';
import { TableDef } from '../applicationStructure.js';
import { Request, Response, NextFunction } from "express";
import { Rol } from '../roles.js';

// Middleware de ownership de datos (alumnos ven sus datos, profesores ven sus cursadas, etc)
// Es feo?: repensar...
export function requireOwnershipAPI(req: Request, res: Response, next: NextFunction) {
  const rol = req.session.rol as Rol;
  if (!rol) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const queryParams = req.query;
  // Solo el secretario puede acceder sin filtros
  if(Object.keys(queryParams).length === 0) {
    if(rol?.nombreRol !== "secretario"){
        return res.status(401).json({ error: 'No autorizado sin filtros' });
    }
    return next();

  } else {
        console.log('Accediendo a cursadas de: ', Object.values(queryParams), 'siendo:', rol?.lu);
        // Alumnos pueden ver solo sus datos
        if (rol?.nombreRol === "alumno") {
            const lu = queryParams.lu as string | undefined;
            if (!lu || lu !== rol.lu) {
                return res.status(401).json({ error: 'No autorizado a ver datos de lu:' + lu });
            }
            return next();
        }

        // Profesores pueden ver solo sus datos
        if (rol?.nombreRol === "profesor") {
            const legajo = queryParams.legajo as string | undefined;
            if (!legajo || legajo !== rol.legajo) {
                return res.status(401).json({ error: 'No autorizado a ver datos de legajo:' + legajo });
            }
            return next();
        }
    }
}


export function createTableRouter(tableDef:TableDef) {
    const pkPath = tableDef.pk.map(column => `/:${column}`).join('')
    const router = Router();
    const {
        getAllRecords,
        getRecord,
        createRecord,
        updateRecord,
        deleteRecord
    } = controllers(tableDef);
    router.get('/', requireOwnershipAPI, getAllRecords);
    router.get(pkPath, getRecord);
    router.post('/', createRecord);
    router.put(pkPath, updateRecord);
    router.delete(pkPath, deleteRecord);
    return router
}