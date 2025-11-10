import * as express from 'express';

//Imports autenticacion
import { Usuario } from '../auth.js';
import { Request, Response, NextFunction } from "express";

//Imports Controllers
import * as appControllers from '../controllers/appControllers.js';

// Extendemos los tipos de sesion
// No habría que hacerlo en un único lugar?
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


/*
appRouter.get('/certificados/lu/:lu', async (req, res) => {
  console.log(req.params, req.query, req.body);

  let certificadoHTML;
  //Habria que hacer un request al backend para obtener el alumno con ese LU
  var alumnos = await aida.obtenerAlumnoQueNecesitaCertificado(clientDb, {lu: req.params.lu!});
  if (alumnos.length == 0){
      console.log('No hay alumnos que necesiten certificado para el lu', req.params.lu);
      res.status(404).send("El alumno no necesita certificado o no existe.");
  } else {
      for (const alumno of alumnos) {
          certificadoHTML = await aida.generarHTMLcertificadoParaAlumno(`views/plantilla-certificado.html`, alumno);
      }
      res.status(200).send(certificadoHTML);
  }
})

appRouter.get('/certificados/fecha/:fecha', async (req, res) => {
  console.log(req.params, req.query, req.body);

  let certificadoHTML;
  const fecha = fechas.deCualquierTexto(req.params.fecha!);

  //Habria que hacer un request al backend para obtener el alumno con ese LU
  var alumnos = await aida.obtenerAlumnoQueNecesitaCertificado(clientDb, {fecha: fecha});
  if (alumnos.length == 0){
      console.log('No hay alumnos que necesiten certificado para la fecha', fecha);
      res.status(404).send('No hay alumnos que necesiten certificado para la fecha');
  } else {
      for (const alumno of alumnos) {
      certificadoHTML = await aida.generarHTMLcertificadoParaAlumno(`views/plantilla-certificado.html`, alumno);
    }
    res.status(200).send(certificadoHTML);
  }
})
*/

export default appRouter;