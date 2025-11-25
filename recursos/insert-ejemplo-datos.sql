-- Asumimos que ya ejecutaste todo el bloque de creación de tablas y grants
-- Ahora insertamos datos de prueba siguiendo EXÁCTAMENTE tu esquema.


------------------------------------------------------------
-- 1) Carrera de prueba
------------------------------------------------------------
INSERT INTO aida.carreras (nombre_carrera)
VALUES ('Licenciatura en Ciencias de Datos')
RETURNING id;

-- guardamos mentalmente: carrera_id = 1


------------------------------------------------------------
-- 2) Usuarios (5 alumnos + 1 profesor + 1 secretario)
------------------------------------------------------------
INSERT INTO aida.usuarios (username, password_hash, nombre, apellido, email)
VALUES
 ('ana',   'password', 'Ana',   'Paredes',  'ana@example.com'),
 ('bruno', 'password', 'Bruno', 'Lozano',   'bruno@example.com'),
 ('carla', 'password', 'Carla', 'Montes',   'carla@example.com'),
 ('diego', 'password', 'Diego', 'Ferreyra', 'diego@example.com'),
 ('elena', 'password', 'Elena', 'Soto',     'elena@example.com'),
 -- profesor
 ('mariano', 'password', 'Mariano', 'Quiroga', 'mariano.prof@example.com'),
 -- secretario
 ('laura',   'password', 'Laura', 'Funes', 'laura.sec@example.com')
RETURNING id;

-- IDs generados serán: alumnos 1-5, profesor 6, secretario 7


------------------------------------------------------------
-- 3) Alumnos (5 alumnos, cada uno referencia su usuario)
------------------------------------------------------------
INSERT INTO aida.alumnos (lu, id_usuario, id_carrera, titulo_en_tramite, egreso)
VALUES
 ('1001', 1, 1, '2025-03-10', '2025-11-20'),
 ('1002', 2, 1, NULL, NULL),
 ('1003', 3, 1, NULL, NULL),
 ('1004', 4, 1, NULL, NULL),
 ('1005', 5, 1, NULL, NULL);


------------------------------------------------------------
-- 4) Profesores (1 profesor)
------------------------------------------------------------
INSERT INTO aida.profesores (id_usuario)
VALUES (6)
RETURNING legajo;

-- guardamos: legajo = 1


------------------------------------------------------------
-- 5) Secretario
------------------------------------------------------------
INSERT INTO aida.secretario (id_usuario)
VALUES (7);


------------------------------------------------------------
-- 6) Materias (5 materias)
------------------------------------------------------------
INSERT INTO aida.materias (nombre_materia)
VALUES
 ('Álgebra I'),
 ('Análisis Matemático I'),
 ('Física I'),
 ('Programación I'),
 ('Estructuras de Datos')
RETURNING id;

-- IDs típicos: 1,2,3,4,5


------------------------------------------------------------
-- 7) Materias en carrera
------------------------------------------------------------
INSERT INTO aida.materiasEnCarrera (id_carrera, id_materia)
VALUES
 (1, 1),
 (1, 2),
 (1, 3),
 (1, 4),
 (1, 5);


------------------------------------------------------------
-- 8) Dicta (un profesor dicta todas las materias)
------------------------------------------------------------
INSERT INTO aida.dicta (legajo, id_materia)
VALUES
 (1, 1),
 (1, 2),
 (1, 3),
 (1, 4),
 (1, 5);


------------------------------------------------------------
-- 9) Cursadas (cada alumno cursa las 5 materias)
------------------------------------------------------------
INSERT INTO aida.cursadas (alumno_lu, id_materia, anio, cuatrimestre, nota)
VALUES
 ('1001', 1, 2024, 1,  8),
 ('1001', 2, 2024, 1,  7),
 ('1001', 3, 2024, 2,  9),
 ('1001', 4, 2024, 2,  8),
 ('1001', 5, 2024, 2,  9),

 ('1002', 1, 2024, 1,  6),
 ('1002', 2, 2024, 1,  7),
 ('1002', 3, 2024, 2,  8),
 ('1002', 4, 2024, 2,  6),
 ('1002', 5, 2024, 2,  7),

 ('1003', 1, 2024, 1,  9),
 ('1003', 2, 2024, 1,  9),
 ('1003', 3, 2024, 2,  8),
 ('1003', 4, 2024, 2, 10),
 ('1003', 5, 2024, 2,  9),

 ('1004', 1, 2024, 1,  5),
 ('1004', 2, 2024, 1,  6),
 ('1004', 3, 2024, 2,  7),
 ('1004', 4, 2024, 2,  6),
 ('1004', 5, 2024, 2,  7),

 ('1005', 1, 2024, 1,  8),
 ('1005', 2, 2024, 1,  8),
 ('1005', 3, 2024, 2,  7),
 ('1005', 4, 2024, 2,  9),
 ('1005', 5, 2024, 2, 10);
