const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://czbktgouidobpqtlvypz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fP7QcD8MYEzPG2OgAGMSYw_SnNe8xUY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

exports.handler = async function(event, context) {
    // --- Partículas (Relación Física) ---
    // PM2.5: 90% normal (5-45), 10% crítico (45-60)
    const pm25Base = Math.random() < 0.9 
        ? 5.0 + Math.random() * 40.0 
        : 45.0 + Math.random() * 15.0;
    
    // PM10: 80% es PM2.5 x 1.5, 20% es PM2.5 + 30 (construcción)
    const pm10Base = Math.random() < 0.8 
        ? pm25Base * 1.5 
        : pm25Base + 30.0;
    
    // PM1: Estrictamente 60% de PM2.5
    const pm1Base = pm25Base * 0.6;

    // --- Gases y Variables Químicas ---
    // VOC: 95% normal (0.2-0.6), 5% uso de químicos (1.5)
    const vocBase = Math.random() < 0.95 
        ? 0.2 + Math.random() * 0.4 
        : 1.5 + Math.random() * 0.5;

    // NO2: 90% normal Ubaté (10-40), 10% carretera principal (90-110)
    const no2Base = Math.random() < 0.9 
        ? 10.0 + Math.random() * 30.0 
        : 90.0 + Math.random() * 20.0;

    // --- Meteorología (Ubaté, 2550 msnm) ---
    // Temperatura: 12-22°C (ambiente) o hasta 24°C (laboratorio)
    const tempBase = Math.random() < 0.8 
        ? 12.0 + Math.random() * 10.0 
        : 22.0 + Math.random() * 3.0;

    // Humedad: Zona andina alta humedad (55-85%)
    const humedadBase = 55.0 + Math.random() * 30.0;

    // Presión: Ubaté real a 2550 msnm (745-755 hPa)
    const presionBase = 745.0 + Math.random() * 10.0;

    const datosSimulados = {
        pm1: parseFloat(pm1Base.toFixed(1)),
        pm25: parseFloat(pm25Base.toFixed(1)),
        pm10: parseFloat(pm10Base.toFixed(1)),
        voc: parseFloat(vocBase.toFixed(2)),
        no2: parseFloat(no2Base.toFixed(1)),
        temperatura: parseFloat(tempBase.toFixed(1)),
        humedad: parseFloat(humedadBase.toFixed(1)),
        presion: parseFloat(presionBase.toFixed(1))
    };

    // Intentar guardar en Supabase (si la tabla ya existe)
    try {
        const { error } = await supabase
            .from('historial_sensores')
            .insert([datosSimulados]);
        
        if (error) {
            console.error("Supabase Error:", error.message);
        }
    } catch (err) {
        console.error("No se pudo conectar a Supabase:", err);
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
