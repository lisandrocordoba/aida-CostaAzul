import express from "express";
import * as aida from "./aida.js";
import * as fechas from "./fechas.js";
import * as csv from "./csv.js";

//Imports autenticacion
import session/*, { SessionData }*/ from 'express-session';
import { autenticarUsuario, crearUsuario, Usuario } from './auth.js';
import { Request, Response, NextFunction } from "express";
import * as fs from 'fs';

// Extendemos los tipos de sesion
declare module 'express-session' {
  interface SessionData {
      usuario?: Usuario;
  }
}

const app = express()
const port = 3000

import { Client } from 'pg'
import { readFile } from "fs/promises";
const clientDb = new Client()
clientDb.connect()

app.use(express.json({ limit: '10mb' })); // para poder leer el body
app.use(express.urlencoded({ extended: true, limit: '10mb'  })); // para poder leer el body
app.use(express.text({ type: 'text/csv', limit: '10mb' })); // para poder leer el body como texto plano


//Agregamos el middleware de session
app.use(session({
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

// Middleware de autenticación para el backend
function requireAuthAPI(req: Request, res: Response, next: NextFunction) {
  if (req.session.usuario) {
      next();
  } else {
      res.status(401).json({ error: 'No autenticado' });
  }
}

// endpoint de prueba
app.get('/ask', (req, res) => {
    var htmlResponse = '<!doctype html>\n<html>\n<head>\n<meta charset="utf8">\n</head>\n<body>';
    if (JSON.stringify(req.query).length > 2) {
        htmlResponse += '<div>Yes ' + JSON.stringify(req.query) + '</div>';
    }
    if (req.body) {
        htmlResponse += '<div>Body: ' + JSON.stringify(req.body) + '</div>';
    }
    htmlResponse + '</body></html>'
    res.send(htmlResponse);
})

// Endpoints de Autenticacion
// Página de login
app.get('/app/login', (req, res) => {
  if (req.session.usuario) {
      return res.redirect('/app/menu');
  }
  const loginHtml = fs.readFileSync('views/login.html', 'utf8');
  res.send(loginHtml);
});

// API de login
app.post('/api/v0/auth/login', express.json(), async (req, res) => {
  const { username, password } = req.body;
  const usuario = await autenticarUsuario(clientDb, username, password);
  if (usuario) {
      req.session.usuario = usuario;
      res.json({ message: 'Autenticación exitosa' });
  } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Tenemos que hacer que el boton se agregue solo si el usuario esta loggueado.
// API de logout
app.post('/api/v0/auth/logout', requireAuthAPI, (req, res) => {
  req.session.destroy(err => {
    console.log("estoy aca")
    if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
    res.clearCookie('connect.sid', { path: '/' });
    res.redirect('/app/login');
    return;
  });
});

app.post('/api/v0/auth/register', async (req, res) => {
  console.log("entra");
  const { username, password, nombre, email } = req.body;
  crearUsuario(clientDb, username, password, nombre, email);
  res.status(201).send('Usuario creado');
});

// FRONTEND
app.get('/app/menu', requireAuth, async (_, res) => {
    let HTML_MENU = await readFile('views/menu.html', { encoding: 'utf8' });
    res.send(HTML_MENU)
})

const HTML_LU=
`<!doctype html>
<html>
    <head>
        <meta charset="utf8">
    </head>
    <body>
        <div>Obtener el certificado de título en trámite</div>
        <div><label>Libreta Universitaria: <input name=lu></label></div>
        <button id="btnEnviar">Pedir Certificado</button>
        <script>
            window.onload = function() {
                document.getElementById("btnEnviar").onclick = function() {
                    var lu = document.getElementsByName("lu")[0].value;
                    window.location.href = "../api/v0/lu/" + encodeURIComponent(lu);
                }
            }
        </script>
    </body>
</html>
`;

app.get('/app/lu', requireAuth, (_, res) => {
    res.send(HTML_LU)
})

const HTML_FECHA=
`<!doctype html>
<html>
    <head>
        <meta charset="utf8">
    </head>
    <body>
        <div>Obtener el certificado de título en trámite</div>
        <div><label>Fecha del trámite: <input name=fecha type=date></label></div>
        <button id="btnEnviar">Pedir Certificado</button>
        <script>
            window.onload = function() {
                document.getElementById("btnEnviar").onclick = function() {
                    var fecha = document.getElementsByName("fecha")[0].value;
                    window.location.href = "../api/v0/fecha/" + encodeURIComponent(fecha);
                }
            }
        </script>
    </body>
</html>
`;

app.get('/app/fecha', requireAuth, (_, res) => {
    res.send(HTML_FECHA)
})

/*const HTML_ARCHIVO=
`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>CSV Upload</title>
</head>
<body>
  <h2>Subir archivo CSV</h2>
  <input type="file" id="csvFile" accept=".csv" />
  <button onclick="handleUpload()">Procesar y Enviar</button>

  <script>
    async function handleUpload() {
      const fileInput = document.getElementById('csvFile');
      const file = fileInput.files[0];
      if (!file) {
        alert('Por favor seleccioná un archivo CSV.');
        return;
      }

      const text = await file.text();

      try {
        const response = await fetch('../api/v0/alumnos', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'text/csv'
          },
          body: text
        });

        if (response.ok) {
          alert('Datos enviados correctamente.');
        } else {
          alert('Error al enviar los datos.');
        }
      } catch (error) {
        console.error('Error en la solicitud:', error);
        alert('Error de red o en el servidor.');
      }
    }
  </script>
</body>
</html>
`;
*/
app.get('/app/archivo', requireAuth, async (_, res) => {
    let plantilla_carga_csv = await readFile('views/plantilla-carga-csv.html', { encoding: 'utf8' });
    res.send(plantilla_carga_csv)
    //res.send(HTML_ARCHIVO)
})

const HTML_ARCHIVO_JSON=
`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>CSV Upload</title>
</head>
<body>
  <h2>Subir archivo CSV</h2>
  <input type="file" id="csvFile" accept=".csv" />
  <button onclick="handleUpload()">Procesar y Enviar</button>

  <script>
    function parseCSV(text) {
      const lines = text.trim().split(/\\r?\\n/);
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = values[i];
        });
        return obj;
      });
      return data;
    }

    async function handleUpload() {
      const fileInput = document.getElementById('csvFile');
      const file = fileInput.files[0];
      if (!file) {
        alert('Por favor seleccioná un archivo CSV.');
        return;
      }

      const text = await file.text();
      const jsonData = parseCSV(text);

      try {
        const response = await fetch('../api/v0/alumnos', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jsonData)
        });

        if (response.ok) {
          alert('Datos enviados correctamente.');
        } else {
          alert('Error al enviar los datos.');
        }
      } catch (error) {
        console.error('Error en la solicitud:', error);
        alert('Error de red o en el servidor.');
      }
    }
  </script>
</body>
</html>
`;

//esta ruta la estamos usando?
app.get('/app/archivo-json', requireAuth, (_, res) => {
    res.send(HTML_ARCHIVO_JSON)
})


// API DEL BACKEND
//var NO_IMPLEMENTADO='<code>ERROR 404 </code> <h1> No implementado aún ⚒<h1>';

app.get('/api/v0/lu/:lu', requireAuth, async (req, res) => {
    console.log(req.params, req.query, req.body);

    let certificadoHTML;
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

app.get('/api/v0/fecha/:fecha', requireAuth, async (req, res) => {
    console.log(req.params, req.query, req.body);

    let certificadoHTML;
    const fecha = fechas.deCualquierTexto(req.params.fecha!);

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

// Actualizar la tabla de alumnos a partir de un CSV
app.patch('/api/v0/alumnos', requireAuthAPI, async (req, res) => {
    console.log(req.params, req.query, req.body);

    var {dataLines: listaDeAlumnosCompleta, columns: columnas} = await csv.parsearCSV(req.body.csvText);
    await aida.refrescarTablaAlumnos(clientDb, listaDeAlumnosCompleta, columnas);

    res.status(200).send('Tabla de alumnos actualizada');

})

app.get('/app/alumnos', requireAuth, async (_, res) => {
  let plantillaTablaAlumnos = await readFile('views/plantilla-tabla-alumnos.html', { encoding: 'utf8' });
  res.status(200).send(plantillaTablaAlumnos);
})

// esto no tendria que ser api/v0/ ??
app.get('/app/tablaAlumnos', requireAuthAPI, async (_, res) => {

    //hago select tabla alumnos
    var alumnos = await aida.obtenerTodosAlumnos(clientDb);
    //pasar a json
    var jsonAlumnos = JSON.stringify(alumnos);
    //devolver al frontend
    res.status(200).send(jsonAlumnos);

})

// esto no tendria que ser api/v0/ ??
app.post('/app/tablaAlumnos', requireAuthAPI, async (req, res) => {
    const columnas = Object.keys(req.body);
    const valores = Object.values(req.body) as string[];
    await aida.agregarAlumno(columnas, valores, clientDb);

    res.status(200).send('Alumno agregado');
    console.log(req.body);
});

// esto no tendria que ser api/v0/ ??
app.delete('/app/tablaAlumnos/:lu', requireAuthAPI, async (req, res) => {
    const lu = req.params.lu;
    await clientDb.query(`DELETE FROM aida.alumnos WHERE lu = $1`, [lu]);
    res.status(200).send('Alumno eliminado');
});

// PENSAR COMO QUEREMOS LIMITAR CAMBIOS
// EJEMPLO: ES POSIBLE QUE UN ALUMNO TENGA TITULO EN TRAMITE Y SE LE CAMBIE LA CARRERA
app.put('/app/tablaAlumnos/:lu', requireAuthAPI, async (req, res) => {
    const lu = req.params.lu;
    const columnas = Object.keys(req.body);
    const valores = Object.values(req.body) as string[];
    await aida.actualizarAlumno(lu!, columnas, valores, clientDb);
    console.log(valores);
    res.status(200).send('Alumno actualizado');
});

app.get('/app/cursadas', requireAuth, async (_, res) => {
  let plantillaTablaCursadas = await readFile('views/plantilla-tabla-cursadas.html', { encoding: 'utf8' });
  res.status(200).send(plantillaTablaCursadas);
})

app.get('/app/tablaCursadas', requireAuthAPI, async (_, res) => {
    //hago select tabla cursadas
    var cursadas = await aida.obtenerTodasLasCursadas(clientDb);
    //pasar a json
    var jsonCursadas = JSON.stringify(cursadas);
    //devolver al frontend
    res.status(200).send(jsonCursadas);
});

// Ruta agrega cursada con su nota a la tabla cursadas
// IMPORTANTE: si es la última materia, un trigger en la db ingresa la fecha de título en trámite.
app.post('/app/tablaCursadas', requireAuthAPI, async (req, res) => {
  try {
      const columnas = Object.keys(req.body);
      const valores = Object.values(req.body);
      await aida.agregarCursada(columnas, valores as string[], clientDb);

      res.status(200).send('Cursada agregada');
      console.log('Cursada agregada:', req.body);
  } catch (err) {
      console.error('Error al agregar cursada:', err);
      res.status(500).send('Error al agregar la cursada');
  }
});

// Edita tabla de cursadas
app.put('/app/tablaCursadas/:lu', requireAuthAPI, async (req, res) => {
  const lu = req.params.lu;
  const columnas = Object.keys(req.body);
  const valores = Object.values(req.body) as string[];
  console.log(valores);
  await aida.actualizarCursada(lu!, columnas, valores, clientDb);
  res.status(200).send('Cursada actualizada');
});

app.delete('/app/tablaCursadas/:lu/:materia_id/:anio/:cuatrimestre', requireAuthAPI, async (req, res) => {
  const { lu, materia_id, anio, cuatrimestre } = req.params;
  await clientDb.query(`DELETE FROM aida.cursadas WHERE alumno_lu = $1 AND materia_id = $2 AND anio = $3 AND cuatrimestre = $4`, [lu, materia_id, anio, cuatrimestre]);
  res.status(200).send('Cursada eliminado');
});

// Carrera con su plan de estudios a la base de datos a partir de un CSV
app.patch('/api/v0/plan_estudios', requireAuthAPI, async (req, res) => {
  try {
      const { csvText, careerName } = req.body;

      if (!csvText || !careerName) {
          res.status(400).send('Faltan csvText o careerName');
      }

      // Agregar carrera
      const carreraId = await aida.agregarCarrera(careerName.trim(), clientDb);

      // Parsear CSV con materias
      const { dataLines, columns } = csv.parsearCSV(csvText);

      // Validar estructura del CSV: una sola columna llamada "materias"
      if (columns.length !== 1 || columns[0]!.toLowerCase() !== 'materias') {
          res.status(400).send('CSV inválido: se espera columna "materias"');
      }

      // Procesar cada materia
      for (const line of dataLines) {
          const materiaNombre = line[0]!.trim();
          if (!materiaNombre) continue;

          const materiaId = await aida.agregarMateria(materiaNombre, clientDb);

          await aida.agregarMateriaACarrera(carreraId, materiaId, clientDb);
      }

      res.status(200).send(`Carrera "${careerName}" y materias asociadas procesadas correctamente.`);
  } catch (err) {
      console.error(err);
      res.status(500).send(String(err));
  }
});

// Actualiza la tabla de cursadas a partir de un CSV
app.patch('/api/v0/cursadas', requireAuthAPI, async (req, res) => {
  console.log(req.params, req.query, req.body);

  var {dataLines: listaDeCursadasCompleta, columns: columnas} = await csv.parsearCSV(req.body.csvText);
  await aida.refrescarTablaCursadas(clientDb, listaDeCursadasCompleta, columnas);

  res.status(200).send('Tabla de cursadas actualizada');
});





app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}/app/menu`)
})
