import { Router } from 'express';
import { controllers } from '../controllers/controllerFactory.js';

import { TableDef } from '../applicationStructure.js';

export function tableRoutes(tableDef:TableDef) {
    const pkPath = tableDef.pk.map(column => `/:${column}`).join('')
    const router = Router();
    const {
        getAllRecords,
        getRecord,
        createRecord,
        updateRecord,
        deleteRecord
    } = controllers(tableDef);
    router.get('/', getAllRecords);
    router.get(pkPath, getRecord);
    router.post('/', createRecord);
    router.put(pkPath, updateRecord);
    router.delete(pkPath, deleteRecord);
    return router
}