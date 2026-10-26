/**
 * ============================================================================
 * SUITE DE PRUEBAS UNITARIAS: MOTOR DE INFERENCIA DE MACHINE LEARNING
 * ============================================================================
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { predecirCalidadAire, MODEL_METADATA } = require('../backend/ml_model');

describe('Motor de Inferencia de Machine Learning (SIS AIR)', () => {

    it('Debe exponer metadatos formales con métricas de desempeño requeridas', () => {
        assert.ok(MODEL_METADATA.nombre);
        assert.ok(MODEL_METADATA.metricasDesempeno.mae < 3.5, "MAE debe ser menor a 3.5 µg/m³");
        assert.ok(MODEL_METADATA.metricasDesempeno.rmse < 5.0, "RMSE debe ser menor a 5.0 µg/m³");
        assert.ok(MODEL_METADATA.metricasDesempeno.r2Score >= 0.88, "R² debe ser >= 0.88");
        assert.ok(MODEL_METADATA.metricasDesempeno.f1ScoreMacro >= 0.90, "F1-Score macro debe ser >= 0.90");
        assert.ok(MODEL_METADATA.sesgosIdentificados.length >= 2, "Debe registrar sesgos conocidos");
    });

    it('Debe generar inferencia predictiva coherente a t+1h y t+6h para condiciones normales', () => {
        const muestra = {
            pm1: 10.0,
            pm25: 18.0,
            pm10: 28.0,
            no2: 20.0,
            voc: 0.35,
            temperatura: 16.0,
            humedad: 65.0,
            presion: 750.0
        };

        const res = predecirCalidadAire(muestra);

        assert.ok(res.prediccion.t1_hora.pm25Estimado > 0);
        assert.ok(res.prediccion.t6_horas.pm25Estimado > 0);
        assert.ok(res.prediccion.t1_hora.icaEstimado >= 0);
        assert.ok(res.planMitigacion.confianzaInferenciaPct >= 85.0);
        assert.equal(res.diagnosticoAnomalias.esAnomalia, false);
    });

    it('Debe detectar anomalías físicas cuando PM1 supera a PM2.5 (fallo óptico)', () => {
        const muestraAnomala = {
            pm1: 45.0,  // Mayor que PM2.5 -> Imposible físicamente
            pm25: 15.0,
            pm10: 50.0,
            no2: 20.0,
            voc: 0.30,
            temperatura: 17.0,
            humedad: 60.0,
            presion: 750.0
        };

        const res = predecirCalidadAire(muestraAnomala);
        assert.equal(res.diagnosticoAnomalias.esAnomalia, true);
        assert.ok(res.diagnosticoAnomalias.razones.length > 0);
        assert.ok(res.diagnosticoAnomalias.puntajeAnomalia >= 0.45);
        // La confianza debe degradarse ante anomalías
        assert.ok(res.planMitigacion.confianzaInferenciaPct < 85.0);
    });

    it('Debe emitir advertencias de dominio Out-Of-Distribution (OOD) ante valores extremos', () => {
        const muestraOOD = {
            pm1: 10.0,
            pm25: 18.0,
            pm10: 30.0,
            no2: 20.0,
            voc: 0.35,
            temperatura: 48.0, // Muy por encima del dominio andino (máx 35°C)
            humedad: 5.0,      // Muy por debajo del rango
            presion: 820.0     // Incompatible con Ubaté a 2550 msnm
        };

        const res = predecirCalidadAire(muestraOOD);
        assert.ok(res.diagnosticoAnomalias.advertenciasOOD.length >= 2);
    });

    it('Debe generar recomendaciones de mitigación para grupos sensibles cuando PM2.5 supera límite', () => {
        const muestraCritica = {
            pm1: 30.0,
            pm25: 48.0, // Categoría Dañina a grupos sensibles
            pm10: 75.0,
            no2: 50.0,
            voc: 0.90,
            temperatura: 14.0,
            humedad: 70.0,
            presion: 748.0
        };

        const res = predecirCalidadAire(muestraCritica);
        assert.ok(res.planMitigacion.accionesMitigacion.some(a => a.includes("HEPA")));
        assert.ok(res.planMitigacion.recomendacionesSalud.some(r => r.includes("Población vulnerable")));
    });
});
