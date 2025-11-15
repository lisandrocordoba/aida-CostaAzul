└── routes/
    ├── app/
    │   ├── login.js                // GET /app/login
    │   ├── menu.js                 // GET /app/menu
    │   ├── alumnos.js              // GET /app/alumnos
    │   ├── cursadas.js             // GET /app/cursadas
    │   ├── archivo.js              // GET /app/archivo
    │   ├── certificados/
    │   │   ├── certificados.js     // GET /app/certificados/lu/:lu // esto deberia hacer request a alumnos en el back
    │   │   │                       // GET /app/certificados/fecha/:fecha
    │   │   ├── lu.js               // GET /app/certificados/lu
    │   │   └── fecha.js            // GET /app/certificados/fecha
    │   │
    │   └── index.js                // mounts /app/* routers
    │
    ├── api/
    │   ├── v0/
    │   │   ├── auth.js             // /api/v0/auth/
    │   │   │                      //   ├── POST /api/v0/auth/login
    │   │   │                      //   ├── POST /api/v0/auth/logout
    │   │   │                      //   └── POST /api/v0/auth/register
    │   │   ├── alumnos.js          // /api/v0/alumnos
    │   │   │                      //   ├── GET /api/v0/alumnos
    │   │   │                      //   ├── POST /api/v0/alumnos
    │   │   │                      //   ├── PUT /api/v0/alumnos/:lu
    │   │   │                      //   ├── DELETE /api/v0/alumnos/:lu
    │   │   │                      //   └── PATCH /api/v0/alumnos       // Adoptamos la semántica de que PATCH es con CSV
    │   │   ├── cursadas.js         // /api/v0/cursadas
    │   │   │                      //   ├── GET /api/v0/cursadas
    │   │   │                      //   ├── POST /api/v0/cursadas
    │   │   │                      //   ├── PUT /api/v0/cursadas/:lu/:materia_id/:anio/:cuatrimestre
    │   │   │                      //   ├── DELETE /api/v0/cursadas/:lu/:materia_id/:anio/:cuatrimestre
    │   │   │                      //   └── PATCH /api/v0/cursadas      // Adoptamos la semántica de que PATCH es con CSV
    │   │   └── carreras.js         // /api/v0/carreras
    │   │                          //   └── PATCH /api/v0/carreras      // Adoptamos la semántica de que PATCH es con CSV
    │   │
    │   └── index.js                // mounts /api/* routers
    │
    └── index.js                    // mounts app/ and api/ routers


Modificaciones posibles:
    - En lugar de tener dos páginas para imprimir certificados (por LU, por fecha) podría ser una sola con un form más complejo.
    - Separar responsabilidades en las rutas que generan certificados: generar un enpoint en el back que devuelva un JSON,
      y un endpoint en el front que genere el html (o incluso podría hacerse en el browser).

// ENDPOINT DE PRUEBA (?)

/ask

// FRONTEND

/app/login

app.get('/app/login', (req, res) => {
  if (req.session.usuario) {
      return res.redirect('/app/menu');
  }
  const loginHtml = fs.readFileSync('views/login.html', 'utf8');
  res.send(loginHtml);
});

/app/menu

app.get('/app/menu', requireAuth, async (_, res) => {
    let HTML_MENU = await readFile('views/menu.html', { encoding: 'utf8' });
    res.send(HTML_MENU)
})

/app/alumnos

app.get('/app/alumnos', requireAuth, async (_, res) => {
  let plantillaTablaAlumnos = await readFile('views/plantilla-tabla-alumnos.html', { encoding: 'utf8' });
  res.status(200).send(plantillaTablaAlumnos);
})

/app/cursadas

app.get('/app/cursadas', requireAuth, async (_, res) => {
  let plantillaTablaCursadas = await readFile('views/plantilla-tabla-cursadas.html', { encoding: 'utf8' });
  res.status(200).send(plantillaTablaCursadas);
})

/app/archivo

app.get('/app/archivo', requireAuth, async (_, res) => {
    let plantilla_carga_csv = await readFile('views/plantilla-carga-csv.html', { encoding: 'utf8' });
    res.send(plantilla_carga_csv)
})

/app/lu --> /app/certificados/lu

app.get('/app/lu', requireAuth, (_, res) => {
    res.send(HTML_LU)
})

/app/fecha --> /app/certificados/fecha

app.get('/app/fecha', requireAuth, (_, res) => {
    res.send(HTML_FECHA)
})

/api/v0/lu/:lu --> /app/certificados/lu/:lu

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

/api/v0/fecha/:fecha --> /app/certificados/fecha/:fecha

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


// API DEL BACKEND

/api/v0/auth/login

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

/api/v0/auth/logout

app.post('/api/v0/auth/logout', requireAuthAPI, (req, res) => {
  req.session.destroy(err => {
    console.log("estoy aca")
    if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
    res.clearCookie('connect.sid', { path: '/' });
    res.redirect('/app/login');
    return;
  });
});

