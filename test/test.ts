import 'dotenv/config';
import * as assert from "assert";
import request from 'supertest';
import app from '../src/app.js'; // Tu instancia de express


describe('Auth Endpoints', function() {

    it('POST /api/v0/auth/login - debería loguear con credenciales correctas', async function() {

        // Datos del formulario
        const userData = {
            username: 'secretario1',
            password: 'contraseña'
        };

        const res = await request(app)
            .post('/api/v0/auth/login')
            .type('form') // Para simular x-www-form-urlencoded de POSTMAN (No sabemos pq, solo sabemos que funciona)
            .send(userData);

        // 1. Validar Status 200
        assert.strictEqual(res.status, 200, `Se esperaba 200 pero llegó ${res.status}`);
        // 2. Validar el cuerpo exacto de la respuesta
        assert.deepStrictEqual(res.body, {
            message: "Autenticación exitosa"
        }, "El cuerpo de la respuesta no coincide");
        });

    it('POST /api/v0/auth/login - debería fallar con contraseña incorrecta (401)', async function() {
        const badPasswordData = {
            username: 'secretario1',
            password: 'password_incorrecto'
        };

        const res = await request(app)
            .post('/api/v0/auth/login')
            .type('form')
            .send(badPasswordData);

        // 1. Validar Status 200
        assert.strictEqual(res.status, 401, `Se esperaba 401 pero llegó ${res.status}`);
        // 2. Validar el cuerpo exacto de la respuesta
        assert.deepStrictEqual(res.body, {
            error: "Credenciales inválidas"
        }, "El cuerpo de la respuesta no coincide");

    });

    it('POST /api/v0/auth/login - debería fallar si faltan campos (400 o 401)', async function() {
        const res = await request(app)
            .post('/api/v0/auth/login')
            .type('form')
            .send({}); // Enviamos vacío

        // 1. Validar Status 400 (Bad Request) o 401 (Unauthorized)
        const esErrorValido = res.status === 400 || res.status === 401;
        assert.ok(esErrorValido, `Status ${res.status} no es de error esperado (400/401)`);
    });
});