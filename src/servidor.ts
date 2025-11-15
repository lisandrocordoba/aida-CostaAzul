import express from "express";
import session/*, { SessionData }*/ from 'express-session';

// Importamos el router de appRouter.js
import appRouter from './routes/appRouter.js';
import APIRouter from './routes/APIRouter.js';


const app = express()
const port = 3000

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

// Usamos los routers
app.use('/app', appRouter);
app.use('/api/v0', APIRouter);

app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}/app/menu`)
})
