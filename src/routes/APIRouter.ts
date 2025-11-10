import express from "express";
import * as apiControllers from '../controllers/apiControllers.js';
import { Request, Response, NextFunction } from "express";

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

// --- RUTAS DE ALUMNOS ---
APIRouter.get('/alumnos', apiControllers.getAlumnosController);
APIRouter.post('/alumnos', apiControllers.addAlumnoController);
APIRouter.put('/alumnos/:lu', apiControllers.updateAlumnoController);
APIRouter.delete('/alumnos/:lu', apiControllers.deleteAlumnoController);
APIRouter.patch('/alumnos', apiControllers.patchAlumnosController);

// --- RUTAS DE CURSADAS ---
APIRouter.get('/cursadas', apiControllers.getCursadasController);
APIRouter.post('/cursadas', apiControllers.addCursadaController);
APIRouter.put('/cursadas/:lu', apiControllers.updateCursadaController);
APIRouter.delete('/cursadas/:lu/:materia_id/:anio/:cuatrimestre', apiControllers.deleteCursadaController);
APIRouter.patch('/cursadas', apiControllers.patchCursadasController);

// --- PLAN DE ESTUDIOS ---
APIRouter.patch('/plan_estudios', apiControllers.patchPlanEstudiosController);

export default APIRouter;
