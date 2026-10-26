/**
 * ============================================================================
 * ENDPOINT SERVERLESS: /api/predecir
 * ============================================================================
 * Ejecuta inferencia de Machine Learning real para predecir concentraciones
 * futuras de contaminantes, clasificar riesgo ICA y detectar anomalías.
 */

const { predecirCalidadAire } = require('../ml_model');

exports.handler = async function(event, context) {
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    try {
        let payload = {};

        if (event.httpMethod === "POST" && event.body) {
            payload = JSON.parse(event.body);
        } else if (event.queryStringParameters) {
            payload = event.queryStringParameters;
        }

        const resultado = predecirCalidadAire(payload);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(resultado)
        };
    } catch (error) {
        console.error("Error en inferencia de Machine Learning:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: "Error interno durante la inferencia del modelo ML",
                detalles: error.message
            })
        };
    }
};
