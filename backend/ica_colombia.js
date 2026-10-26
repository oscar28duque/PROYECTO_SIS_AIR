/**
 * ============================================================================
 * MOTOR OFICIAL DE CÁLCULO DEL ÍNDICE DE CALIDAD DEL AIRE (ICA) - COLOMBIA
 * Conforme a la Resolución 2254 de 2017 (MinAmbiente y Desarrollo Sostenible)
 * ============================================================================
 * Ecuación de interpolación lineal por tramos de concentración:
 * 
 *        I_hi - I_lo
 * ICA = ------------- * (C_p - BP_lo) + I_lo
 *       BP_hi - BP_lo
 * 
 * Donde:
 * - C_p: Concentración medida del contaminante
 * - BP_hi: Punto de corte superior que contiene a C_p
 * - BP_lo: Punto de corte inferior que contiene a C_p
 * - I_hi: Valor del índice correspondiente a BP_hi
 * - I_lo: Valor del índice correspondiente a BP_lo
 */

const BREAKPOINTS_RES_2254 = {
    // Material Particulado PM2.5 (µg/m³ - Tiempo de exposición 24h)
    pm25: [
        { bp_lo: 0.0,   bp_hi: 12.0,  i_lo: 0,   i_hi: 50,  categoria: "Buena",                             color: "#00E400", clase: "aqi-good" },
        { bp_lo: 12.1,  bp_hi: 37.4,  i_lo: 51,  i_hi: 100, categoria: "Aceptable",                          color: "#FFFF00", clase: "aqi-moderate" },
        { bp_lo: 37.5,  bp_hi: 55.4,  i_lo: 101, i_hi: 150, categoria: "Dañina a la salud de grupos sensibles", color: "#FF7E00", clase: "aqi-sensitive" },
        { bp_lo: 55.5,  bp_hi: 150.4, i_lo: 151, i_hi: 200, categoria: "Dañina a la salud",                  color: "#FF0000", clase: "aqi-bad" },
        { bp_lo: 150.5, bp_hi: 250.4, i_lo: 201, i_hi: 300, categoria: "Muy dañina a la salud",              color: "#8F3F97", clase: "aqi-very-bad" },
        { bp_lo: 250.5, bp_hi: 500.4, i_lo: 301, i_hi: 500, categoria: "Peligrosa",                          color: "#7E0023", clase: "aqi-hazardous" }
    ],

    // Material Particulado PM10 (µg/m³ - Tiempo de exposición 24h)
    pm10: [
        { bp_lo: 0,   bp_hi: 54,   i_lo: 0,   i_hi: 50,  categoria: "Buena",                             color: "#00E400", clase: "aqi-good" },
        { bp_lo: 55,  bp_hi: 154,  i_lo: 51,  i_hi: 100, categoria: "Aceptable",                          color: "#FFFF00", clase: "aqi-moderate" },
        { bp_lo: 155, bp_hi: 254,  i_lo: 101, i_hi: 150, categoria: "Dañina a la salud de grupos sensibles", color: "#FF7E00", clase: "aqi-sensitive" },
        { bp_lo: 255, bp_hi: 354,  i_lo: 151, i_hi: 200, categoria: "Dañina a la salud",                  color: "#FF0000", clase: "aqi-bad" },
        { bp_lo: 355, bp_hi: 424,  i_lo: 201, i_hi: 300, categoria: "Muy dañina a la salud",              color: "#8F3F97", clase: "aqi-very-bad" },
        { bp_lo: 425, bp_hi: 604,  i_lo: 301, i_hi: 500, categoria: "Peligrosa",                          color: "#7E0023", clase: "aqi-hazardous" }
    ],

    // Dióxido de Nitrógeno NO2 (µg/m³ - Tiempo de exposición 1h)
    no2: [
        { bp_lo: 0,    bp_hi: 100,  i_lo: 0,   i_hi: 50,  categoria: "Buena",                             color: "#00E400", clase: "aqi-good" },
        { bp_lo: 101,  bp_hi: 189,  i_lo: 51,  i_hi: 100, categoria: "Aceptable",                          color: "#FFFF00", clase: "aqi-moderate" },
        { bp_lo: 190,  bp_hi: 677,  i_lo: 101, i_hi: 150, categoria: "Dañina a la salud de grupos sensibles", color: "#FF7E00", clase: "aqi-sensitive" },
        { bp_lo: 678,  bp_hi: 1221, i_lo: 151, i_hi: 200, categoria: "Dañina a la salud",                  color: "#FF0000", clase: "aqi-bad" },
        { bp_lo: 1222, bp_hi: 2349, i_lo: 201, i_hi: 300, categoria: "Muy dañina a la salud",              color: "#8F3F97", clase: "aqi-very-bad" },
        { bp_lo: 2350, bp_hi: 3849, i_lo: 301, i_hi: 500, categoria: "Peligrosa",                          color: "#7E0023", clase: "aqi-hazardous" }
    ]
};

