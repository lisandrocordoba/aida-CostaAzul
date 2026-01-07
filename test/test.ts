import * as assert from "assert";


/*
import { deCualquierTexto, deTexto, aTexto, aISO, deISO, esFecha, mismaFecha, Fecha } from '../src/fechas.js'

var textoISO = '2025-09-13'
var textoFecha = '13/09/2025'
var textoFechaMasHumano = '13/9/2025'

describe("fechas", function(){
    it("interpreta y muestra una fecha en texto", function(){
        var fecha = deTexto(textoFecha)
        assert.equal(aTexto(fecha), textoFecha);
    })
    it("interpreta y muestra una fecha en ISO", function(){
        var fecha = deISO(textoISO)
        assert.equal(aISO(fecha), textoISO);
    })
    it("en texto común o en ISO son la misma fecha", function(){
        var fecha = deISO(textoISO)
        var misma = deTexto(textoFecha)
        assert.ok(mismaFecha(fecha, misma), "misma fecha");
    })
    it("no exige ceros a la izquierda", function(){
        var fecha = deTexto(textoFechaMasHumano)
        assert.equal(aTexto(fecha), textoFecha);
    })
    it("auto detecta texto", function(){
        var fecha = deCualquierTexto(textoFecha)
        assert.equal(aTexto(fecha), textoFecha);
    })
    it("auto detecta ISO", function(){
        var fecha = deCualquierTexto(textoISO)
        assert.equal(aTexto(fecha), textoFecha);
    })
})

describe("tipos fechas", function(){
    var date = new Date(textoISO);
    it("no reconoce un Date como tipo fecha", function(){
        // @ts-expect-error no se puede asignar un date común en fecha
        var fecha:Fecha = date;
        assert.throws(function(){
            assert.equal(aTexto(fecha), textoFecha)
        })
    })
    it("discrimina un entero no es fecha", function(){
        var entero = 7;
        assert.equal(esFecha(entero), false)
    })
    it("discrimina un boolean no es fecha", function(){
        var logico = false;
        assert.equal(esFecha(logico), false)
    })
    it("discrimina un nulo no es fecha", function(){
        var nulo = null;
        assert.equal(esFecha(nulo), false)
    })
    it("discrimina un string no es fecha", function(){
        var texto = 'texto';
        assert.equal(esFecha(texto), false)
    })
    it("discrimina una fecha sí es fecha", function(){
        var fecha = deTexto(textoFecha);
        assert.equal(esFecha(fecha), true)
    })
})
*/
import request from 'supertest';
import app from '../src/servidor.js'; // Tu instancia de express


describe('Auth Endpoints', function() { // function() en lugar de () => para mantener tu estilo

    it('POST /api/v0/auth/login - debería loguear con x-www-form-urlencoded', async function() {

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
        assert.strictEqual(res.status, 200, "El status code debería ser 200");

        // 2. Validar el cuerpo exacto de la respuesta
        assert.deepStrictEqual(res.body, {
            message: "Autenticación exitosa"
        }, "El cuerpo de la respuesta no coincide");
        });
});