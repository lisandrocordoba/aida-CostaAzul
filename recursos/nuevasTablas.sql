CREATE TABLE aida.carreras (
    id serial primary key,
    nombre text unique not null
);

CREATE TABLE aida.materias (
    id serial primary key,
    nombre text not null
);

CREATE TABLE aida.materiasEnCarrera (
    carrera_id integer references aida.carreras(id) on delete cascade,
    materia_id integer references aida.materias(id) on delete cascade,
    primary key (carrera_id, materia_id)
);

CREATE TABLE aida.alumnosEnCarrera (
    alumno_lu text references aida.alumnos(lu) on delete cascade,
    carrera_id integer references aida.carreras(id) on delete cascade,
    fecha_inscripcion date not null,
    recibido boolean not null default false,
    primary key (alumno_lu, carrera_id)
);

CREATE TABLE aida.cursadas (
    alumno_lu text references aida.alumnos(lu) on delete cascade,
    materia_id integer references aida.materias(id) on delete cascade,
    anio integer not null,
    cuatrimestre integer not null,
    nota integer,
    primary key (alumno_lu, materia_id)
);

grant select, insert, update, delete on aida.carreras to aida_admin;
grant select, insert, update, delete on aida.materias to aida_admin;
grant select, insert, update, delete on aida.materiasEnCarrera to aida_admin;
grant select, insert, update, delete on aida.alumnosEnCarrera to aida_admin;
grant select, insert, update, delete on aida.cursadas to aida_admin;