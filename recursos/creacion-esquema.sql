set role to aida_owner;
drop schema if exists aida cascade;
create schema aida;
grant usage on schema aida to aida_admin;

CREATE TABLE aida.carreras (
    id serial primary key,
    nombre text unique not null
);

CREATE TABLE aida.materias (
    id serial primary key,
    nombre text not null
);

create TABLE aida.materiasEnCarrera (
    carrera_id integer references aida.carreras(id) on delete cascade,
    materia_id integer references aida.materias(id) on delete cascade,
    primary key (carrera_id, materia_id)
);

create table aida.alumnos (
    lu text primary key,
    apellido text not null,
    nombres text not null,
    id_carrera integer references aida.carreras(id),
    titulo_en_tramite date,
    egreso date
);
CREATE TABLE aida.cursadas (
    alumno_lu text references aida.alumnos(lu) on delete cascade,
    materia_id integer references aida.materias(id) on delete cascade,
    anio integer not null,
    cuatrimestre integer not null,
    nota integer,
    primary key (alumno_lu, materia_id, anio, cuatrimestre)
);

create table aida.usuarios (
    id serial primary key,
    username text unique not null,
    password_hash text not null,
    nombre text,
    email text unique,
    activo boolean not null default true
);

/*
CREATE TABLE aida.alumnoEstaEnCarrera (
    alumno_lu text references aida.alumnos(lu) on delete cascade,
    carrera_id integer references aida.carreras(id) on delete cascade,
    fecha_inscripcion date not null,
    recibido boolean not null default false,
    primary key (alumno_lu, carrera_id)
);
*/

grant select, insert, update, delete on aida.alumnos to aida_admin;
grant select, insert, update, delete on aida.usuarios to aida_admin;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE aida.usuarios_id_seq to aida_admin;
grant select, insert, update, delete on aida.carreras to aida_admin;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE aida.carreras_id_seq to aida_admin;
grant select, insert, update, delete on aida.materias to aida_admin;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE aida.materias_id_seq to aida_admin;
grant select, insert, update, delete on aida.materiasEnCarrera to aida_admin;
/*GRANT USAGE, SELECT, UPDATE ON SEQUENCE aida.materiasEnCarrera_id_seq to aida_admin;*/
grant select, insert, update, delete on aida.cursadas to aida_admin;
/*GRANT USAGE, SELECT, UPDATE ON SEQUENCE aida.cursadas_id_seq to aida_admin;*/
/* grant select, insert, update, delete on aida.alumnosEnCarrera to aida_admin; */

