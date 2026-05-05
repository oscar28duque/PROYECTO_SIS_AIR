/**
 * ==========================================
 * 1. CONFIGURACIÓN DE SUPABASE (BASE DE DATOS)
 * ==========================================
 * Aquí definimos la URL y la Llave Pública del proyecto en Supabase.
 * Se utiliza 'var' en lugar de 'const' para que, si el archivo se recarga 
 * múltiples veces (hot-reload en desarrollo), no lance un error de "variable ya declarada".
 */
var SUPABASE_URL = 'https://czbktgouidobpqtlvypz.supabase.co';
var SUPABASE_KEY = 'sb_publishable_fP7QcD8MYEzPG2OgAGMSYw_SnNe8xUY';
var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("App.js loaded - version 3");

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Content Loaded event fired");
    try {

    /**
     * ==========================================
     * 2. LÓGICA DE LOGIN Y REGISTRO (index.html)
     * ==========================================
     * Esta sección solo se ejecuta si los formularios de login o registro existen.
     * Permite alternar entre las vistas y maneja la autenticación con Supabase.
     */
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    
    if (loginSection || registerSection) {
        // Alternar vistas
        const showRegisterBtn = document.getElementById('show-register-btn');
        const showLoginBtn = document.getElementById('show-login-btn');

        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                loginSection.style.display = 'none';
                registerSection.style.display = 'block';
            });
        }

        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                registerSection.style.display = 'none';
                loginSection.style.display = 'block';
            });
        }

        // Verificar sesión activa SIN BLOQUEAR la carga de los botones
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                window.location.href = 'dashboard.html';
            }
        }).catch(err => console.error("Error al verificar sesión:", err));


        // Lógica de Inicio de Sesión
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const errorMsg = document.getElementById('login-error');
                const authBtn = document.getElementById('login-submit-btn');

                errorMsg.style.display = 'none';
                authBtn.disabled = true;

                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) {
                    errorMsg.textContent = "Credenciales incorrectas o usuario no encontrado.";
                    errorMsg.style.display = 'block';
                    authBtn.disabled = false;
                } else {
                    window.location.href = 'dashboard.html';
                }
            });
        }

        // Lógica de Registro
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('reg-name').value;
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;
                const errorMsg = document.getElementById('reg-error');
                const successMsg = document.getElementById('reg-success');
                const authBtn = document.getElementById('reg-submit-btn');

                errorMsg.style.display = 'none';
                successMsg.style.display = 'none';

                // --- VALIDACIONES BÁSICAS DE SEGURIDAD ---
                const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(email)) {
                    errorMsg.textContent = "Por favor, ingresa un correo electrónico con un dominio válido (ej. @gmail.com).";
                    errorMsg.style.display = 'block';
                    return;
                }

                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                if (!passwordRegex.test(password)) {
                    errorMsg.innerHTML = "La contraseña es muy débil. Debe tener:<br>• Mínimo 8 caracteres<br>• Al menos 1 mayúscula<br>• Al menos 1 número<br>• Al menos 1 carácter especial (@$!%*?&)";
                    errorMsg.style.display = 'block';
                    return;
                }

                authBtn.disabled = true;

                // Asignar rol de admin al correo del creador del proyecto. Si no, rol de user.
                const assignedRole = email === 'oscarduquegar@gmail.com' ? 'admin' : 'user';

                const { data, error } = await supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: name,
                            role: assignedRole
                        }
                    }
                });

                if (error) {
                    errorMsg.textContent = "Error al registrar: " + error.message;
                    errorMsg.style.display = 'block';
                    authBtn.disabled = false;
                } else {
                    // Si data.session es null, Supabase está pidiendo confirmación de correo
                    if (!data.session) {
                        successMsg.innerHTML = "Registro exitoso.<br><strong>Revisa tu correo electrónico para confirmar tu cuenta.</strong>";
                        successMsg.style.display = 'block';
                        authBtn.disabled = false;
                    } else {
                        successMsg.textContent = "Registro exitoso. Iniciando sesión...";
                        successMsg.style.display = 'block';
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 2000);
                    }
                }
            });
        }
    }

    /**
     * ==========================================
     * 3. LÓGICA PRINCIPAL DEL DASHBOARD
     * ==========================================
     * Esta sección se ejecuta en 'dashboard.html'.
     * Protege la ruta verificando si hay una sesión activa, asigna permisos
     * de Administrador/Usuario, inicializa las gráficas, mapas y empieza a
     * pedir datos al servidor periódicamente.
     */
    if (document.getElementById('logout-btn')) {
        // Verificar sesión activa
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            window.location.href = 'index.html';
            return;
        }

        const userRole = session.user.user_metadata?.role || 'user';
        const userEmail = session.user.email;
        const isAdmin = userRole === 'admin' || userEmail === 'oscarduquegar@gmail.com';
        
        const btnPurificacion = document.getElementById('btn-purificacion');
        const adminMapControls = document.getElementById('admin-map-controls');

        if (!isAdmin) {
            // Usuario normal: Ocultar botones de administrador
            if (btnPurificacion) btnPurificacion.style.display = 'none';
            if (adminMapControls) adminMapControls.style.display = 'none';
        } else {
            // Admin: Configurar funcionalidad de los botones
            if (adminMapControls) {
                adminMapControls.style.display = 'flex';
                setupAdminMapControls();
            }

            if (btnPurificacion) {
                btnPurificacion.addEventListener('click', () => {
                    const planDiv = document.getElementById('plan-result');
                    planDiv.style.display = 'block';
                    planDiv.innerHTML = '<p><em>Conectando con la IA para analizar los datos actuales...</em></p>';

                    setTimeout(() => {
                        planDiv.innerHTML = `
                            <h3>Plan de Purificación Sugerido (Admin)</h3>
                            <p>En este apartado se podrá ver el plan de purificación sugerido por la IA en base al historial actual.</p>
                        `;
                    }, 1500);
                });
            }
        }

        document.getElementById('logout-btn').addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });

        // Evento Botón PDF (ahora son 2 botones, en el dashboard y en la pestaña historial)
        const generatePdfFunc = generatePDF;
        const btnPdf1 = document.getElementById('btn-pdf');
        const btnPdf2 = document.getElementById('btn-pdf-2');
        if (btnPdf1) btnPdf1.addEventListener('click', generatePdfFunc);
        if (btnPdf2) btnPdf2.addEventListener('click', generatePdfFunc);

        // Lógica de Navegación por pestañas
        const navBtns = document.querySelectorAll('.nav-btn');
        const views = document.querySelectorAll('.view-section');

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Quitar clase active de todos los botones y ocultar vistas
                navBtns.forEach(b => b.classList.remove('active'));
                views.forEach(v => v.style.display = 'none');

                // Activar el presionado
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-target');
                document.getElementById(targetId).style.display = 'block';

                // Si entramos a historial, lo renderizamos
                if (targetId === 'view-historial') {
                    renderFullHistory();
                } else if (targetId === 'view-mapa' && sensorMap) {
                    // Leaflet necesita recalcular tamaño si el mapa estaba en display:none
                    setTimeout(() => sensorMap.invalidateSize(), 100);
                }
            });
        });

        // Lógica del menú de notificaciones
        const alertsBtn = document.getElementById('alerts-btn');
        const alertsDropdown = document.getElementById('alerts-dropdown');
        if (alertsBtn && alertsDropdown) {
            alertsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                alertsDropdown.style.display = alertsDropdown.style.display === 'none' ? 'block' : 'none';
                // Limpiar contador al abrir
                document.getElementById('alerts-badge').style.display = 'none';
                unreadAlerts = 0;
            });
            window.addEventListener('click', () => {
                alertsDropdown.style.display = 'none';
            });
            alertsDropdown.addEventListener('click', (e) => e.stopPropagation());
        }

        setupModal();
        initCharts();
        initMap();
        fetchData();
        setInterval(fetchData, 10000);
    }
    } catch(err) { console.error("Error in DOMContentLoaded:", err); }
});

