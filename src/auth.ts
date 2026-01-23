import bcrypt from 'bcrypt';
import { Client } from 'pg';

const SALT_ROUNDS = 10;

//UNIFICAR ESTA INTERFACE CON LA DE LA BASE DE DATOS
export interface Usuario {
    id: number;
    username: string;
    nombre: string | null;
    apellido: string | null;
    email: string | null;
    activo: boolean;
}

/**
 * Hashea una contraseña usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica una contraseña contra su hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

/**
 * Autentica un usuario con username y password
 * Retorna el usuario si las credenciales son correctas, null en caso contrario
 */
export async function autenticarUsuario(
    client: Client,
    username: string,
    password: string
): Promise<Usuario | null> {
    const result = await client.query(
        'SELECT id_usuario, username, password_hash, nombre_usuario, apellido, email, activo FROM aida.usuarios WHERE username = $1',
        [username]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const user = result.rows[0];

    if (!user.activo) {
        return null;
    }

    const passwordValida = await verifyPassword(password, user.password_hash);

    if (!passwordValida) {
        return null;
    }

    /* Actualizar último acceso
    await client.query(
        'UPDATE aida.usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
    );*/

    return {
        id: user.id_usuario,
        username: user.username,
        nombre: user.nombre_usuario,
        apellido: user.apellido,
        email: user.email,
        activo: user.activo
    };
}

/**
 * Crea un nuevo usuario
 */
export async function crearUsuario(
    client: Client,
    username: string,
    password: string,
    nombre?: string,
    apellido?: string,
    email?: string
): Promise<Usuario | null> {
    try {
        const passwordHash = await hashPassword(password);

        //Revisar si esto va con el esquema de nuestra base
        const result = await client.query(
            `INSERT INTO aida.usuarios (username, password_hash, nombre_usuario, apellido, email)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id_usuario, username, nombre_usuario, apellido, email, activo`,
            [username, passwordHash, nombre || null, apellido || null, email || null]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Error al crear usuario:', error);
        // tiramos excepción para que la levante el controller
        throw new Error('Fallo en la operación de base de datos para crear el usuario.');
    }
}

/**
 * Cambia la contraseña de un usuario
 */
export async function cambiarPassword(
    client: Client,
    userId: number,
    newPassword: string
): Promise<boolean> {
    try {
        const passwordHash = await hashPassword(newPassword);

        await client.query(
            'UPDATE aida.usuarios SET password_hash = $1 WHERE id_usuario = $2',
            [passwordHash, userId]
        );

        return true;
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        return false;
    }
}