/api/v0/auth/register

app.post('/api/v0/auth/register', async (req, res) => {
  console.log("entra");
  const { username, password, nombre, email } = req.body;
  crearUsuario(clientDb, username, password, nombre, email);
  res.status(201).send('Usuario creado');
});

// /api/v0/alumnos GET
app.get('/app/tablaAlumnos', requireAuthAPI, async (_, res) => {

    //hago select tabla alumnos
    var alumnos = await aida.obtenerTodosAlumnos(clientDb);
    //pasar a json
    var jsonAlumnos = JSON.stringify(alumnos);
    //devolver al frontend
    res.status(200).send(jsonAlumnos);

})


// crea un alumno
// /app/tablaAlumnos --> /api/v0/alumnos POST
app.post('/app/tablaAlumnos', requireAuthAPI, async (req, res) => {
    const columnas = Object.keys(req.body);
    const valores = Object.values(req.body) as string[];
    await aida.agregarAlumno(columnas, valores, clientDb);

    res.status(200).send('Alumno agregado');
    console.log(req.body);
});

//Actualiza un alumno, es el "editar".
///app/tablaAlumnos/:lu --> api/v0/alumnos/:lu PUT

app.put('/app/tablaAlumnos/:lu', requireAuthAPI, async (req, res) => {
    const lu = req.params.lu;
    const columnas = Object.keys(req.body);
    const valores = Object.values(req.body) as string[];
    await aida.actualizarAlumno(lu!, columnas, valores, clientDb);
    console.log(valores);
    res.status(200).send('Alumno actualizado');
});


// /app/tablaAlumnos/:lu --> /api/v0/alumnos/:lu DELETE
// debería devolver JSON

app.delete('/app/tablaAlumnos/:lu', requireAuthAPI, async (req, res) => {
    const lu = req.params.lu;
    await clientDb.query(`DELETE FROM aida.alumnos WHERE lu = $1`, [lu]);
    res.status(200).send('Alumno eliminado');
});

/api/v0/alumnos --> /api/v0/alumnos/batch POST // debería devolver JSON

// Actualizar la tabla de alumnos a partir de un CSV
app.patch('/api/v0/alumnos', requireAuthAPI, async (req, res) => {
    console.log(req.params, req.query, req.body);

    var {dataLines: listaDeAlumnosCompleta, columns: columnas} = await csv.parsearCSV(req.body.csvText);
    await aida.refrescarTablaAlumnos(clientDb, listaDeAlumnosCompleta, columnas);

    res.status(200).send('Tabla de alumnos actualizada');

})


/app/tablaCursadas --> /api/v0/cursadas GET

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

/app/tablaCursadas --> api/v0/cursadas POST
//debería devolver JSON

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
// Está raro: si la PK es compuesta, pq implementamos el "edita" así?
// Sólo se puede cambiar la nota, pero eso lo define el Frontend!?!?

// /app/tablaCursadas/:lu --> api/v0/cursadas/:lu/:materia_id/:anio/:cuatrimestre PUT


app.put('/app/tablaCursadas/:lu', requireAuthAPI, async (req, res) => {
  const lu = req.params.lu;
  const columnas = Object.keys(req.body);
  const valores = Object.values(req.body) as string[];
  console.log(valores);
  await aida.actualizarCursada(lu!, columnas, valores, clientDb);
  res.status(200).send('Cursada actualizada');
});

/app/tablaCursadas/:lu/:materia_id/:anio/:cuatrimestre --> /api/v0/cursadas/:lu/:materia_id/:anio/:cuatrimestre DELETE

app.delete('/app/tablaCursadas/:lu/:materia_id/:anio/:cuatrimestre', requireAuthAPI, async (req, res) => {
  const { lu, materia_id, anio, cuatrimestre } = req.params;
  await clientDb.query(`DELETE FROM aida.cursadas WHERE alumno_lu = $1 AND materia_id = $2 AND anio = $3 AND cuatrimestre = $4`, [lu, materia_id, anio, cuatrimestre]);
  res.status(200).send('Cursada eliminado');
});

// Actualiza la tabla de cursadas a partir de un CSV
/api/v0/cursadas --> /api/v0/cursadas/batch POST // debería devolver JSON

app.patch('/api/v0/cursadas', requireAuthAPI, async (req, res) => {
  console.log(req.params, req.query, req.body);

  var {dataLines: listaDeCursadasCompleta, columns: columnas} = await csv.parsearCSV(req.body.csvText);
  await aida.refrescarTablaCursadas(clientDb, listaDeCursadasCompleta, columnas);

  res.status(200).send('Tabla de cursadas actualizada');
});

// Agrega carrera con su plan de estudios a la base de datos a partir de un CSV
// /api/v0/plan_estudios PATCH --> /api/v0/carreras POST
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


