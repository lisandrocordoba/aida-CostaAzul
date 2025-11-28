-- ============================
-- DATOS DE PRUEBA EXTENDIDOS
-- ============================

-- Limpiar datos anteriores para evitar duplicados si se corre varias veces (opcional, cuidado en prod)
TRUNCATE aida.cursadas, aida.dicta, aida.materiasEnCarrera, aida.secretario, aida.profesores, aida.alumnos, aida.materias, aida.carreras, aida.usuarios RESTART IDENTITY CASCADE;

-- ============================
-- 1. USUARIOS
-- ============================
-- Password hash para 'contraseña': $2b$10$Wytauy1a1IzcmlaRVxjKnO9/jpPFCmKyTwjneDuvgnBEzM5K3l2TO

INSERT INTO aida.usuarios (username, password_hash, nombre_usuario, apellido, email)
VALUES
-- ID 1: Alumno que terminó
('alumno1', '$2b$10$Wytauy1a1IzcmlaRVxjKnO9/jpPFCmKyTwjneDuvgnBEzM5K3l2TO', 'Ana', 'Pérez', 'ana@example.com'),
-- ID 2: Alumno que le falta 1 materia
('alumno2', '$2b$10$Wytauy1a1IzcmlaRVxjKnO9/jpPFCmKyTwjneDuvgnBEzM5K3l2TO', 'Juan', 'Gómez', 'juan@example.com'),
-- ID 3: Alumno genérico
('alumno3', '$2b$10$Wytauy1a1IzcmlaRVxjKnO9/jpPFCmKyTwjneDuvgnBEzM5K3l2TO', 'María', 'López', 'maria@example.com'),
-- ID 4: Profesor estándar
('profesor1', '$2b$10$Wytauy1a1IzcmlaRVxjKnO9/jpPFCmKyTwjneDuvgnBEzM5K3l2TO', 'Luis', 'Martínez', 'luis@example.com'),
-- ID 5: El Híbrido (Profesor y Alumno a la vez)
('profesor2', '$2b$10$Wytauy1a1IzcmlaRVxjKnO9/jpPFCmKyTwjneDuvgnBEzM5K3l2TO', 'Pedro', 'Sánchez', 'pedro@example.com'),
-- ID 6: Secretario - Antes era ID 5
('secretario1', '$2b$10$Wytauy1a1IzcmlaRVxjKnO9/jpPFCmKyTwjneDuvgnBEzM5K3l2TO', 'Rocío', 'García', 'rocio@example.com');

-- ============================
-- 2. CARRERAS
-- ============================

INSERT INTO aida.carreras (nombre_carrera)
VALUES
('Ingeniería en Sistemas'),      -- id_carrera = 1
('Ciencias de la Computación'),  -- id_carrera = 2
('Licenciatura en Matemática');  -- id_carrera = 3

-- ============================
-- 3. ALUMNOS
-- ============================

INSERT INTO aida.alumnos (lu, id_usuario_ALU, id_carrera_ALU, titulo_en_tramite, egreso)
VALUES
-- Ana (Terminó Sistemas)
('1602/339', 1, 1, '2024-03-10', NULL),
-- Juan (Casi termina Computación)
('182/23',   2, 2, NULL, NULL),
-- María (Recién arranca Matemática)
('1600/17',  3, 3, NULL, NULL),
-- Pedro (El profesor que también estudia Sistemas) - Ahora usa ID 5
('999/99',   5, 1, NULL, NULL);

-- ============================
-- 4. MATERIAS
-- ============================

INSERT INTO aida.materias (nombre_materia)
VALUES
('Introducción a la Programación'),    -- id_materia = 1
('Algoritmos y Estructuras de Datos'), -- id_materia = 2
('Análisis Matemático I'),             -- id_materia = 3
('Lógica y Computabilidad');           -- id_materia = 4

-- ============================
-- 5. materiasEnCarrera (Plan de Estudios)
-- ============================

INSERT INTO aida.materiasEnCarrera (id_carrera_MEC, id_materia_MEC)
VALUES
-- Carrera 1: Sistemas (Total 3 materias)
(1, 1), -- Intro
(1, 2), -- Algoritmos
(1, 3), -- Análisis

-- Carrera 2: Computación (Total 3 materias)
(2, 1), -- Intro
(2, 2), -- Algoritmos
(2, 4), -- Lógica (Esta es la que le faltará a Juan)

-- Carrera 3: Matemática
(3, 3),
(3, 4);

-- ============================
-- 6. PROFESORES
-- ============================

INSERT INTO aida.profesores (id_usuario_PROF)
VALUES
(4), -- Luis Martínez (Profesor full time) -> Legajo se genera (1)
(5); -- Pedro Sánchez (El híbrido, ahora ID 5) -> Legajo se genera (2)

-- ============================
-- 7. SECRETARIO
-- ============================

INSERT INTO aida.secretario (id_usuario_SEC)
VALUES (6);  -- Rocío García (Ahora ID 6)

-- ============================
-- 8. DICTA
-- ============================

INSERT INTO aida.dicta (legajo_DICTA, id_materia_DICTA)
VALUES
-- Luis (Legajo 1) da las básicas
(1, 1),
(1, 2),
-- Pedro (Legajo 2) da las avanzadas
(2, 4);  -- Pedro da Lógica

-- ============================
-- 9. CURSADAS (Historial académico)
-- ============================

INSERT INTO aida.cursadas (lu_CURS, id_materia_CURS, anio, cuatrimestre, nota)
VALUES
-- CASO 1: ANA (Terminó la carrera 1)
-- La carrera 1 tiene materias: 1, 2 y 3. Ana las aprobó todas.
('1602/339', 1, 2020, 1, 8),
('1602/339', 2, 2020, 2, 9),
('1602/339', 3, 2021, 1, 7),

-- CASO 2: JUAN (Le falta 1 para terminar carrera 2)
-- La carrera 2 tiene: 1, 2 y 4.
-- Juan aprobó la 1 y la 2. LE FALTA LA 4 (Lógica).
('182/23',   1, 2022, 1, 7),
('182/23',   2, 2022, 2, 6),
-- Nota: No insertamos registro para la materia 4, o podríamos insertar un aplazo (nota 2).
-- ('182/23', 4, 2023, 1, 2), -- Si quisieras simular que la desaprobó.

-- CASO 3: MARÍA (Promedio)
('1600/17',  3, 2024, 1, 10),

-- CASO 4: PEDRO (Alumno Híbrido)
-- Pedro es alumno de carrera 1. Cursó con Luis (que es su colega profesor).
('999/99',   1, 2023, 1, 9);

-- ============================
-- FIN DEL SCRIPT
-- ============================