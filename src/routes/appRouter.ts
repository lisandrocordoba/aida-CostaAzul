import express, { Request, Response, NextFunction } from "express";
import { Usuario } from '../auth.js';
import * as appControllers from '../controllers/appControllers.js';
import { Rol } from '../roles.js';

// Extendemos los tipos de sesion
// HABRIA QUE HACERLO EN OTRO LADO!
declare module 'express-session' {
  interface SessionData {
      usuario?: Usuario;
      rol?: Rol | null;
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

// Middleware de autenticación para el frontend
function requireRol(...rolesPermitidos: string[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    const rol = req.session.rol as Rol | undefined;

    if (rol && rolesPermitidos.includes(rol.nombreRol)) {
      return next();
    }

    res.redirect('/app/login');
  };
}

// Ruta que no requiere autenticación
appRouter.get('/login', appControllers.loginController);

// Usamos el middleware requireAuth para proteger las rutas de la aplicación
appRouter.use(requireAuth);

appRouter.get('/', (_: Request, res: Response) => {
  res.redirect('/app/menu');
});

// Rutas que requieren autenticación

// Ruta de selección de rol
appRouter.get('/seleccion-rol', appControllers.seleccionRolController);

// Rutas app
appRouter.get('/menu', appControllers.menuController);
appRouter.get('/alumnos', requireRol("secretario", "profesor"), appControllers.alumnosController);
appRouter.get('/usuarios', requireRol("secretario"), appControllers.usuariosController);
appRouter.get('/cursadas', /*requireRol("secretario", "profesor"),*/ appControllers.cursadasController);
appRouter.get('/dicta', requireRol("secretario"), appControllers.dictaController);
appRouter.get('/archivo', requireRol("secretario"), appControllers.archivoController);
appRouter.get('/certificados/lu', requireRol("secretario"), appControllers.certificadosLUController);
appRouter.get('/certificados/fecha', requireRol("secretario"), appControllers.certificadosFechaController);
appRouter.get('/cursadas/profesor', requireRol("profesor"), appControllers.cursadasProfesorController);
appRouter.get('/cambiar-passwords', appControllers.cambiarPasswordsController);
export default appRouter;