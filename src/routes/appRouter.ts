import express, { Request, Response, NextFunction } from "express";
import { Usuario } from '../auth.js';
import * as appControllers from '../controllers/appControllers.js';

// Extendemos los tipos de sesion
// No habría que sacarlo a un archivo de tipos?
declare module 'express-session' {
  interface SessionData {
      usuario?: Usuario;
  }
}

const appRouter = express.Router();

// Middleware de autenticación para el frontend
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session.usuario) {
      next();
  } else {
      res.redirect('/app/login');
  }
}

// Ruta que no requiere autenticación
appRouter.get('/login', appControllers.loginController);

// Usamos el middleware requireAuth para proteger las rutas de la aplicación
appRouter.use(requireAuth);

// Rutas que requieren autenticación
appRouter.get('/menu', appControllers.menuController);
appRouter.get('/alumnos', appControllers.alumnosController);
appRouter.get('/cursadas', appControllers.cursadasController);
appRouter.get('/archivo', appControllers.archivoController);
appRouter.get('/certificados/lu', appControllers.certificadosLUController);
appRouter.get('/certificados/fecha', appControllers.certificadosFechaController);


export default appRouter;