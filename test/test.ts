import 'dotenv/config';
import * as assert from "assert";
import request from 'supertest';
import app from '../src/app.js'; // Tu instancia de express


describe('Auth Endpoints', function() {
    this.timeout(10000);

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

//Pensar: qué queremos testar? el contenido? la forma de la respuesta? que un secretario pueda acceder a los alumnos?

describe('CRUD Endpoints', function () {
  this.timeout(10000);

  describe('Alumnos Endpoints', function () {

    let agent: ReturnType<typeof request.agent>;
    const testLU = '9999/999';

    before(async function () {
      agent = request.agent(app);

      // Login
      const loginRes = await agent
        .post('/api/v0/auth/login')
        .type('form')
        .send({
          username: 'secretario1',
          password: 'contraseña'
        });

      assert.strictEqual(loginRes.status, 200);

      // Select role
      const rolRes = await agent
        .post('/api/v0/roles/select')
        .type('form')
        .send({ rol: 'secretario' });

      assert.strictEqual(rolRes.status, 200);
    });

    /* =========================
       GET /alumnos
    ========================= */

    it('GET /api/v0/alumnos - debería listar alumnos', async function () {
      const res = await agent.get('/api/v0/alumnos');

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body), 'El body no es un array');
      assert.ok(res.body.length >= 1, 'La lista de alumnos está vacía');
    });

    /* =========================
       POST /alumnos
    ========================= */

    //PROBLEMA: Si el test corre una segunda vez, falla porque el alumno ya existe
    it('POST /api/v0/alumnos - debería crear un alumno', async function () {
      const res = await agent
        .post('/api/v0/alumnos')
        .send({
          lu: testLU,
          id_usuario_ALU: 7,
          id_carrera_ALU: 1,
          titulo_en_tramite: null,
          egreso: null
        });

      assert.strictEqual(res.status, 201);
      assert.deepStrictEqual(res.body, {
          egreso: null,
          id_carrera_alu: 1,
          id_usuario_alu: 7,
          lu: '9999/999',
          titulo_en_tramite: null
       });
    });

    /* =========================
       GET /alumnos/:lu
    ========================= */

    it('GET /api/v0/alumnos/:lu - debería obtener un alumno por LU', async function () {
      const res = await agent.get(
        `/api/v0/alumnos/${encodeURIComponent(testLU)}`
      );

      assert.strictEqual(res.status, 200);

      assert.strictEqual(res.body.lu, testLU);
      assert.strictEqual(typeof res.body.id_usuario_alu, 'number');
      assert.strictEqual(typeof res.body.id_carrera_alu, 'number');
    });

    /* =========================
       DELETE /alumnos/:lu
    ========================= */

    it('DELETE /api/v0/alumnos/:lu - debería eliminar un alumno', async function () {
      const res = await agent.delete(`/api/v0/alumnos/${encodeURIComponent(testLU)}`);

      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(res.body, {
        message: 'alumno eliminado correctamente'
      });
    });

    /* =========================
       GET after DELETE
    ========================= */

    it('GET /api/v0/alumnos/:lu - debería devolver 404 si no existe', async function () {
      const res = await agent.get(`/api/v0/alumnos/${testLU}`);

      assert.strictEqual(res.status, 404);
    });

  });
});
