import express from "express";

// Importamos el router de appRouter.js
import appRouter from '../routes/appRouter.js';
import APIRouter from '../routes/APIRouter.js';


const app = express()
const port = 3000


app.use(express.json({ limit: '10mb' })); // para poder leer el body
app.use(express.urlencoded({ extended: true, limit: '10mb'  })); // para poder leer el body
app.use(express.text({ type: 'text/csv', limit: '10mb' })); // para poder leer el body como texto plano


// Usamos los routers
app.use('/app', appRouter);
app.use('/api/v0', APIRouter);



app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}/app/menu`)
})
