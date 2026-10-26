/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN: SERVIDOR LOCAL DE DESARROLLO (server.js)
 * ============================================================================
 */

process.env.NODE_ENV = 'test';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const server = require('../server');

const TEST_PORT = 8999;
let baseUrl;

describe('Servidor de Desarrollo Local (server.js)', () => {

    before((_, done) => {
        server.listen(TEST_PORT, () => {
            baseUrl = `http://localhost:${TEST_PORT}`;
            done();
        });
    });

    after((_, done) => {
        server.close(done);
    });

    it('Debe servir index.html en la raíz (/) con Content-Type text/html', async () => {
        const res = await fetch(`${baseUrl}/`);
        assert.equal(res.status, 200);
        assert.ok(res.headers.get('content-type').includes('text/html'));
        const html = await res.text();
        assert.ok(html.includes('SIS AIR'));
    });

    it('Debe despachar la función serverless en /api/analizar', async () => {
        const res = await fetch(`${baseUrl}/api/analizar`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.ok(typeof data.pm25 === 'number');
        assert.ok(typeof data.ica === 'number');
    });

    it('Debe despachar la inferencia de ML en /api/predecir vía POST', async () => {
        const res = await fetch(`${baseUrl}/api/predecir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pm1: 12, pm25: 22, pm10: 38 })
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.ok(data.prediccion);
        assert.ok(data.metadatosModelo);
    });

    it('Debe responder 404 ante rutas inexistentes', async () => {
        const res = await fetch(`${baseUrl}/archivo_no_existente.xyz`);
        assert.equal(res.status, 404);
    });
});
