## Lo mismo que el .bat, pero para LINUX

export PGUSER=aida_admin
export PGPASSWORD="cambiar_esta_clave"
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=aida_db

echo "Variables de entorno de PostgreSQL configuradas:"
echo "Usuario: $PGUSER"
echo "Host: $PGHOST"
echo "Puerto: $PGPORT"
echo "Base de datos: $PGDATABASE"

# Ejecutar la aplicación con las variables configuradas
echo "Ejecutando la aplicación..."
node ./src/cli.ts