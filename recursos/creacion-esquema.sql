set role to aida_owner;
drop schema if exists aida cascade;
create schema aida;
grant usage on schema aida to aida_admin;

-- version nueva
create table aida.usuarios (                -- ESTA IMPLEMENTADA LA FUNCION "CAMBIAR PASSWORD", HAY Q HACER EN EL FRONTEND UN BOTON PARA CAMBIAR CONTRASEÑA
    id serial primary key,
    username text unique not null,
    password_hash text not null,
    nombre text,
    apellido text,
    email text unique,
    activo boolean not null default true    -- ESTO LO USAMOS? DESPUES VER BIEN QUE HACER CON EL
);


CREATE TABLE aida.carreras (
    id serial primary key,
    nombre_carrera text unique not null
);

--version nueva
create table aida.alumnos (
    lu text primary key,
    id_usuario integer references aida.usuarios(id) on delete cascade, -- si borramos un usuario no queremos que este en alumno.(se pierde nombre y apellido y el id_usuario es incorrecto)
    id_carrera integer references aida.carreras(id),
    titulo_en_tramite date,
    egreso date
);

CREATE TABLE aida.materias (
    id serial primary key,
    nombre_materia text not null
);

create TABLE aida.materiasEnCarrera (
    id_carrera integer references aida.carreras(id) on delete cascade,
    id_materia integer references aida.materias(id) on delete cascade,
    primary key (id_carrera, id_materia)
);

CREATE TABLE aida.cursadas (
    alumno_lu text references aida.alumnos(lu) on delete cascade, -- si borramos un alumno queremos borrar todas sus cursadas
    id_materia integer references aida.materias(id) on delete cascade, -- lo mismo con materia
    anio integer not null,
    cuatrimestre integer not null,
    nota integer,
    primary key (alumno_lu, id_materia, anio, cuatrimestre)
);


-- version nueva
create table aida.profesores (
    legajo serial primary key,
    id_usuario integer references aida.usuarios(id) on delete cascade
);

-- version nueva
create table aida.secretario (
    id_secretario serial primary key,
    id_usuario integer references aida.usuarios(id) on delete cascade
);

-- version nueva
create table aida.dicta (
    legajo integer references aida.profesores(legajo) on delete cascade,
    id_materia integer references aida.materias(id) on delete cascade,
    primary key (legajo, id_materia)
);


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
--grants nuevos:
grant select, insert, update, delete on aida.profesores to aida_admin;
grant select, insert, update, delete on aida.dicta to aida_admin;
grant select, insert, update, delete on aida.secretario to aida_admin;