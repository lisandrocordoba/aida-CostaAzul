set role to aida_owner;
drop schema if exists aida cascade;
create schema aida;
grant usage on schema aida to aida_admin;

create table aida.alumnos (
    lu text primary key,
    apellido text not null,
    nombres text not null,
    titulo text,
    titulo_en_tramite date,
    egreso date
);
create table aida.usuarios (
    id serial primary key,
    username text unique not null,
    password_hash text not null,
    nombre text,
    email text unique,
    activo boolean not null default true
);

grant select, insert, update, delete on aida.alumnos to aida_admin;
grant select, insert, update, delete on aida.usuarios to aida_admin;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE aida.usuarios_id_seq to aida_admin;