let particulasChart, gasesChart, climaChart;
let sensorMap, markerCentro, markerNorte, markerSur;
let alertsHistory = [];
let unreadAlerts = 0;
let isMapEditMode = false;

/**
 * ==========================================
 * 4. FUNCIONES DE ADMINISTRADOR Y MAPA
 * ==========================================
 */

/**
 * setupAdminMapControls()
 * Si el usuario es admin, permite arrastrar y mover los marcadores
 * de los sensores en el mapa. Guarda las nuevas ubicaciones en 'localStorage'
 * para que persistan al recargar la página.
 */
function setupAdminMapControls() {
    const btnEdit = document.getElementById('btn-edit-map');
    const btnSave = document.getElementById('btn-save-map');
    const instructions = document.getElementById('map-instructions');

    if (!btnEdit || !btnSave) return;

    btnEdit.addEventListener('click', () => {
        isMapEditMode = true;
        btnEdit.style.display = 'none';
        btnSave.style.display = 'block';
        if (instructions) instructions.textContent = "Modo Edición: Arrastra los círculos en el mapa para cambiar su ubicación.";

        // Habilitar arrastre
        if (markerCentro) markerCentro.dragging.enable();
        if (markerNorte) markerNorte.dragging.enable();
        if (markerSur) markerSur.dragging.enable();
    });

    btnSave.addEventListener('click', () => {
        isMapEditMode = false;
        btnEdit.style.display = 'block';
        btnSave.style.display = 'none';
        if (instructions) instructions.textContent = "Ubicación en tiempo real de las estaciones de monitoreo y su índice de calidad del aire (AQI).";

        // Deshabilitar arrastre
        if (markerCentro) markerCentro.dragging.disable();
        if (markerNorte) markerNorte.dragging.disable();
        if (markerSur) markerSur.dragging.disable();

        // Guardar ubicaciones en localStorage
        const coords = {
            centro: markerCentro.getLatLng(),
            norte: markerNorte.getLatLng(),
            sur: markerSur.getLatLng()
        };
        localStorage.setItem('sensor_coords', JSON.stringify(coords));
        alert('Ubicaciones guardadas correctamente en este dispositivo.');
    });
}

