set role to aida_owner;
drop schema if exists aida cascade;
create schema aida;
grant usage on schema aida to aida_admin;

-- ==========================================
-- 1. TABLAS BASE (Sin FKs o con FKs cíclicas)
-- ==========================================

-- Tabla USUARIOS
-- Cambios: id -> id_usuario, nombre -> nombre_usuario
create table aida.usuarios (
    id_usuario serial primary key,
    username text unique not null,
    password_hash text not null,
    nombre_usuario text,
    apellido text,
    email text unique,
    activo boolean not null default true
);

-- Tabla CARRERAS
-- Cambios: id -> id_carrera
CREATE TABLE aida.carreras (
    id_carrera serial primary key,
    nombre_carrera text unique not null
);

-- Tabla MATERIAS
-- Cambios: id -> id_materia
CREATE TABLE aida.materias (
    id_materia serial primary key,
    nombre_materia text not null
);

-- ==========================================
-- 2. TABLAS PRINCIPALES (Referencian a Base)
-- ==========================================

-- Tabla ALUMNOS
-- Cambios: id_usuario -> id_usuario_ALU, id_carrera -> id_carrera_ALU
create table aida.alumnos (
    lu text primary key,
    id_usuario_ALU integer unique references aida.usuarios(id_usuario) on delete cascade,
    id_carrera_ALU integer references aida.carreras(id_carrera),
    titulo_en_tramite date,
    egreso date
);

-- Tabla PROFESORES
-- Cambios: id_usuario -> id_usuario_PROF
create table aida.profesores (
    legajo serial primary key,
    id_usuario_PROF integer unique references aida.usuarios(id_usuario) on delete cascade
);

-- Tabla SECRETARIO
-- Cambios: id_usuario -> id_usuario_SEC
create table aida.secretario (
    id_secretario serial primary key,
    id_usuario_SEC integer unique references aida.usuarios(id_usuario) on delete cascade
);

-- ==========================================
-- 3. TABLAS DE RELACIÓN (Muchos a Muchos / Detalle)
-- ==========================================

-- Tabla MATERIAS EN CARRERA
-- Cambios: id_carrera -> id_carrera_MEC, id_materia -> id_materia_MEC
create TABLE aida.materiasEnCarrera (
    id_carrera_MEC integer references aida.carreras(id_carrera) on delete cascade,
    id_materia_MEC integer references aida.materias(id_materia) on delete cascade,
    primary key (id_carrera_MEC, id_materia_MEC)
);

-- Tabla CURSADAS
-- Cambios: alumno_lu -> lu_CURS, id_materia -> id_materia_CURS
CREATE TABLE aida.cursadas (
    lu_CURS text references aida.alumnos(lu) on delete cascade,
    id_materia_CURS integer references aida.materias(id_materia) on delete cascade,
    anio integer not null,
    cuatrimestre integer not null,
    nota integer,
    primary key (lu_CURS, id_materia_CURS, anio, cuatrimestre)
);

-- Tabla DICTA
-- Cambios: legajo_profesor -> legajo_DICTA, id_materia -> id_materia_DICTA
create table aida.dicta (
    legajo_DICTA integer references aida.profesores(legajo) on delete cascade,
    id_materia_DICTA integer references aida.materias(id_materia) on delete cascade,
    primary key (legajo_DICTA, id_materia_DICTA)
);


-- ==========================================
-- 4. PERMISOS (GRANTS)
-- ==========================================
-- Nota: Al cambiar los nombres de las columnas ID, Postgres cambia el nombre de las secuencias automáticas.
-- El formato suele ser: tabla_columna_seq

-- Usuarios
grant select, insert, update, delete on aida.usuarios to aida_admin;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE aida.usuarios_id_usuario_seq to aida_admin;

-- Carreras
grant select, insert, update, delete on aida.carreras to aida_admin;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE aida.carreras_id_carrera_seq to aida_admin;

-- Materias
grant select, insert, update, delete on aida.materias to aida_admin;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE aida.materias_id_materia_seq to aida_admin;

-- Alumnos
grant select, insert, update, delete on aida.alumnos to aida_admin;

-- Profesores
grant select, insert, update, delete on aida.profesores to aida_admin;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE aida.profesores_legajo_seq to aida_admin; -- legajo es serial

-- Secretario
grant select, insert, update, delete on aida.secretario to aida_admin;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE aida.secretario_id_secretario_seq to aida_admin;

-- Tablas de relación
grant select, insert, update, delete on aida.materiasEnCarrera to aida_admin;
grant select, insert, update, delete on aida.cursadas to aida_admin;
grant select, insert, update, delete on aida.dicta to aida_admin;