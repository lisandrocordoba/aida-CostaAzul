import express from "express";
import * as apiControllers from '../controllers/apiControllers.js';
import { Request, Response, NextFunction } from "express";
import { tableDefs } from "../applicationStructure.js";
import { createTableRouter as createTableRouter } from "./apiRoutesFactory.js";
import { Rol } from '../roles.js';

const APIRouter = express.Router();

// Middleware de autenticación para el backend
function requireAuthAPI(req: Request, res: Response, next: NextFunction) {
  if (req.session.usuario) {
      next();
  } else {
      res.status(401).json({ error: 'No autenticado' });
  }
}

// Middleware de rol para el backend
function requireRolAPI(...rolesPermitidos: string[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    const rol = req.session.rol as Rol | undefined;

    if (rol && rolesPermitidos.includes(rol.nombreRol)) {
      return next();
    }

    return res.status(401).json({ error: 'No autorizado' });
  };
}

// --- RUTAS DE AUTENTICACIÓN ---
APIRouter.post('/auth/login', express.json(), apiControllers.loginAPIController);
APIRouter.post('/auth/register', apiControllers.registerAPIController);
APIRouter.use((requireAuthAPI));
APIRouter.post('/auth/logout', apiControllers.logoutAPIController);

// --- RUTA DE SELECCIÓN DE ROL ---
APIRouter.get('/roles/get', apiControllers.getRolAPIController);
APIRouter.post('/roles/select', apiControllers.selectRolAPIController); //USAMOS EXPRESS.JSON() ACA?

// --- RUTAS DE ALUMNOS NO GENERICAS ---
APIRouter.get('/alumnos/me', apiControllers.getAlumnoActualController);
APIRouter.patch('/alumnos', requireRolAPI("secretario"), apiControllers.patchAlumnosController);

// --- RUTAS DE CURSADAS NO GENERICAS ---
APIRouter.patch('/cursadas', apiControllers.patchCursadasController);

// --- PLAN DE ESTUDIOS ---
APIRouter.patch('/plan_estudios', apiControllers.patchPlanEstudiosController);

// --- RUTAS DE CERTIFICADOS ---
APIRouter.get('/certificados', apiControllers.getCertificadosController);

// --- RUTAS GENERICAS PARA CADA ENTIDAD ---
for (const tableDef of tableDefs) {
  APIRouter.use('/' + tableDef.name, createTableRouter(tableDef));
}

export default APIRouter;



