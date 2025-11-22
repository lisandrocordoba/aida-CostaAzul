import express from "express";
import * as apiControllers from '../controllers/apiControllers.js';
import { Request, Response, NextFunction } from "express";
import { tableDefs } from "../applicationStructure.js";
import { createTableRouter as createTableRouter } from "./apiRoutesFactory.js";

const APIRouter = express.Router();

// Middleware de autenticación para el backend

function requireAuthAPI(req: Request, res: Response, next: NextFunction) {
  if (req.session.usuario) {
      next();
  } else {
      res.status(401).json({ error: 'No autenticado' });
  }
}


// --- RUTAS DE AUTENTICACIÓN ---
APIRouter.post('/auth/login', express.json(), apiControllers.loginAPIController);
APIRouter.use(requireAuthAPI);
APIRouter.post('/auth/logout', apiControllers.logoutAPIController);
APIRouter.post('/auth/register', apiControllers.registerAPIController);

// --- RUTAS GENERICAS PARA CADA ENTIDAD ---
for (const tableDef of tableDefs) {
  APIRouter.use('/' + tableDef.name, createTableRouter(tableDef));
}

// --- RUTAS DE ALUMNOS NO GENERICAS ---
APIRouter.patch('/alumnos', apiControllers.patchAlumnosController);

// --- RUTAS DE CURSADAS NO GENERICAS ---
APIRouter.patch('/cursadas', apiControllers.patchCursadasController);

// --- PLAN DE ESTUDIOS ---
APIRouter.patch('/plan_estudios', apiControllers.patchPlanEstudiosController);


// --- RUTAS DE CERTIFICADOS ---
APIRouter.get('/certificados/', apiControllers.getCertificadosController);

export default APIRouter;



