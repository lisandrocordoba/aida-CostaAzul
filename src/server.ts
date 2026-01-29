import app from "./app.js";
import { config } from "./config.js";
import generarPlantillasHTML from "./generarPlantillas.js"

const port = config.port;

// Generamos plantillas
generarPlantillasHTML();

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}/app/menu`);
    console.log(`Entorno: ${config.env}`);
});