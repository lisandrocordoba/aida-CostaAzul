create user aida_owner nologin;
create user aida_admin password 'cambiar_esta_clave';

create database aida_db owner aida_owner;
grant connect on database aida_db to aida_admin;