function getSensorIcon(color) {
    return L.divIcon({
        className: 'custom-sensor-icon',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); cursor: pointer;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

const chartData = {
    labels: [],
    pm1: [],
    pm25: [],
    pm10: [],
    no2: [],
    voc: [],
    temp: [],
    humedad: [],
    presion: []
};

function setupModal() {
    const modal = document.getElementById('history-modal');
    const closeBtn = document.getElementById('close-modal');

    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const type = card.getAttribute('data-type');
            if (type) openModalForType(type);
        });
    });
}

function openModalForType(type) {
    const modal = document.getElementById('history-modal');
    const title = document.getElementById('modal-title');
    const tbody = document.getElementById('modal-table-body');

    tbody.innerHTML = '';

    let dataArray = [];
    let titleText = '';
    let unit = '';

    switch (type) {
        case 'pm1': titleText = 'Historial de PM1'; dataArray = chartData.pm1; unit = 'µg/m³'; break;
        case 'pm25': titleText = 'Historial de PM2.5'; dataArray = chartData.pm25; unit = 'µg/m³'; break;
        case 'pm10': titleText = 'Historial de PM10'; dataArray = chartData.pm10; unit = 'µg/m³'; break;
        case 'no2': titleText = 'Historial de NO2'; dataArray = chartData.no2; unit = 'µg/m³'; break;
        case 'voc': titleText = 'Historial de VOC'; dataArray = chartData.voc; unit = 'ppm'; break;
        case 'temp': titleText = 'Historial de Temperatura'; dataArray = chartData.temp; unit = '°C'; break;
        case 'humedad': titleText = 'Historial de Humedad'; dataArray = chartData.humedad; unit = '%'; break;
        case 'presion': titleText = 'Historial de Presión'; dataArray = chartData.presion; unit = 'hPa'; break;
    }

    title.textContent = titleText;

    if (dataArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No hay datos aún.</td></tr>';
    } else {
        for (let i = dataArray.length - 1; i >= 0; i--) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${chartData.labels[i]}</td>
                <td><strong>${dataArray[i]}</strong> <small>${unit}</small></td>
            `;
            tbody.appendChild(tr);
        }
    }
    modal.style.display = 'flex';
}

/**
 * ==========================================
 * 5. INICIALIZACIÓN DE GRÁFICAS (Chart.js)
 * ==========================================
 * Prepara los 3 lienzos (canvas) para dibujar las gráficas en tiempo real.
 */
function initCharts() {
    const ctxParticulas = document.getElementById('particulasChart');
    const ctxGases = document.getElementById('gasesChart');
    const ctxClima = document.getElementById('climaChart');
    if (!ctxParticulas || !ctxGases || !ctxClima) return;

    particulasChart = new Chart(ctxParticulas, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                { label: 'PM1', data: chartData.pm1, borderColor: '#3B82F6', tension: 0.3 },
                { label: 'PM2.5', data: chartData.pm25, borderColor: '#1A5F7A', tension: 0.3 },
                { label: 'PM10', data: chartData.pm10, borderColor: '#EF4444', tension: 0.3 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Material Particulado (µg/m³)' } } }
    });

    gasesChart = new Chart(ctxGases, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                { label: 'NO2 (µg/m³)', data: chartData.no2, borderColor: '#8B5CF6', tension: 0.3 },
                { label: 'VOC (ppm x100)', data: chartData.voc, borderColor: '#F59E0B', tension: 0.3 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Gases Contaminantes' } } }
    });

    climaChart = new Chart(ctxClima, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                { label: 'Temp (°C)', data: chartData.temp, borderColor: '#10B981', tension: 0.3 },
                { label: 'Humedad (%)', data: chartData.humedad, borderColor: '#3B82F6', tension: 0.3 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Clima' } } }
    });
}

/**
 * ==========================================
 * 6. INICIALIZACIÓN DEL MAPA (Leaflet)
 * ==========================================
 * Centra el mapa en Ubaté y lee las posiciones guardadas de los sensores
 * desde el almacenamiento local del navegador.
 */
function initMap() {
    const mapContainer = document.getElementById('sensor-map');
    if (!mapContainer) return;

    // Centrar en Ubaté
    sensorMap = L.map('sensor-map').setView([5.3086, -73.8144], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(sensorMap);

    // Cargar coordenadas guardadas
    let coords = {
        centro: { lat: 5.3086, lng: -73.8144 },
        norte: { lat: 5.3150, lng: -73.8100 },
        sur: { lat: 5.3000, lng: -73.8200 }
    };

    const savedCoords = localStorage.getItem('sensor_coords');
    if (savedCoords) {
        coords = JSON.parse(savedCoords);
    }

    const defaultIcon = getSensorIcon('#10B981'); // Verde por defecto

    // Usar L.marker en lugar de circleMarker para soportar Drag & Drop
    markerCentro = L.marker([coords.centro.lat, coords.centro.lng], { icon: defaultIcon, draggable: false }).addTo(sensorMap).bindPopup("<b>Sensor Centro</b><br>Cargando...");
    markerNorte = L.marker([coords.norte.lat, coords.norte.lng], { icon: defaultIcon, draggable: false }).addTo(sensorMap).bindPopup("<b>Sensor Norte</b><br>Cargando...");
    markerSur = L.marker([coords.sur.lat, coords.sur.lng], { icon: defaultIcon, draggable: false }).addTo(sensorMap).bindPopup("<b>Sensor Sur</b><br>Cargando...");
}

/**
 * ==========================================
 * 7. OBTENCIÓN DE DATOS (FETCH)
 * ==========================================
 * Realiza una petición GET al backend (simulado o real) para traer la
 * información de los sensores actualizada.
 */
async function fetchData() {
    try {
        const response = await fetch('/api/analizar');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        updateDashboard(data);
        updateCharts(data);
        checkAlerts(data);

        // Refrescar modal si está abierto
        const modal = document.getElementById('history-modal');
        if (modal.style.display === 'flex') {
            const title = document.getElementById('modal-title').textContent;
            let type = '';
            if (title.includes('PM10')) type = 'pm10';
            else if (title.includes('PM2.5')) type = 'pm25';
            else if (title.includes('PM1')) type = 'pm1';
            else if (title.includes('NO2')) type = 'no2';
            else if (title.includes('VOC')) type = 'voc';
            else if (title.includes('Temperatura')) type = 'temp';
            else if (title.includes('Humedad')) type = 'humedad';
            else if (title.includes('Presión')) type = 'presion';

            if (type) openModalForType(type);
        }
    } catch (error) {
        console.error("Error al obtener los datos:", error);
    }
}

// -- SISTEMA DE ALERTAS --
/**
 * ==========================================
 * 9. SISTEMA DE ALERTAS
 * ==========================================
 * Revisa si los valores de contaminación superan los límites seguros.
 * Si es así, crea una notificación visual en la campanita.
 */
function checkAlerts(data) {
    const now = new Date();
    const timeLabel = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
    let newAlerts = [];

    // Validar umbrales Dañinos (Thresholds del dashboard)
    if (data.pm1 > 25) newAlerts.push(`Nivel Dañino de PM1 detectado: ${data.pm1} µg/m³`);
    if (data.pm25 > 35.4) newAlerts.push(`Nivel Dañino de PM2.5 detectado: ${data.pm25} µg/m³`);
    if (data.pm10 > 154) newAlerts.push(`Nivel Dañino de PM10 detectado: ${data.pm10} µg/m³`);
    if (data.no2 > 100) newAlerts.push(`Nivel Dañino de NO2 detectado: ${data.no2} µg/m³`);
    if (data.voc > 1.0) newAlerts.push(`Nivel Alto de VOC detectado: ${data.voc} ppm`);

    if (newAlerts.length > 0) {
        newAlerts.forEach(msg => {
            alertsHistory.unshift({ time: timeLabel, message: msg });
        });

        // Mantener solo las últimas 20 alertas
        if (alertsHistory.length > 20) alertsHistory = alertsHistory.slice(0, 20);

        unreadAlerts += newAlerts.length;
        renderAlerts();
    }
}

function renderAlerts() {
    const badge = document.getElementById('alerts-badge');
    const list = document.getElementById('alerts-list');
    const fullList = document.getElementById('full-alerts-list'); // Lista grande de la pestaña

    if (!badge || !list) return;

    if (unreadAlerts > 0) {
        badge.textContent = unreadAlerts;
        badge.style.display = 'block';
    }

    if (alertsHistory.length === 0) {
        list.innerHTML = '<li style="padding: 1rem; text-align: center; color: #666;">No hay alertas.</li>';
        if (fullList) fullList.innerHTML = '<li style="padding: 1rem; text-align: center; color: #666; border-left: none;">No hay alertas registradas aún.</li>';
        return;
    }

    list.innerHTML = '';
    if (fullList) fullList.innerHTML = '';

    alertsHistory.forEach(alert => {
        // Dropdown pequeño
        const li = document.createElement('li');
        li.className = 'alert-item';
        li.innerHTML = `<strong>⚠️ Alerta</strong><br>${alert.message} <small>${alert.time}</small>`;
        list.appendChild(li);

        // Lista grande
        if (fullList) {
            const fLi = document.createElement('li');
            fLi.innerHTML = `<strong>⚠️ Alerta de Calidad (${alert.time})</strong><br><span style="color:var(--text-color); margin-top:0.5rem; display:block;">${alert.message}</span>`;
            fullList.appendChild(fLi);
        }
    });
}

function renderFullHistory() {
    const tbody = document.getElementById('full-history-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (chartData.labels.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No hay datos recopilados todavía.</td></tr>';
        return;
    }

    // Llenar del más reciente al más antiguo
    for (let i = chartData.labels.length - 1; i >= 0; i--) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${chartData.labels[i]}</td>
            <td>${chartData.pm1[i]}</td>
            <td>${chartData.pm25[i]}</td>
            <td>${chartData.pm10[i]}</td>
            <td>${chartData.no2[i]}</td>
            <td>${(chartData.voc[i] / 100).toFixed(2)}</td>
            <td>${chartData.temp[i]}</td>
            <td>${chartData.humedad[i]}</td>
            <td>${chartData.presion[i]}</td>
        `;
        tbody.appendChild(tr);
    }
}

