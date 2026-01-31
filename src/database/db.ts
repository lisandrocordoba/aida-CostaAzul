import { Pool } from 'pg';
import { config } from '../config.js';

export let pool: Pool;

if (config.env === 'production' && config.db.url) {
    pool = new Pool({
        connectionString: config.db.url,
        ssl: { rejectUnauthorized: false }
    });
} else {
    pool = new Pool({
        user: config.db.user,
        host: config.db.host,
        database: config.db.database,   // 'aida_test' si es test, 'aida' si es development
        password: config.db.password,
        port: config.db.port,
    });

    console.log(`Conectando a la base de datos en ${config.db.host}:${config.db.port}/${config.db.database}`);
}