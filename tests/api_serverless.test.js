/**
 * ============================================================================
 * SUITE DE PRUEBAS DE INTEGRACIÓN: FUNCIONES SERVERLESS (API)
 * ============================================================================
 */

process.env.NODE_ENV = 'test';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { handler: analizarHandler } = require('../backend/functions/analizar');
const { handler: predecirHandler } = require('../backend/functions/predecir');

describe('Integración de Funciones Serverless (/api)', () => {

    it('Handler /api/analizar debe retornar 200, cabeceras CORS y telemetría completa', async () => {
        const response = await analizarHandler({}, {});
        assert.equal(response.statusCode, 200);
        assert.equal(response.headers['Access-Control-Allow-Origin'], '*');

        const body = JSON.parse(response.body);
        assert.ok(typeof body.pm1 === 'number');
        assert.ok(typeof body.pm25 === 'number');
        assert.ok(typeof body.pm10 === 'number');
        assert.ok(typeof body.no2 === 'number');
        assert.ok(typeof body.voc === 'number');
        assert.ok(typeof body.temperatura === 'number');
        assert.ok(typeof body.humedad === 'number');
        assert.ok(typeof body.presion === 'number');
        assert.ok(typeof body.ica === 'number');
        assert.ok(body.categoriaIca);
        assert.equal(body.nodoSalud.estado, 'Online');
        assert.ok(body.nodoSalud.latenciaMs > 0);
    });

    it('Handler /api/predecir debe retornar 200 y respuesta estructurada de ML vía POST', async () => {
        const event = {
            httpMethod: 'POST',
            body: JSON.stringify({
                pm1: 12.0,
                pm25: 22.0,
                pm10: 36.0,
                no2: 25.0,
                voc: 0.45,
                temperatura: 16.5,
                humedad: 68.0,
                presion: 749.0
            })
        };

        const response = await predecirHandler(event, {});
        assert.equal(response.statusCode, 200);

        const body = JSON.parse(response.body);
        assert.ok(body.metadatosModelo.nombre);
        assert.ok(body.prediccion.t1_hora);
        assert.ok(body.prediccion.t6_horas);
        assert.ok(body.planMitigacion);
        assert.equal(body.diagnosticoAnomalias.esAnomalia, false);
    });

    it('Handler /api/predecir debe responder correctamente a preflight CORS (OPTIONS)', async () => {
        const event = { httpMethod: 'OPTIONS' };
        const response = await predecirHandler(event, {});
        assert.equal(response.statusCode, 200);
        assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    });

    it('Handler /api/analizar debe responder correctamente a preflight CORS (OPTIONS)', async () => {
        const event = { httpMethod: 'OPTIONS' };
        const response = await analizarHandler(event, {});
        assert.equal(response.statusCode, 200);
        assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    });
});