// -- FIN SISTEMA DE ALERTAS --

/**
 * ==========================================
 * 8. ACTUALIZACIÓN DEL PANEL PRINCIPAL
 * ==========================================
 * Actualiza los textos, colores de los recuadros principales (PM2.5, NO2, etc.)
 * y el color de los marcadores del mapa dependiendo del nivel de contaminación.
 */
function updateDashboard(data) {
    const applyAqiClass = (cardId, statusId, val, thresholds, labels) => {
        const card = document.getElementById(cardId);
        const status = document.getElementById(statusId);
        if (!card) return;
        card.className = 'card';
        if (val <= thresholds[0]) { card.classList.add('aqi-good'); status.textContent = labels[0]; }
        else if (val <= thresholds[1]) { card.classList.add('aqi-moderate'); status.textContent = labels[1]; }
        else { card.classList.add('aqi-bad'); status.textContent = labels[2]; }
    };

    if (data.pm1 !== undefined) {
        document.getElementById('pm1-value').textContent = data.pm1;
        applyAqiClass('card-pm1', 'pm1-status', data.pm1, [10, 25], ['Buena', 'Moderada', 'Dañina']);
    }
    if (data.pm25 !== undefined) {
        document.getElementById('pm25-value').textContent = data.pm25;
        applyAqiClass('card-pm25', 'pm25-status', data.pm25, [12, 35.4], ['Buena', 'Moderada', 'Dañina']);
    }
    if (data.pm10 !== undefined) {
        document.getElementById('pm10-value').textContent = data.pm10;
        applyAqiClass('card-pm10', 'pm10-status', data.pm10, [54, 154], ['Buena', 'Moderada', 'Dañina']);
    }
    if (data.no2 !== undefined) {
        document.getElementById('no2-value').textContent = data.no2;
        applyAqiClass('card-no2', 'no2-status', data.no2, [53, 100], ['Buena', 'Moderada', 'Dañina']);
    }
    if (data.voc !== undefined) {
        document.getElementById('voc-value').textContent = data.voc;
        applyAqiClass('card-voc', 'voc-status', data.voc, [0.3, 1.0], ['Bajo', 'Medio', 'Alto']);
    }
    if (data.temperatura !== undefined) document.getElementById('temp-value').textContent = data.temperatura;
    if (data.humedad !== undefined) document.getElementById('humedad-value').textContent = data.humedad;
    if (data.presion !== undefined) document.getElementById('presion-value').textContent = data.presion;

    // -- Actualizar Mapa --
    if (markerCentro && data.pm25 !== undefined) {
        const getColor = (val) => val <= 12 ? '#10B981' : val <= 35.4 ? '#F59E0B' : '#EF4444'; // Verde, Amarillo, Rojo
        const getEstado = (val) => val <= 12 ? 'Bueno' : val <= 35.4 ? 'Moderado' : 'Dañino';

        // Sensor Centro (Datos reales)
        const colorCentro = getColor(data.pm25);
        markerCentro.setIcon(getSensorIcon(colorCentro));
        markerCentro.setPopupContent(`<b>Sensor Centro (Parque Principal)</b><br>PM2.5: ${data.pm25} µg/m³<br>Estado: ${getEstado(data.pm25)}`);

        // Sensor Norte (Simulado más limpio)
        const pmNorte = (data.pm25 * 0.8).toFixed(1);
        const colorNorte = getColor(pmNorte);
        markerNorte.setIcon(getSensorIcon(colorNorte));
        markerNorte.setPopupContent(`<b>Sensor Norte (Salida Chiquinquirá)</b><br>PM2.5: ${pmNorte} µg/m³<br>Estado: ${getEstado(pmNorte)}`);

        // Sensor Sur (Simulado más contaminado por zona industrial)
        const pmSur = (data.pm25 * 1.3).toFixed(1);
        const colorSur = getColor(pmSur);
        markerSur.setIcon(getSensorIcon(colorSur));
        markerSur.setPopupContent(`<b>Sensor Sur (Zona Industrial)</b><br>PM2.5: ${pmSur} µg/m³<br>Estado: ${getEstado(pmSur)}`);
    }
}

