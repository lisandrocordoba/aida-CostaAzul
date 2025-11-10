import * as express from 'express';

//Imports autenticacion
import { Usuario } from '../auth.js';
import { Request, Response, NextFunction } from "express";
import { readFile } from 'fs/promises';

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

// Definición de rutas de la aplicación
appRouter.get('/login', appControllers.loginController);

// Usamos el middleware requireAuth para proteger las rutas de la aplicación
appRouter.use(requireAuth);

appRouter.get('/menu', async (_, res) => {
    let HTML_MENU = await readFile('views/menu.html', { encoding: 'utf8' });
    res.send(HTML_MENU)
})

appRouter.get('/alumnos', async (_, res) => {
  let plantillaTablaAlumnos = await readFile('views/plantilla-tabla-alumnos.html', { encoding: 'utf8' });
  res.status(200).send(plantillaTablaAlumnos);
})

appRouter.get('/cursadas', async (_, res) => {
  let plantillaTablaCursadas = await readFile('views/plantilla-tabla-cursadas.html', { encoding: 'utf8' });
  res.status(200).send(plantillaTablaCursadas);
})

appRouter.get('/archivo', async (_, res) => {
  let plantilla_carga_csv = await readFile('views/plantilla-carga-csv.html', { encoding: 'utf8' });
  res.send(plantilla_carga_csv)
})

//Rutas Generacion Certificado
appRouter.get('/certificados/lu', async (_, res) => {
  let HTML_LU = await readFile('views/obtener-certificado-LU.html', { encoding: 'utf8' });
  res.send(HTML_LU);
})

appRouter.get('/certificados/fecha', async (_, res) => {
  let HTML_FECHA = await readFile('views/obtener-certificado-fecha.html', 'utf8');
  res.send(HTML_FECHA)
})

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