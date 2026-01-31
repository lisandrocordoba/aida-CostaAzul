if (!process.env.NODE_ENV) {
  throw new Error('NODE_ENV is not set');
}

export const config = {
  env: process.env.NODE_ENV,
  port: Number(process.env.PORT) || 3000,
  db: {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    password: process.env.PGPASSWORD,
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE,
    url: process.env.DATABASE_URL
  }
};