function updateCharts(data) {
    if (!particulasChart || !gasesChart || !climaChart) return;

    const now = new Date();
    const timeLabel = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0') + ':' + now.getSeconds().toString().padStart(2, '0');

    chartData.labels.push(timeLabel);
    chartData.pm1.push(data.pm1);
    chartData.pm25.push(data.pm25);
    chartData.pm10.push(data.pm10);
    chartData.no2.push(data.no2);
    chartData.voc.push(data.voc * 100);
    chartData.temp.push(data.temperatura);
    chartData.humedad.push(data.humedad);
    chartData.presion.push(data.presion);

    if (chartData.labels.length > 30) {
        chartData.labels.shift();
        chartData.pm1.shift();
        chartData.pm25.shift();
        chartData.pm10.shift();
        chartData.no2.shift();
        chartData.voc.shift();
        chartData.temp.shift();
        chartData.humedad.shift();
        chartData.presion.shift();
    }

    const sliceLen = 10;

    particulasChart.data.labels = chartData.labels.slice(-sliceLen);
    particulasChart.data.datasets[0].data = chartData.pm1.slice(-sliceLen);
    particulasChart.data.datasets[1].data = chartData.pm25.slice(-sliceLen);
    particulasChart.data.datasets[2].data = chartData.pm10.slice(-sliceLen);

    gasesChart.data.labels = chartData.labels.slice(-sliceLen);
    gasesChart.data.datasets[0].data = chartData.no2.slice(-sliceLen);
    gasesChart.data.datasets[1].data = chartData.voc.slice(-sliceLen);

    climaChart.data.labels = chartData.labels.slice(-sliceLen);
    climaChart.data.datasets[0].data = chartData.temp.slice(-sliceLen);
    climaChart.data.datasets[1].data = chartData.humedad.slice(-sliceLen);

    particulasChart.update();
    gasesChart.update();
    climaChart.update();

    // Actualizar tabla completa si estamos en esa pestaña
    const vistaHistorial = document.getElementById('view-historial');
    if (vistaHistorial && vistaHistorial.style.display === 'block') {
        renderFullHistory();
    }
}

