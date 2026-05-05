exports.handler = async function(event, context) {
    // Generar datos aleatorios para simular variaciones cada vez que se consulte
    const pm25Val = (Math.random() * 60).toFixed(1); // 0 a 60 µg/m³ (verde a rojo)
    const vocVal = (Math.random() * 2).toFixed(2); // 0 a 2 ppm
    const tempVal = (20 + Math.random() * 8).toFixed(1); // 20 a 28 °C

    const datosSimulados = {
        pm25: parseFloat(pm25Val),
        voc: parseFloat(vocVal),
        temperatura: parseFloat(tempVal)
    };
    
    // ==========================================
    // ESPACIO PARA INTEGRACIÓN CON LLM EN EL FUTURO
    // ==========================================
    // const { OpenAI } = require('openai');
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // ...
    // ==========================================

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(datosSimulados)
    };
};
