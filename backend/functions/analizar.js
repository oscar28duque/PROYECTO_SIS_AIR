/**
 * Generador y receptor de telemetría ambiental para SIS AIR Ubaté.
 * Calcula el ICA oficial (Resolución 2254 de 2017) y persiste en Supabase.
 */
const { createClient } = require('@supabase/supabase-js');
const { calcularIcaGlobal } = require('../ica_colombia');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://czbktgouidobpqtlvypz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_fP7QcD8MYEzPG2OgAGMSYw_SnNe8xUY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

exports.handler = async function(event, context) {
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers: CORS_HEADERS, body: "" };
    }

    // Material Particulado con correlación física: PM1 <= PM2.5 <= PM10
    const pm25Base = Math.random() < 0.9 
        ? 5.0 + Math.random() * 40.0 
        : 45.0 + Math.random() * 15.0;
    
    const pm10Base = Math.random() < 0.8 
        ? pm25Base * 1.5 
        : pm25Base + 30.0;
    
    const pm1Base = pm25Base * 0.6;

    // Gases y Variables Químicas
    const vocBase = Math.random() < 0.95 
        ? 0.2 + Math.random() * 0.4 
        : 1.5 + Math.random() * 0.5;

    const no2Base = Math.random() < 0.9 
        ? 10.0 + Math.random() * 30.0 
        : 90.0 + Math.random() * 20.0;

    // Meteorología Andina (Ubaté, 2550 msnm)
    const tempBase = Math.random() < 0.8 
        ? 12.0 + Math.random() * 10.0 
        : 22.0 + Math.random() * 3.0;

    const humedadBase = 55.0 + Math.random() * 30.0;
    const presionBase = 745.0 + Math.random() * 10.0;

    const icaCalculado = calcularIcaGlobal({
        pm25: parseFloat(pm25Base.toFixed(1)),
        pm10: parseFloat(pm10Base.toFixed(1)),
        no2: parseFloat(no2Base.toFixed(1))
    });

    const inicioProceso = Date.now();
    const latenciaSimuladaMs = Math.floor(45 + Math.random() * 40);

    const datosSimulados = {
        pm1: parseFloat(pm1Base.toFixed(1)),
        pm25: parseFloat(pm25Base.toFixed(1)),
        pm10: parseFloat(pm10Base.toFixed(1)),
        voc: parseFloat(vocBase.toFixed(2)),
        no2: parseFloat(no2Base.toFixed(1)),
        temperatura: parseFloat(tempBase.toFixed(1)),
        humedad: parseFloat(humedadBase.toFixed(1)),
        presion: parseFloat(presionBase.toFixed(1)),
        ica: icaCalculado.icaGlobal,
        categoriaIca: icaCalculado.categoria,
        colorIca: icaCalculado.color,
        contaminanteCritico: icaCalculado.contaminanteCritico,
        nodoSalud: {
            estado: "Online",
            latenciaMs: latenciaSimuladaMs,
            ultimoLatido: new Date().toISOString(),
            firmwareVersion: "v2.4-Ubaté-IoT"
        }
    };

    // Intentar guardar en Supabase (si la tabla ya existe)
    try {
        const { error } = await supabase
            .from('historial_sensores')
            .insert([{
                pm1: datosSimulados.pm1,
                pm25: datosSimulados.pm25,
                pm10: datosSimulados.pm10,
                voc: datosSimulados.voc,
                no2: datosSimulados.no2,
                temperatura: datosSimulados.temperatura,
                humedad: datosSimulados.humedad,
                presion: datosSimulados.presion,
                ica: datosSimulados.ica,
                categoria_ica: datosSimulados.categoriaIca
            }]);
        
        if (error && process.env.NODE_ENV !== 'test') {
            console.error("Supabase Error:", error.message);
        }
    } catch (err) {
        if (process.env.NODE_ENV !== 'test') {
            console.warn("Conexión remota a Supabase diferida:", err.message);
        }
    }

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(datosSimulados)
    };
};
