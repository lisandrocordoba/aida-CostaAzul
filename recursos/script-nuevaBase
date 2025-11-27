-- ============================
-- DATOS DE PRUEBA
-- ============================

-- ============================
-- 1. USUARIOS
-- ============================
-- Cambio: nombre -> nombre_usuario
-- La password para todos es 'estudiante'

INSERT INTO aida.usuarios (username, password_hash, nombre_usuario, apellido, email)
VALUES
('alumno1', '$2b$10$Wo555zNlDRm0oLlqNddi5OkaY33I7S6h83MVtIn7TpgRetwZFamTa', 'Ana', 'Pérez', 'ana@example.com'),
('alumno2', '$2b$10$Wo555zNlDRm0oLlqNddi5OkaY33I7S6h83MVtIn7TpgRetwZFamTa', 'Juan', 'Gómez', 'juan@example.com'),
('alumno3', '$2b$10$Wo555zNlDRm0oLlqNddi5OkaY33I7S6h83MVtIn7TpgRetwZFamTa', 'María', 'López', 'maria@example.com'),
('profesor1', '$2b$10$Wo555zNlDRm0oLlqNddi5OkaY33I7S6h83MVtIn7TpgRetwZFamTa', 'Luis', 'Martínez', 'luis@example.com'),
('secretario1', '$2b$10$Wo555zNlDRm0oLlqNddi5OkaY33I7S6h83MVtIn7TpgRetwZFamTa', 'Rocío', 'García', 'rocio@example.com');

-- ============================
-- 2. CARRERAS
-- ============================
-- Sin cambios en columnas de inserción

INSERT INTO aida.carreras (nombre_carrera)
VALUES
('Ingeniería en Sistemas'),      -- id_carrera = 1
('Ciencias de la Computación'),  -- id_carrera = 2
('Matemática');                  -- id_carrera = 3

-- ============================
-- 3. ALUMNOS
-- ============================
-- Cambio: id_usuario -> id_usuario_ALU, id_carrera -> id_carrera_ALU

INSERT INTO aida.alumnos (lu, id_usuario_ALU, id_carrera_ALU, titulo_en_tramite, egreso)
VALUES
('1602/339', 1, 2, '2024-03-10', NULL),  -- Ana Pérez
('182/23',   2, 1, NULL, NULL),          -- Juan Gómez
('1600/17',  3, 3, NULL, NULL);          -- María López

-- ============================
-- 4. MATERIAS
-- ============================
-- Sin cambios en columnas de inserción

INSERT INTO aida.materias (nombre_materia)
VALUES
('Introducción a la Programación'),    -- id_materia = 1
('Algoritmos y Estructuras de Datos'), -- id_materia = 2
('Análisis Matemático I'),             -- id_materia = 3
('Lógica y Computabilidad');           -- id_materia = 4

-- ============================
-- 5. materiasEnCarrera
-- ============================
-- Cambio: id_carrera -> id_carrera_MEC, id_materia -> id_materia_MEC

INSERT INTO aida.materiasEnCarrera (id_carrera_MEC, id_materia_MEC)
VALUES
-- Ingeniería en Sistemas (1)
(1, 1),
(1, 2),
(1, 3),
-- Ciencias de la Computación (2)
(2, 1),
(2, 2),
(2, 4),
-- Matemática (3)
(3, 3),
(3, 4);

-- ============================
-- 6. PROFESORES
-- ============================
-- Cambio: id_usuario -> id_usuario_PROF

INSERT INTO aida.profesores (id_usuario_PROF)
VALUES (4);  -- Luis Martínez, usuario id 4 (legajo se autogenera = 1)

-- ============================
-- 7. SECRETARIO
-- ============================
-- Cambio: id_usuario -> id_usuario_SEC

INSERT INTO aida.secretario (id_usuario_SEC)
VALUES (5);  -- Rocío García

-- ============================
-- 8. DICTA
-- ============================
-- Cambio: legajo_profesor -> legajo_DICTA, id_materia -> id_materia_DICTA

-- Suponiendo que legajo de Luis = 1 (autoincrement)
INSERT INTO aida.dicta (legajo_DICTA, id_materia_DICTA)
VALUES
(1, 1),  -- Introducción a la Programación
(1, 2);  -- Algoritmos y Estructuras de Datos

-- ============================
-- 9. CURSADAS
-- ============================
-- Cambio: alumno_lu -> lu_CURS, id_materia -> id_materia_CURS

INSERT INTO aida.cursadas (lu_CURS, id_materia_CURS, anio, cuatrimestre, nota)
VALUES
('1602/339', 1, 2024, 1, 8), -- Ana Pérez: Introducción a la Programación
('1602/339', 4, 2024, 2, 9), -- Ana Pérez: Lógica y Computabilidad
('182/23',   1, 2024, 1, 7), -- Juan Gómez: Introducción a la Programación
('1600/17',  3, 2024, 1, 10); -- María López: Análisis Matemático I

-- ============================
-- FIN DEL SCRIPT
-- ============================