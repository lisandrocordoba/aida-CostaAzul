import { Pool } from 'pg';

// Cliente DB para el modulo
let pool: Pool;
if (process.env.IS_DEVELOPMENT === 'true') {
    pool = new Pool();
} else {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
}
pool.connect();



