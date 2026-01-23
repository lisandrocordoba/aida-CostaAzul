import express from "express";
import session from 'express-session';
import { Request, Response } from "express";

import appRouter from './routes/appRouter.js';
import APIRouter from "./routes/APIRouter.js";

const app = express()

app.use(express.json({ limit: '10mb' })); // para poder leer el body
app.use(express.urlencoded({ extended: true, limit: '10mb'  })); // para poder leer el body
app.use(express.text({ type: 'text/csv', limit: '10mb' })); // para poder leer el body como texto plano

//Agregamos el middleware de session
app.use(session({
    secret: process.env.SESSION_SECRET || 'cambiar_este_secreto_en_produccion',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 día
    }
  }));

// --- Rutas ---

// Redirigir la raíz
app.get('/', (_: Request, res: Response) => {
  res.redirect('/app/menu');
});

app.use('/api/v0', APIRouter);
app.use('/app', appRouter);

export default app;