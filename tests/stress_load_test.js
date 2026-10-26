/**
 * ============================================================================
 * BENCHMARK Y PRUEBA DE ESTRÉS / CARGA CONCURRENTE (SIMULACIÓN IoT)
 * ============================================================================
 * Simula 50 nodos IoT enviando ráfagas concurrentes de telemetría a la API
 * de Netlify Function / Supabase para evaluar concurrencia, latencia y robustez.
 */

process.env.NODE_ENV = 'test';

const { handler: analizarHandler } = require('../backend/functions/analizar');
const { handler: predecirHandler } = require('../backend/functions/predecir');

async function ejecutarPruebaCarga({ nodosConcurrentes = 50, peticionesPorNodo = 4 } = {}) {
    console.log("================================================================================");
    console.log(`🚀 INICIANDO PRUEBA DE CARGA CONCURRENTE - SIS AIR UBATÉ`);
    console.log(`- Nodos IoT Concurrentes: ${nodosConcurrentes}`);
    console.log(`- Peticiones por Nodo:    ${peticionesPorNodo}`);
    console.log(`- Total de Peticiones:    ${nodosConcurrentes * peticionesPorNodo}`);
    console.log("================================================================================\n");

    const tiemposRespuesta = [];
    let exitosas = 0;
    let fallidas = 0;

    const tInicioGlobal = Date.now();

    // Función que simula el ciclo de un nodo IoT individual
    async function simularNodo(nodoId) {
        for (let i = 0; i < peticionesPorNodo; i++) {
            const t0 = performance.now();
            try {
                // Alternar entre ingesta de telemetría (/analizar) e inferencia predictiva (/predecir)
                let resp;
                if (i % 2 === 0) {
                    resp = await analizarHandler({}, {});
                } else {
                    resp = await predecirHandler({
                        httpMethod: 'POST',
                        body: JSON.stringify({
                            pm1: 10 + Math.random() * 20,
                            pm25: 15 + Math.random() * 30,
                            pm10: 25 + Math.random() * 40,
                            temperatura: 14 + Math.random() * 6,
                            humedad: 60 + Math.random() * 20
                        })
                    }, {});
                }

                const t1 = performance.now();
                const duracionMs = t1 - t0;
                tiemposRespuesta.push(duracionMs);

                if (resp && resp.statusCode === 200) {
                    exitosas++;
                } else {
                    fallidas++;
                }
            } catch (err) {
                fallidas++;
                console.error(`Error en nodo ${nodoId}:`, err.message);
            }
        }
    }

    // Ejecución concurrente masiva usando Promise.all
    const promesasNodos = [];
    for (let id = 1; id <= nodosConcurrentes; id++) {
        promesasNodos.push(simularNodo(id));
    }

    await Promise.all(promesasNodos);
    const tFinGlobal = Date.now();
    const duracionTotalSegundos = (tFinGlobal - tInicioGlobal) / 1000;

    // Cálculo estadístico
    tiemposRespuesta.sort((a, b) => a - b);
    const totalPeticiones = exitosas + fallidas;
    const media = tiemposRespuesta.reduce((acc, v) => acc + v, 0) / tiemposRespuesta.length;
    const p50 = tiemposRespuesta[Math.floor(tiemposRespuesta.length * 0.50)];
    const p90 = tiemposRespuesta[Math.floor(tiemposRespuesta.length * 0.90)];
    const p95 = tiemposRespuesta[Math.floor(tiemposRespuesta.length * 0.95)];
    const p99 = tiemposRespuesta[Math.floor(tiemposRespuesta.length * 0.99)];
    const min = tiemposRespuesta[0];
    const max = tiemposRespuesta[tiemposRespuesta.length - 1];
    const rps = (totalPeticiones / duracionTotalSegundos).toFixed(2);
    const tasaExitoPct = ((exitosas / totalPeticiones) * 100).toFixed(2);

    console.log("📊 RESULTADOS FORMALES DE RENDIMIENTO BAJO ESTRÉS CONCURRENTE:");
    console.table([
        { Métrica: "Total Peticiones Ejecutadas", Valor: totalPeticiones },
        { Métrica: "Peticiones Exitosas (HTTP 200)", Valor: `${exitosas} (${tasaExitoPct}%)` },
        { Métrica: "Peticiones Fallidas (Errores)", Valor: fallidas },
        { Métrica: "Tiempo Total de Ejecución", Valor: `${duracionTotalSegundos.toFixed(2)} s` },
        { Métrica: "Throughput (RPS)", Valor: `${rps} req/seg` },
        { Métrica: "Latencia Mínima", Valor: `${min.toFixed(2)} ms` },
        { Métrica: "Latencia Promedio", Valor: `${media.toFixed(2)} ms` },
        { Métrica: "Percentil 50 (Mediana)", Valor: `${p50.toFixed(2)} ms` },
        { Métrica: "Percentil 90 (P90)", Valor: `${p90.toFixed(2)} ms` },
        { Métrica: "Percentil 95 (P95)", Valor: `${p95.toFixed(2)} ms` },
        { Métrica: "Percentil 99 (P99)", Valor: `${p99.toFixed(2)} ms` },
        { Métrica: "Latencia Máxima", Valor: `${max.toFixed(2)} ms` }
    ]);

    if (tasaExitoPct >= 99.0 && p95 < 250.0) {
        console.log("✅ CRITERIO DE ACEPTACIÓN RÚBRICA 8VO SEMESTRE: CUMPLIDO SATISFACTORIAMENTE");
    } else {
        console.warn("⚠️ ALERTA: Rendimiento por debajo del umbral óptimo.");
    }

    return {
        totalPeticiones,
        exitosas,
        fallidas,
        tasaExitoPct,
        duracionTotalSegundos,
        rps,
        latencias: { min, media, p50, p90, p95, p99, max }
    };
}

if (require.main === module) {
    ejecutarPruebaCarga().catch(console.error);
}

module.exports = { ejecutarPruebaCarga };
