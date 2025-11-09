import * as express from 'express';

//Imports autenticacion
import session/*, { SessionData }*/ from 'express-session';
import { Usuario } from '../src/auth.js';
import { Request, Response, NextFunction } from "express";
import * as fs from 'fs';
import { readFile } from 'fs/promises';

// Extendemos los tipos de sesion
declare module 'express-session' {
  interface SessionData {
      usuario?: Usuario;
  }
}

const appRouter = express.Router();

// Aquí se pueden agregar middlewares específicos para las rutas de la aplicación
// appRouter.use(someMiddleware);
//Agregamos el middleware de session
appRouter.use(session({
  secret: process.env.SESSION_SECRET || 'cambiar_este_secreto_en_produccion', //usar variable de entorno en produccion?
  resave: false,
  saveUninitialized: false,
  cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 1 día
  }
}));

// Middleware de autenticación para el frontend
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session.usuario) {
      next();
  } else {
      res.redirect('/app/login');
  }
}

// Usamos el middleware requireAuth para proteger las rutas de la aplicación
appRouter.use(requireAuth);

// Definición de rutas de la aplicación
appRouter.get('/login', (req, res) => {
  if (req.session.usuario) {
      return res.redirect('/app/menu');
  }
  const loginHtml = fs.readFileSync('views/login.html', 'utf8');
  res.send(loginHtml);
});

appRouter.get('/menu', async (_, res) => {
    let HTML_MENU = await readFile('views/menu.html', { encoding: 'utf8' });
    res.send(HTML_MENU)
})

appRouter.get('/lu', async (_, res) => {
    let HTML_LU = await readFile('views/obtener-certificado-LU.html', { encoding: 'utf8' });
    res.send(HTML_LU);
})

appRouter.get('/fecha', async (_, res) => {
    let HTML_FECHA = await readFile('views/obtener-certificado-fecha.html', 'utf8');
    res.send(HTML_FECHA)
})

appRouter.get('/archivo', async (_, res) => {
    let plantilla_carga_csv = await readFile('views/plantilla-carga-csv.html', { encoding: 'utf8' });
    res.send(plantilla_carga_csv)
})

appRouter.get('/alumnos', async (_, res) => {
  let plantillaTablaAlumnos = await readFile('views/plantilla-tabla-alumnos.html', { encoding: 'utf8' });
  res.status(200).send(plantillaTablaAlumnos);
})

export default appRouter;