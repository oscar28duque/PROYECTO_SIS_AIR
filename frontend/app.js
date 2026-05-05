document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DE LOGIN ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Simulación básica de autenticación
            if (username && password) {
                // Simulamos un login exitoso
                localStorage.setItem('sisair_auth', 'true');
                window.location.href = 'dashboard.html';
            } else {
                document.getElementById('login-error').style.display = 'block';
            }
        });
        
        // Si ya está logueado, ir al dashboard
        if (localStorage.getItem('sisair_auth') === 'true') {
            window.location.href = 'dashboard.html';
        }
    }

    // --- LÓGICA DEL DASHBOARD ---
    if (document.getElementById('logout-btn')) {
        // Verificar si está autenticado
        if (localStorage.getItem('sisair_auth') !== 'true') {
            window.location.href = 'login.html';
        }

        // Configurar Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('sisair_auth');
            window.location.href = 'login.html';
        });

        // Configurar Botón Plan de Purificación
        document.getElementById('btn-purificacion').addEventListener('click', () => {
            const planDiv = document.getElementById('plan-result');
            planDiv.style.display = 'block';
            planDiv.innerHTML = '<p><em>Conectando con la IA para analizar los datos actuales...</em></p>';
            
            setTimeout(() => {
                planDiv.innerHTML = `
                    <h3>Plan de Purificación Sugerido (Simulado)</h3>
                    <p>Se recomienda encender purificadores de filtro HEPA al 80% de potencia debido a los niveles detectados en Ubaté.</p>
                `;
            }, 1500);
        });

        // Inicializar Gráfica
        initChart();
        
        // Obtener datos iniciales y luego cada cierto tiempo
        fetchData();
        // Para demostrar la aletoriedad más rápido en la demo, actualizaremos cada 10 segundos
        setInterval(fetchData, 10000); 
    }
});

let airChart;
const chartData = {
    labels: [],
    pm25: [],
    voc: []
};

function initChart() {
    const ctx = document.getElementById('airQualityChart');
    if (!ctx) return;

    airChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'PM2.5 (µg/m³)',
                    data: chartData.pm25,
                    borderColor: '#1A5F7A',
                    backgroundColor: 'rgba(26, 95, 122, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'VOC (ppm)',
                    data: chartData.voc,
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Historial de Calidad del Aire - Ubaté'
                }
            }
        }
    });
}

async function fetchData() {
    try {
        const response = await fetch('/api/analizar');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        updateDashboard(data);
        updateChart(data);
    } catch (error) {
        console.error("Error al obtener los datos:", error);
    }
}

function updateDashboard(data) {
    if (data.pm25 !== undefined) {
        const val = data.pm25;
        document.getElementById('pm25-value').textContent = val;
        
        const card = document.getElementById('card-pm25');
        const status = document.getElementById('pm25-status');
        
        card.className = 'card'; // Reset classes
        if (val <= 12) {
            card.classList.add('aqi-good');
            status.textContent = 'Buena';
        } else if (val <= 35.4) {
            card.classList.add('aqi-moderate');
            status.textContent = 'Moderada';
        } else {
            card.classList.add('aqi-bad');
            status.textContent = 'Dañina';
        }
    }
    
    if (data.voc !== undefined) {
        const val = data.voc;
        document.getElementById('voc-value').textContent = val;
        
        const card = document.getElementById('card-voc');
        const status = document.getElementById('voc-status');
        
        card.className = 'card';
        if (val <= 0.3) {
            card.classList.add('aqi-good');
            status.textContent = 'Bajo';
        } else if (val <= 1.0) {
            card.classList.add('aqi-moderate');
            status.textContent = 'Medio';
        } else {
            card.classList.add('aqi-bad');
            status.textContent = 'Alto';
        }
    }
    
    if (data.temperatura !== undefined) {
        document.getElementById('temp-value').textContent = data.temperatura;
        // La temperatura generalmente no usa AQI, solo la mostraremos
    }
}

function updateChart(data) {
    if (!airChart) return;
    
    const now = new Date();
    const timeLabel = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0') + ':' + now.getSeconds().toString().padStart(2, '0');
    
    chartData.labels.push(timeLabel);
    chartData.pm25.push(data.pm25);
    chartData.voc.push(data.voc * 10); // Escalar VOC para que se vea en la gráfica junto a PM2.5 (opcional)

    // Mantener solo los últimos 10 puntos en la gráfica
    if (chartData.labels.length > 10) {
        chartData.labels.shift();
        chartData.pm25.shift();
        chartData.voc.shift();
    }
    
    airChart.update();
}
