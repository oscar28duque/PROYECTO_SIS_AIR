/**
 * ============================================================================
 * SUITE DE PRUEBAS UNITARIAS: CÁLCULO OFICIAL DE ICA (RESOLUCIÓN 2254 DE 2017)
 * ============================================================================
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calcularIcaIndividual, calcularIcaGlobal, BREAKPOINTS_RES_2254 } = require('../backend/ica_colombia');

describe('Cálculo Oficial de ICA (Resolución 2254 de 2017)', () => {

    it('Debe tener definidos los tramos normativos para PM2.5, PM10 y NO2', () => {
        assert.ok(BREAKPOINTS_RES_2254.pm25.length >= 6);
        assert.ok(BREAKPOINTS_RES_2254.pm10.length >= 6);
        assert.ok(BREAKPOINTS_RES_2254.no2.length >= 6);
    });

    it('Debe clasificar PM2.5 = 10.0 µg/m³ como "Buena" con ICA <= 50', () => {
        const resultado = calcularIcaIndividual('pm25', 10.0);
        assert.equal(resultado.categoria, 'Buena');
        assert.ok(resultado.ica <= 50 && resultado.ica >= 0);
        assert.equal(resultado.color, '#00E400');
    });

    it('Debe calcular correctamente el punto medio en tramo Moderado/Aceptable (PM2.5 = 25.0 µg/m³)', () => {
        const resultado = calcularIcaIndividual('pm25', 25.0);
        assert.equal(resultado.categoria, 'Aceptable');
        // Rango 12.1 - 37.4 -> ICA 51 - 100
        assert.ok(resultado.ica >= 51 && resultado.ica <= 100);
    });

    it('Debe clasificar PM2.5 = 45.0 µg/m³ como Dañina a grupos sensibles (ICA 101-150)', () => {
        const resultado = calcularIcaIndividual('pm25', 45.0);
        assert.equal(resultado.categoria, 'Dañina a la salud de grupos sensibles');
        assert.ok(resultado.ica >= 101 && resultado.ica <= 150);
    });

    it('Debe clasificar PM10 = 120.0 µg/m³ en categoría Aceptable', () => {
        const resultado = calcularIcaIndividual('pm10', 120.0);
        assert.equal(resultado.categoria, 'Aceptable');
        assert.ok(resultado.ica >= 51 && resultado.ica <= 100);
    });

    it('Debe retornar ICA = 500 para valores extremos por encima del límite superior', () => {
        const resultado = calcularIcaIndividual('pm25', 600.0);
        assert.equal(resultado.ica, 500);
        assert.equal(resultado.categoria, 'Peligrosa');
    });

    it('Debe manejar valores nulos, negativos o indefinidos con elegancia', () => {
        const resultadoNegativo = calcularIcaIndividual('pm25', -5.0);
        assert.equal(resultadoNegativo.categoria, 'Sin Datos');
        assert.equal(resultadoNegativo.ica, 0);

        const resultadoNulo = calcularIcaIndividual('pm25', null);
        assert.equal(resultadoNulo.categoria, 'Sin Datos');
    });

    it('Debe identificar el contaminante crítico en calcularIcaGlobal()', () => {
        const telemetria = {
            pm25: 58.0, // Tramo Dañina (ICA 151-200)
            pm10: 40.0, // Tramo Buena (ICA 0-50)
            no2: 30.0   // Tramo Buena (ICA 0-50)
        };
        const global = calcularIcaGlobal(telemetria);
        assert.equal(global.contaminanteCritico, 'PM25');
        assert.equal(global.categoria, 'Dañina a la salud');
        assert.ok(global.icaGlobal >= 151);
        assert.equal(global.norma, 'Resolución 2254 de 2017 (MADS)');
    });
});