// -- SISTEMA DE GENERACIÓN DE PDF --
/**
 * ==========================================
 * 10. GENERACIÓN DE REPORTES PDF
 * ==========================================
 * Utiliza la librería jsPDF y html2canvas para tomar "fotos" de las gráficas
 * y armar un documento PDF descargable con el resumen de calidad del aire.
 */
async function generatePDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("La librería PDF aún se está cargando. Intenta en un segundo.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.setTextColor(26, 95, 122); // primary-blue
    doc.text("Reporte de Calidad del Aire - SIS AIR", 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleString();
    doc.text(`Ubaté - Generado el: ${dateStr}`, 14, 30);

    // Si no hay datos
    if (chartData.labels.length === 0) {
        doc.text("No hay datos históricos disponibles para generar el reporte.", 14, 40);
        doc.save("Reporte_SIS_AIR_Ubate.pdf");
        return;
    }

    // Preparar tabla de datos
    const tableColumn = ["Hora", "PM1", "PM2.5", "PM10", "NO2", "VOC", "Temp", "Humedad", "Presión"];
    const tableRows = [];

    // Agregamos desde el más antiguo al más reciente que esté en memoria
    for (let i = 0; i < chartData.labels.length; i++) {
        const rowData = [
            chartData.labels[i],
            chartData.pm1[i],
            chartData.pm25[i],
            chartData.pm10[i],
            chartData.no2[i],
            (chartData.voc[i] / 100).toFixed(2), // Revertir el escalado
            chartData.temp[i],
            chartData.humedad[i],
            chartData.presion[i]
        ];
        tableRows.push(rowData);
    }

    // Usar el plugin autotable
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [26, 95, 122] } // primary-blue
    });

    // Alertas activas al final (opcional, para dar más contexto al reporte)
    const finalY = doc.lastAutoTable.finalY || 40;
    if (alertsHistory.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(239, 68, 68); // Rojo
        doc.text("Alertas Recientes Detectadas:", 14, finalY + 15);

        doc.setFontSize(9);
        doc.setTextColor(100);
        let currentY = finalY + 22;

        // Mostrar hasta 5 alertas
        const maxAlerts = Math.min(5, alertsHistory.length);
        for (let i = 0; i < maxAlerts; i++) {
            doc.text(`- [${alertsHistory[i].time}] ${alertsHistory[i].message}`, 14, currentY);
            currentY += 6;
        }
    }

    // Guardar PDF
    doc.save("Reporte_SIS_AIR_Ubate.pdf");
}
