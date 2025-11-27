import { Request, Response } from 'express';
import fs from 'fs';
import { readFile } from 'fs/promises';

// --- LOGIN ---
export function loginController(req: Request, res: Response) {
  if (req.session.usuario) {
    return res.redirect('/app/menu');
  }
  const loginHtml = fs.readFileSync('views/login.html', 'utf8');
  res.send(loginHtml);
}

// --- SELECCION ROL ---
export function seleccionRolController(_: Request, res: Response) {
  const seleccionRolHtml = fs.readFileSync('views/seleccionRol.html', 'utf8');
  res.send(seleccionRolHtml);
}

// --- MENU ---
export async function menuController(req: Request, res: Response) {
  const rol = req.session.rol;
  if(!rol){
    return res.redirect('/app/seleccion-rol');
  }
  const HTML_MENU = await readFile(`views/menu-${rol.nombreRol}.html`, { encoding: "utf8" });
  res.send(HTML_MENU);
}

// --- ALUMNOS ---
export async function alumnosController(_: Request, res: Response) {
  const plantillaTablaAlumnos = await readFile('views/plantilla-tabla-alumnos.html', { encoding: 'utf8' });
  res.status(200).send(plantillaTablaAlumnos);
}

// --- USUARIOS ---
export async function usuariosController(_: Request, res: Response) {
  const HTML = await readFile('views/tabla-usuarios.html', { encoding: 'utf8' });
  res.status(200).send(HTML);
}

// --- CURSADAS ---
export async function cursadasController(_: Request, res: Response) {
  const plantillaTablaCursadas = await readFile('views/plantilla-tabla-cursadas.html', { encoding: 'utf8' });
  res.status(200).send(plantillaTablaCursadas);
}

export async function cursadasProfesorController(_: Request, res: Response) {
  const plantillaTablaCursadasProfesor = await readFile('views/tabla-cursadas-profesor.html', { encoding: 'utf8' });
  res.status(200).send(plantillaTablaCursadasProfesor);
}

// --- ARCHIVO ---
export async function archivoController(_: Request, res: Response) {
  const plantilla_carga_csv = await readFile('views/plantilla-carga-csv.html', { encoding: 'utf8' });
  res.send(plantilla_carga_csv);
}

// --- CERTIFICADOS (LU) ---
export async function certificadosLUController(_: Request, res: Response) {
  const HTML_LU = await readFile('views/obtener-certificado-LU.html', { encoding: 'utf8' });
  res.send(HTML_LU);
}

// --- CERTIFICADOS (FECHA) ---
export async function certificadosFechaController(_: Request, res: Response) {
  const HTML_FECHA = await readFile('views/obtener-certificado-fecha.html', { encoding: 'utf8' });
  res.send(HTML_FECHA);
}

// --- CAMBIO DE PASSWORD ---
export async function cambiarPasswordsController(_: Request, res: Response) {
  const HTML = await readFile('views/cambiar-passwords.html', { encoding: 'utf8' });
  res.send(HTML);
}