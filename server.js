/**
 * ============================================================================
 * SERVIDOR DE DESARROLLO LOCAL SIS AIR UBATÉ
 * ============================================================================
 * Emula el comportamiento de Netlify Dev (archivos estáticos de frontend
 * y endpoints serverless /api/analizar y /api/predecir) sin requerir
 * dependencias externas pesadas.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { handler: analizarHandler } = require('./backend/functions/analizar');
const { handler: predecirHandler } = require('./backend/functions/predecir');

const PORT = process.env.PORT || 8888;
const FRONTEND_DIR = path.join(__dirname, 'frontend');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // 1. Enrutamiento de Funciones Serverless (/api)
    if (pathname === '/api/analizar' || pathname === '/.netlify/functions/analizar') {
        try {
            const event = {
                httpMethod: req.method,
                headers: req.headers,
                queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
                body: ''
            };
            const result = await analizarHandler(event, {});
            res.writeHead(result.statusCode || 200, result.headers || { 'Content-Type': 'application/json' });
            res.end(result.body || '');
            return;
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
            return;
        }
    }

    if (pathname === '/api/predecir' || pathname === '/.netlify/functions/predecir') {
        let bodyChunks = [];
        req.on('data', chunk => bodyChunks.push(chunk));
        req.on('end', async () => {
            try {
                const bodyStr = Buffer.concat(bodyChunks).toString();
                const event = {
                    httpMethod: req.method,
                    headers: req.headers,
                    queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
                    body: bodyStr
                };
                const result = await predecirHandler(event, {});
                res.writeHead(result.statusCode || 200, result.headers || { 'Content-Type': 'application/json' });
                res.end(result.body || '');
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // 2. Servir Archivos Estáticos de Frontend
    let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') {
        safePath = '/index.html';
    }

    let filePath = path.join(FRONTEND_DIR, safePath);

    // Si la ruta no tiene extensión y no existe, intentar con .html
    if (!path.extname(filePath) && !fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath += '.html';
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Recurso no encontrado');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`\n====================================================================`);
        console.log(`🌐 SIS AIR Ubaté - Servidor de Desarrollo Activo`);
        console.log(`📍 URL Local:         http://localhost:${PORT}`);
        console.log(`📡 Ingesta Telemetría: http://localhost:${PORT}/api/analizar`);
        console.log(`🧠 Inferencia ML:      http://localhost:${PORT}/api/predecir`);
        console.log(`====================================================================\n`);
    });
}

module.exports = server;
