import 'dotenv/config'; // Carga las variables del .env, se acceden con process.env

const env = process.env.NODE_ENV || 'development';  // NODE_ENV en render es 'production' por defecto

export const config = {
  env: env,
  port: Number(process.env.PORT) || 3000,
  db: {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    password: process.env.PGPASSWORD,
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE,
    url: process.env.DATABASE_URL   // Para producción
  }
};