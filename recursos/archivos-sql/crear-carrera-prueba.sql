-- Crear una carrera de prueba
INSERT INTO aida.carreras (nombre)
VALUES ('Carrera de Prueba');

-- Crear una materia de prueba
INSERT INTO aida.materias (nombre)
VALUES ('Materia Única');

-- Vincular la materia a la carrera
INSERT INTO aida.materiasEnCarrera (carrera_id, materia_id)
VALUES (
    (SELECT id FROM aida.carreras WHERE nombre = 'Carrera de Prueba'),
    (SELECT id FROM aida.materias WHERE nombre = 'Materia Única')
);
