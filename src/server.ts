import app from "./app.js";
import generarPlantillasHTML from "./generarPlantillas.js"

const port = process.env.PORT || 3000; // Permitimos elegir el puerto por variable de entorno

// Generamos plantillas
generarPlantillasHTML();

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}/app/menu`);
});