/**
 * Calcula el ICA para un contaminante individual mediante interpolación lineal.
 * @param {string} contaminante Clave del contaminante ('pm25', 'pm10', 'no2')
 * @param {number} valor Concentración observada
 * @returns {object} Objeto con el valor del índice, categoría, color y límites
 */
function calcularIcaIndividual(contaminante, valor) {
    if (valor === undefined || valor === null || isNaN(valor) || valor < 0) {
        return { ica: 0, categoria: "Sin Datos", color: "#94a3b8", clase: "aqi-unknown", contaminante };
    }

    const tramos = BREAKPOINTS_RES_2254[contaminante];
    if (!tramos) {
        return { ica: 0, categoria: "No parametrizado", color: "#94a3b8", clase: "aqi-unknown", contaminante };
    }

    // Truncar o acotar según el máximo del rango más crítico
    const tramoMax = tramos[tramos.length - 1];
    if (valor >= tramoMax.bp_hi) {
        return {
            ica: 500,
            categoria: tramoMax.categoria,
            color: tramoMax.color,
            clase: tramoMax.clase,
            contaminante,
            valor,
            bp_lo: tramoMax.bp_lo,
            bp_hi: tramoMax.bp_hi
        };
    }

    for (const tramo of tramos) {
        if (valor >= tramo.bp_lo && valor <= tramo.bp_hi) {
            // Ecuación oficial de la Resolución 2254
            const numerador = tramo.i_hi - tramo.i_lo;
            const denominador = tramo.bp_hi - tramo.bp_lo;
            const ica = Math.round(((numerador / denominador) * (valor - tramo.bp_lo)) + tramo.i_lo);

            return {
                ica,
                categoria: tramo.categoria,
                color: tramo.color,
                clase: tramo.clase,
                contaminante,
                valor,
                bp_lo: tramo.bp_lo,
                bp_hi: tramo.bp_hi
            };
        }
    }

    return { ica: 0, categoria: "Fuera de Rango", color: "#94a3b8", clase: "aqi-unknown", contaminante };
}

/**
 * Calcula el ICA Global oficial aplicando el principio del contaminante crítico (máximo ICA).
 * @param {object} telemetria Objeto con { pm25, pm10, no2 }
 * @returns {object} Resultado completo con ICA global, contaminante crítico y desglose
 */
function calcularIcaGlobal(telemetria = {}) {
    const icaPm25 = calcularIcaIndividual('pm25', telemetria.pm25);
    const icaPm10 = calcularIcaIndividual('pm10', telemetria.pm10);
    const icaNo2  = calcularIcaIndividual('no2', telemetria.no2);

    const lista = [icaPm25, icaPm10, icaNo2];
    
    // El contaminante crítico es aquel que genera el mayor valor de ICA
    let critico = lista[0];
    for (const item of lista) {
        if (item.ica > critico.ica) {
            critico = item;
        }
    }

    return {
        icaGlobal: critico.ica,
        categoria: critico.categoria,
        color: critico.color,
        clase: critico.clase,
        contaminanteCritico: critico.contaminante.toUpperCase(),
        norma: "Resolución 2254 de 2017 (MADS)",
        municipio: "Ubaté, Cundinamarca",
        desglose: {
            pm25: icaPm25,
            pm10: icaPm10,
            no2: icaNo2
        }
    };
}

module.exports = {
    BREAKPOINTS_RES_2254,
    calcularIcaIndividual,
    calcularIcaGlobal
};
