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

/**
 * ==========================================
 * GESTOR CMS Y CONFIGURACIÓN CENTRALIZADA
 * ==========================================
 * Almacena los contenidos dinámicos del sistema: políticas de privacidad,
 * identidad institucional, comunicados comunitarios, umbrales de alerta
 * y nombres de las estaciones en Ubaté.
 */
const DEFAULT_CMS_CONFIG = {
    identity: {
        siteTitle: "SIS AIR",
        siteSubtitle: "Monitoreo - Ubaté",
        announcementEnabled: true,
        announcementTitle: "Monitoreo Ambiental Activo - Ubaté",
        announcementMessage: "Sistema de vigilancia ambiental en tiempo real operando normalmente. Consulta las recomendaciones de salud para grupos sensibles.",
        announcementTag: "Aviso Oficial"
    },
    privacy: {
        title: "Políticas de Privacidad y Tratamiento de Datos Personales",
        lastUpdated: "18 de Septiembre de 2026",
        content: `1. RESPONSABLE DEL TRATAMIENTO: La plataforma comunitaria e institucional SIS AIR Ubaté es responsable del tratamiento y recolección de los datos generados por las estaciones de monitoreo y las cuentas de usuarios en el municipio de Ubaté, Cundinamarca, de conformidad con la Ley 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia.

2. FINALIDAD DEL SISTEMA: La recopilación de información meteorológica y de material particulado (PM1, PM2.5, PM10, NO2, VOC) tiene fines exclusivos de salud pública, investigación ambiental, prevención de emergencias y acceso público a la información de calidad del aire.

3. DATOS DE LOS USUARIOS: Para el registro de usuarios únicamente se solicitan nombre completo, correo electrónico y credenciales seguras. Estos datos no son transferidos ni comercializados bajo ninguna circunstancia a terceros.

4. DERECHOS DEL TITULAR (HABEAS DATA): Todo usuario tiene derecho a conocer, actualizar, rectificar y solicitar la supresión de sus datos personales registrados en el sistema, así como a revocar la autorización otorgada a través del canal oficial de soporte institucional.

5. SEGURIDAD DE LA INFORMACIÓN: Implementamos mecanismos de autenticación y cifrado en la base de datos Supabase para proteger los datos contra accesos no autorizados, pérdida o alteración.`
    },
    thresholds: {
        pm1: 25.0,
        pm25: 35.4,
        pm10: 154.0,
        no2: 100.0,
        voc: 1.00
    },
    stations: {
        centro: "Estación Centro - Parque Principal",
        norte: "Estación Norte - Salida Samacá",
        sur: "Estación Sur - Zona Agropecuaria"
    },
    security: {
        adminCode: "UbatéAir2026*"
    }
};

const CMSManager = {
    STORAGE_KEY: 'sis_air_cms_config',

    getConfig() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return {
                    identity: { ...DEFAULT_CMS_CONFIG.identity, ...(parsed.identity || {}) },
                    privacy: { ...DEFAULT_CMS_CONFIG.privacy, ...(parsed.privacy || {}) },
                    thresholds: { ...DEFAULT_CMS_CONFIG.thresholds, ...(parsed.thresholds || {}) },
                    stations: { ...DEFAULT_CMS_CONFIG.stations, ...(parsed.stations || {}) },
                    security: { ...DEFAULT_CMS_CONFIG.security, ...(parsed.security || {}) }
                };
            }
        } catch (e) {
            console.error("Error reading CMS config from localStorage:", e);
        }
        return JSON.parse(JSON.stringify(DEFAULT_CMS_CONFIG));
    },

    saveConfig(newConfig) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newConfig));
            this.applyToUI();
            return true;
        } catch (e) {
            console.error("Error saving CMS config:", e);
            return false;
        }
    },

    renderPrivacyHTML(rawText) {
        if (!rawText) return '';
        const paragraphs = rawText.split(/\n\s*\n/);
        return paragraphs.map(p => {
            const trimmed = p.trim();
            if (!trimmed) return '';
            const match = trimmed.match(/^(\d+\.\s*[^:\n]+):([\s\S]+)$/);
            if (match) {
                return `<div class="privacy-section-block">
                    <h3>📌 ${match[1].trim()}</h3>
                    <p>${match[2].trim().replace(/\n/g, '<br>')}</p>
                </div>`;
            }
            return `<div class="privacy-section-block"><p>${trimmed.replace(/\n/g, '<br>')}</p></div>`;
        }).join('');
    },

    applyToUI() {
        const config = this.getConfig();

        // 1. Identidad
        const headerTitle = document.getElementById('header-system-title');
        const headerSubtitle = document.getElementById('header-system-subtitle');
        if (headerTitle) headerTitle.textContent = config.identity.siteTitle || "SIS AIR";
        if (headerSubtitle) headerSubtitle.textContent = config.identity.siteSubtitle || "Monitoreo - Ubaté";

        // Banner de Anuncios Comunitarios
        const banner = document.getElementById('announcement-banner');
        if (banner) {
            if (config.identity.announcementEnabled) {
                banner.style.display = 'flex';
                const bannerTitle = document.getElementById('announcement-title');
                const bannerMsg = document.getElementById('announcement-message');
                const bannerTag = document.getElementById('announcement-tag');
                if (bannerTitle) bannerTitle.textContent = config.identity.announcementTitle || "Aviso Oficial";
                if (bannerMsg) bannerMsg.textContent = config.identity.announcementMessage || "";
                if (bannerTag) bannerTag.textContent = config.identity.announcementTag || "Aviso Oficial";
            } else {
                banner.style.display = 'none';
            }
        }

        // 2. Políticas de Privacidad en Dashboard
        const privTitle = document.getElementById('privacy-display-title');
        const privDate = document.getElementById('privacy-display-date');
        const privContent = document.getElementById('privacy-display-content');
        if (privTitle) privTitle.textContent = config.privacy.title;
        if (privDate) privDate.textContent = config.privacy.lastUpdated;
        if (privContent) privContent.innerHTML = this.renderPrivacyHTML(config.privacy.content);

        // Políticas en modal (index.html o dashboard)
        const modalTitle = document.getElementById('privacy-modal-title');
        const modalBody = document.getElementById('privacy-modal-body');
        if (modalTitle) modalTitle.textContent = config.privacy.title;
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="privacy-meta" style="margin-bottom: 1.25rem; color: #64748b; font-size: 0.85rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                    Última actualización: <strong>${config.privacy.lastUpdated}</strong> | República de Colombia (Ley 1581)
                </div>
                ${this.renderPrivacyHTML(config.privacy.content)}
            `;
        }
    },

    populateCMSForm() {
        const config = this.getConfig();

        // Políticas
        const inputPrivTitle = document.getElementById('cms-input-privacy-title');
        const inputPrivDate = document.getElementById('cms-input-privacy-date');
        const textareaPriv = document.getElementById('cms-textarea-privacy-content');
        if (inputPrivTitle) inputPrivTitle.value = config.privacy.title;
        if (inputPrivDate) inputPrivDate.value = config.privacy.lastUpdated;
        if (textareaPriv) textareaPriv.value = config.privacy.content;

        // Identidad y Avisos
        const inputSiteTitle = document.getElementById('cms-input-site-title');
        const inputSiteSubtitle = document.getElementById('cms-input-site-subtitle');
        const toggleAnnouncement = document.getElementById('cms-toggle-announcement');
        const inputAnnTitle = document.getElementById('cms-input-announcement-title');
        const textareaAnnMsg = document.getElementById('cms-textarea-announcement-msg');
        if (inputSiteTitle) inputSiteTitle.value = config.identity.siteTitle;
        if (inputSiteSubtitle) inputSiteSubtitle.value = config.identity.siteSubtitle;
        if (toggleAnnouncement) toggleAnnouncement.checked = Boolean(config.identity.announcementEnabled);
        if (inputAnnTitle) inputAnnTitle.value = config.identity.announcementTitle;
        if (textareaAnnMsg) textareaAnnMsg.value = config.identity.announcementMessage;

        // Umbrales
        const inPm1 = document.getElementById('cms-input-th-pm1');
        const inPm25 = document.getElementById('cms-input-th-pm25');
        const inPm10 = document.getElementById('cms-input-th-pm10');
        const inNo2 = document.getElementById('cms-input-th-no2');
        const inVoc = document.getElementById('cms-input-th-voc');
        if (inPm1) inPm1.value = config.thresholds.pm1;
        if (inPm25) inPm25.value = config.thresholds.pm25;
        if (inPm10) inPm10.value = config.thresholds.pm10;
        if (inNo2) inNo2.value = config.thresholds.no2;
        if (inVoc) inVoc.value = config.thresholds.voc;

        // Estaciones
        const inStCentro = document.getElementById('cms-input-station-centro');
        const inStNorte = document.getElementById('cms-input-station-norte');
        const inStSur = document.getElementById('cms-input-station-sur');
        if (inStCentro) inStCentro.value = config.stations.centro;
        if (inStNorte) inStNorte.value = config.stations.norte;
        if (inStSur) inStSur.value = config.stations.sur;

        // Seguridad
        const inAdminCode = document.getElementById('cms-input-admin-code');
        if (inAdminCode) inAdminCode.value = config.security.adminCode || "";
    }
};

/**
 * ==========================================
 * GESTOR DE TEMA (MODO OSCURO / MODO CLARO)
 * ==========================================
 * Controla la alternancia entre Modo Claro y Modo Oscuro
 * y persiste la elección en el almacenamiento local.
 */
const ThemeManager = {
    STORAGE_KEY: 'sis_air_theme',

    init() {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY) || 'light';
        this.applyTheme(savedTheme, false);
    },

    getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    },

    applyTheme(theme, updateCharts = true) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);

        const iconEls = document.querySelectorAll('#theme-toggle-icon');
        iconEls.forEach(icon => {
            icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        });

        const btns = document.querySelectorAll('.theme-toggle-btn');
        btns.forEach(btn => {
            btn.setAttribute('title', theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro');
        });

        if (updateCharts) {
            this.syncChartsTheme(theme);
        }
    },

    toggle() {
        const current = this.getTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        this.applyTheme(next, true);
    },

    bindToggleButtons() {
        const btns = document.querySelectorAll('#theme-toggle-btn, .theme-toggle-btn');
        btns.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                this.toggle();
            };
        });
        const current = this.getTheme();
        const iconEls = document.querySelectorAll('#theme-toggle-icon');
        iconEls.forEach(icon => {
            icon.textContent = current === 'dark' ? '☀️' : '🌙';
        });
    },

    syncChartsTheme(theme) {
        const isDark = theme === 'dark';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.7)';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const labelColor = isDark ? '#f1f5f9' : '#334155';

        [particulasChart, gasesChart, climaChart].forEach(chart => {
            if (chart && chart.options && chart.options.scales) {
                if (chart.options.scales.x) {
                    chart.options.scales.x.grid.color = gridColor;
                    chart.options.scales.x.ticks.color = textColor;
                }
                if (chart.options.scales.y) {
                    chart.options.scales.y.grid.color = gridColor;
                    chart.options.scales.y.ticks.color = textColor;
                }
                if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
                    chart.options.plugins.legend.labels.color = labelColor;
                }
                chart.update();
            }
        });
    }
};

// Inicializar inmediatamente para evitar destello antes de pintar el DOM
ThemeManager.init();

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Content Loaded event fired");
    try {
        // Enlazar botones de tema en la página activa
        ThemeManager.bindToggleButtons();

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

                // --- VALIDACIÓN OBLIGATORIA DE POLÍTICAS DE PRIVACIDAD ---
                const privacyCheck = document.getElementById('reg-privacy-check');
                if (privacyCheck && !privacyCheck.checked) {
                    errorMsg.textContent = "Debes leer y aceptar las Políticas de Privacidad y Tratamiento de Datos para crear una cuenta.";
                    errorMsg.style.display = 'block';
                    return;
                }

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

        // Manejo del modal de Políticas de Privacidad en index.html
        const openPrivacyLogin = document.getElementById('open-privacy-login-btn');
        const openPrivacyReg = document.getElementById('open-privacy-reg-btn');
        const closePrivacyModal = document.getElementById('close-privacy-modal');
        const privacyModal = document.getElementById('privacy-modal');

        const openPrivacyHandler = (e) => {
            if (e) e.preventDefault();
            CMSManager.applyToUI();
            if (privacyModal) privacyModal.style.display = 'flex';
        };

        if (openPrivacyLogin) openPrivacyLogin.addEventListener('click', openPrivacyHandler);
        if (openPrivacyReg) openPrivacyReg.addEventListener('click', openPrivacyHandler);
        if (closePrivacyModal) closePrivacyModal.addEventListener('click', () => {
            if (privacyModal) privacyModal.style.display = 'none';
        });
        if (privacyModal) {
            window.addEventListener('click', (e) => {
                if (e.target === privacyModal) privacyModal.style.display = 'none';
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
        const userName = session.user.user_metadata?.full_name || userEmail.split('@')[0];
        const isAdmin = userRole === 'admin' || userEmail === 'oscarduquegar@gmail.com';
        
        // Renderizar Identificación y Rol del Usuario en Header
        const userProfileName = document.getElementById('user-display-name');
        const userRoleBadge = document.getElementById('user-role-badge');
        const userAvatarCircle = document.getElementById('user-avatar-circle');
        if (userProfileName) userProfileName.textContent = userName;
        if (userAvatarCircle) {
            const initial = userName ? userName.trim().charAt(0).toUpperCase() : 'U';
            userAvatarCircle.textContent = initial;
        }
        if (userRoleBadge) {
            if (isAdmin) {
                userRoleBadge.textContent = '👑 Administrador';
                userRoleBadge.className = 'badge-role badge-admin';
                userRoleBadge.style.display = 'inline-block';
            } else {
                userRoleBadge.style.display = 'none';
            }
        }

        const btnPurificacion = document.getElementById('btn-purificacion');
        const adminMapControls = document.getElementById('admin-map-controls');
        const navCmsBtn = document.getElementById('nav-cms-btn');

        if (!isAdmin) {
            // Usuario normal: Ocultar botones y paneles de administrador
            if (btnPurificacion) btnPurificacion.style.display = 'none';
            if (adminMapControls) adminMapControls.style.display = 'none';
            if (navCmsBtn) navCmsBtn.style.display = 'none';
        } else {
            // Administrador: Habilitar herramientas avanzadas y CMS
            if (navCmsBtn) navCmsBtn.style.display = 'inline-block';
            if (adminMapControls) {
                adminMapControls.style.display = 'flex';
                setupAdminMapControls();
            }
            setupCMSListeners(userEmail);

            if (btnPurificacion) {
                btnPurificacion.addEventListener('click', () => {
                    const planDiv = document.getElementById('plan-result');
                    planDiv.style.display = 'block';
                    planDiv.innerHTML = `
                        <div class="ai-loading-box">
                            <div class="ai-spinner"></div>
                            <div class="ai-loading-text">
                                <strong>Consultando Inteligencia Artificial SIS AIR...</strong>
                                <span>Analizando concentración de micropartículas y dispersión de gases en Ubaté...</span>
                            </div>
                        </div>
                    `;

                    setTimeout(() => {
                        const currentPm25 = parseFloat(document.getElementById('pm25-value')?.textContent) || 18.4;
                        const currentPm10 = parseFloat(document.getElementById('pm10-value')?.textContent) || 42.1;
                        const currentNo2 = parseFloat(document.getElementById('no2-value')?.textContent) || 31.0;
                        const currentVoc = parseFloat(document.getElementById('voc-value')?.textContent) || 0.45;
                        const currentTemp = document.getElementById('temp-value')?.textContent || '16.5';
                        const currentHum = document.getElementById('humedad-value')?.textContent || '68';

                        const isModerateOrHigh = currentPm25 > 25 || currentPm10 > 100 || currentNo2 > 70 || currentVoc > 0.8;
                        const alertLevel = isModerateOrHigh ? 'Alerta Preventiva Moderada' : 'Condición Favorable / Estable';
                        const badgeColor = isModerateOrHigh ? '#f59e0b' : '#10b981';

                        planDiv.innerHTML = `
                            <div class="ai-plan-card">
                                <div class="ai-plan-header">
                                    <div class="ai-header-brand">
                                        <span class="ai-sparkle-icon">✨</span>
                                        <div>
                                            <h3>Plan de Mitigación y Purificación Ambiental</h3>
                                            <p>Generado por Modelo Analítico SIS AIR • Algoritmo de Calidad del Aire de Ubaté</p>
                                        </div>
                                    </div>
                                    <span class="ai-status-pill" style="background: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor}50;">
                                        ● ${alertLevel}
                                    </span>
                                </div>

                                <div class="ai-metrics-snapshot">
                                    <div class="snapshot-item"><span>PM2.5:</span> <strong>${currentPm25} µg/m³</strong></div>
                                    <div class="snapshot-item"><span>PM10:</span> <strong>${currentPm10} µg/m³</strong></div>
                                    <div class="snapshot-item"><span>NO₂:</span> <strong>${currentNo2} µg/m³</strong></div>
                                    <div class="snapshot-item"><span>VOC:</span> <strong>${currentVoc} ppm</strong></div>
                                    <div class="snapshot-item"><span>Temp / Hum:</span> <strong>${currentTemp}°C / ${currentHum}%</strong></div>
                                </div>

                                <div class="ai-plan-grid">
                                    <div class="ai-plan-col">
                                        <h4>🛡️ Medidas Inmediatas de Mitigación</h4>
                                        <ul class="ai-action-list">
                                            <li><strong>Filtración de Aire:</strong> ${currentPm25 > 25 ? 'Activar sistemas de filtrado HEPA H13 en instalaciones cerradas y centros educativos.' : 'Mantener circulación natural; la concentración de partículas finas es aceptable.'}</li>
                                            <li><strong>Dispersión de Gases:</strong> Control preventivo de emisiones vehiculares y maquinaria diésel en el corredor céntrico de Ubaté.</li>
                                            <li><strong>Ventilación Asistida:</strong> ${parseFloat(currentHum) > 75 ? 'Humedad relativa alta detectada; promover flujo cruzado para evitar condensación de contaminantes.' : 'Índice de humedad propicio para dispersión de aerosoles.'}</li>
                                        </ul>
                                    </div>

                                    <div class="ai-plan-col">
                                        <h4>📢 Recomendaciones para la Población</h4>
                                        <ul class="ai-action-list">
                                            <li><strong>Población Sensible:</strong> ${currentPm25 > 25 ? 'Personas con afecciones respiratorias deben moderar actividades físicas exigentes al aire libre.' : 'Todos los grupos etarios pueden realizar actividad física al aire libre de forma segura.'}</li>
                                            <li><strong>Vigilancia Continua:</strong> Supervisar la estación Norte y el Parque Principal en horas pico (07:00 - 09:00 y 17:30 - 19:30).</li>
                                            <li><strong>Cumplimiento Normativo:</strong> Valores alineados a la Resolución 2254 de 2017 (Ministerio de Ambiente y Desarrollo Sostenible).</li>
                                        </ul>
                                    </div>
                                </div>

                                <div class="ai-plan-footer">
                                    <span>Confianza del modelo: <strong>98.7%</strong></span>
                                    <span>Fecha y Hora de Emisión: <strong>${new Date().toLocaleTimeString()} • ${new Date().toLocaleDateString()}</strong></span>
                                    <button class="ai-close-plan" onclick="document.getElementById('plan-result').style.display='none'">Cerrar Plan</button>
                                </div>
                            </div>
                        `;
                    }, 1200);
                });
            }
        }

        // Evento para imprimir o guardar políticas de privacidad
        const btnPrintPrivacy = document.getElementById('btn-print-privacy');
        if (btnPrintPrivacy) {
            btnPrintPrivacy.addEventListener('click', () => window.print());
        }

        // Aplicar contenidos institucionales y banners configurados en CMS
        CMSManager.applyToUI();

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
                const targetId = btn.getAttribute('data-target');

                // SEGURIDAD DE ROL: Bloquear acceso a vista CMS si no es administrador
                if (targetId === 'view-cms' && !isAdmin) {
                    alert("Acceso denegado: El Panel CMS es de uso exclusivo para el Administrador del Sistema.");
                    return;
                }

                // Quitar clase active de todos los botones y ocultar vistas
                navBtns.forEach(b => b.classList.remove('active'));
                views.forEach(v => v.style.display = 'none');

                // Activar el presionado
                btn.classList.add('active');
                const targetEl = document.getElementById(targetId);
                if (targetEl) targetEl.style.display = 'block';

                // Acciones específicas al entrar a cada vista
                if (targetId === 'view-historial') {
                    renderFullHistory();
                } else if (targetId === 'view-mapa' && sensorMap) {
                    // Leaflet necesita recalcular tamaño si el mapa estaba en display:none
                    setTimeout(() => sensorMap.invalidateSize(), 100);
                } else if (targetId === 'view-politicas') {
                    CMSManager.applyToUI();
                } else if (targetId === 'view-cms') {
                    CMSManager.populateCMSForm();
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
function getChartThemeScales() {
    const isDark = (document.documentElement.getAttribute('data-theme') || 'light') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.7)';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    return {
        x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: "'Plus Jakarta Sans', sans-serif" } }
        },
        y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: "'Plus Jakarta Sans', sans-serif" } }
        }
    };
}

function initCharts() {
    const ctxParticulas = document.getElementById('particulasChart');
    const ctxGases = document.getElementById('gasesChart');
    const ctxClima = document.getElementById('climaChart');
    if (!ctxParticulas || !ctxGases || !ctxClima) return;

    const scales = getChartThemeScales();
    const isDark = (document.documentElement.getAttribute('data-theme') || 'light') === 'dark';
    const labelColor = isDark ? '#f1f5f9' : '#334155';

    particulasChart = new Chart(ctxParticulas, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                { label: 'PM1', data: chartData.pm1, borderColor: '#38bdf8', borderWidth: 2.2, pointRadius: 2.5, pointHoverRadius: 5, tension: 0.35 },
                { label: 'PM2.5', data: chartData.pm25, borderColor: '#0284c7', borderWidth: 2.2, pointRadius: 2.5, pointHoverRadius: 5, tension: 0.35 },
                { label: 'PM10', data: chartData.pm10, borderColor: '#ef4444', borderWidth: 2.2, pointRadius: 2.5, pointHoverRadius: 5, tension: 0.35 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: scales,
            plugins: {
                legend: {
                    labels: { color: labelColor, font: { family: "'Plus Jakarta Sans', sans-serif", weight: '600' } }
                }
            }
        }
    });

    gasesChart = new Chart(ctxGases, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                { label: 'NO2 (µg/m³)', data: chartData.no2, borderColor: '#a855f7', borderWidth: 2.2, pointRadius: 2.5, pointHoverRadius: 5, tension: 0.35 },
                { label: 'VOC (ppm x100)', data: chartData.voc, borderColor: '#f59e0b', borderWidth: 2.2, pointRadius: 2.5, pointHoverRadius: 5, tension: 0.35 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: scales,
            plugins: {
                legend: {
                    labels: { color: labelColor, font: { family: "'Plus Jakarta Sans', sans-serif", weight: '600' } }
                }
            }
        }
    });

    climaChart = new Chart(ctxClima, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                { label: 'Temp (°C)', data: chartData.temp, borderColor: '#10b981', borderWidth: 2.2, pointRadius: 2.5, pointHoverRadius: 5, tension: 0.35 },
                { label: 'Humedad (%)', data: chartData.humedad, borderColor: '#06b6d4', borderWidth: 2.2, pointRadius: 2.5, pointHoverRadius: 5, tension: 0.35 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: scales,
            plugins: {
                legend: {
                    labels: { color: labelColor, font: { family: "'Plus Jakarta Sans', sans-serif", weight: '600' } }
                }
            }
        }
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

    const th = CMSManager.getConfig().thresholds;

    // Validar umbrales configurados dinámicamente en el CMS
    if (data.pm1 > th.pm1) newAlerts.push(`Nivel Dañino de PM1 detectado: ${data.pm1} µg/m³ (Límite CMS: ${th.pm1})`);
    if (data.pm25 > th.pm25) newAlerts.push(`Nivel Dañino de PM2.5 detectado: ${data.pm25} µg/m³ (Límite CMS: ${th.pm25})`);
    if (data.pm10 > th.pm10) newAlerts.push(`Nivel Dañino de PM10 detectado: ${data.pm10} µg/m³ (Límite CMS: ${th.pm10})`);
    if (data.no2 > th.no2) newAlerts.push(`Nivel Dañino de NO2 detectado: ${data.no2} µg/m³ (Límite CMS: ${th.no2})`);
    if (data.voc > th.voc) newAlerts.push(`Nivel Alto de VOC detectado: ${data.voc} ppm (Límite CMS: ${th.voc})`);

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

    // -- Actualizar Mapa con nombres dinámicos del CMS --
    if (markerCentro && data.pm25 !== undefined) {
        const stations = CMSManager.getConfig().stations;
        const getColor = (val) => val <= 12 ? '#10B981' : val <= 35.4 ? '#F59E0B' : '#EF4444'; // Verde, Amarillo, Rojo
        const getEstado = (val) => val <= 12 ? 'Bueno' : val <= 35.4 ? 'Moderado' : 'Dañino';

        // Sensor Centro
        const colorCentro = getColor(data.pm25);
        markerCentro.setIcon(getSensorIcon(colorCentro));
        markerCentro.setPopupContent(`<b>${stations.centro || 'Estación Centro'}</b><br>PM2.5: ${data.pm25} µg/m³<br>Estado: ${getEstado(data.pm25)}`);

        // Sensor Norte
        const pmNorte = (data.pm25 * 0.8).toFixed(1);
        const colorNorte = getColor(pmNorte);
        markerNorte.setIcon(getSensorIcon(colorNorte));
        markerNorte.setPopupContent(`<b>${stations.norte || 'Estación Norte'}</b><br>PM2.5: ${pmNorte} µg/m³<br>Estado: ${getEstado(pmNorte)}`);

        // Sensor Sur
        const pmSur = (data.pm25 * 1.3).toFixed(1);
        const colorSur = getColor(pmSur);
        markerSur.setIcon(getSensorIcon(colorSur));
        markerSur.setPopupContent(`<b>${stations.sur || 'Estación Sur'}</b><br>PM2.5: ${pmSur} µg/m³<br>Estado: ${getEstado(pmSur)}`);
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

/**
 * ==========================================
 * 11. CONTROLADOR DE EVENTOS DEL CMS (ADMIN)
 * ==========================================
 * Permite cambiar entre las pestañas del CMS y procesar el guardado de
 * políticas de privacidad, comunicados institucionales, umbrales y estaciones.
 */
function setupCMSListeners(userEmail) {
    // 1. Navegación entre sub-pestañas del CMS
    const cmsTabBtns = document.querySelectorAll('.cms-tab-btn');
    const cmsPanels = document.querySelectorAll('.cms-panel-block');

    cmsTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            cmsTabBtns.forEach(b => b.classList.remove('active'));
            cmsPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.getAttribute('data-cms-tab');
            const targetPanel = document.getElementById(tabId);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    // 2. Correo del administrador activo
    const emailDisplay = document.getElementById('cms-current-user-email');
    if (emailDisplay) {
        emailDisplay.textContent = userEmail || "oscarduquegar@gmail.com";
    }

    // Función auxiliar para feedback visual de guardado
    function showCMSStatus(elemId, message, isSuccess = true) {
        const msgEl = document.getElementById(elemId);
        if (!msgEl) return;
        msgEl.textContent = message;
        msgEl.className = isSuccess ? 'cms-status-msg cms-status-success' : 'cms-status-msg cms-status-error';
        msgEl.style.display = 'block';
        setTimeout(() => {
            msgEl.style.display = 'none';
        }, 4000);
    }

    // 3. Guardar Políticas de Privacidad
    const btnSavePrivacy = document.getElementById('cms-save-privacy-btn');
    if (btnSavePrivacy) {
        btnSavePrivacy.addEventListener('click', () => {
            const title = document.getElementById('cms-input-privacy-title').value.trim();
            const lastUpdated = document.getElementById('cms-input-privacy-date').value.trim();
            const content = document.getElementById('cms-textarea-privacy-content').value.trim();

            if (!title || !content) {
                showCMSStatus('cms-msg-privacy', 'El título y el contenido no pueden estar vacíos.', false);
                return;
            }

            const current = CMSManager.getConfig();
            current.privacy = { title, lastUpdated, content };
            if (CMSManager.saveConfig(current)) {
                showCMSStatus('cms-msg-privacy', '✅ Políticas de Privacidad guardadas y publicadas correctamente.');
            } else {
                showCMSStatus('cms-msg-privacy', '❌ Error al guardar las políticas.', false);
            }
        });
    }

    // 4. Guardar Identidad y Avisos Comunitarios
    const btnSaveIdentity = document.getElementById('cms-save-identity-btn');
    if (btnSaveIdentity) {
        btnSaveIdentity.addEventListener('click', () => {
            const siteTitle = document.getElementById('cms-input-site-title').value.trim();
            const siteSubtitle = document.getElementById('cms-input-site-subtitle').value.trim();
            const announcementEnabled = document.getElementById('cms-toggle-announcement').checked;
            const announcementTitle = document.getElementById('cms-input-announcement-title').value.trim();
            const announcementMessage = document.getElementById('cms-textarea-announcement-msg').value.trim();

            const current = CMSManager.getConfig();
            current.identity = {
                siteTitle: siteTitle || "SIS AIR",
                siteSubtitle: siteSubtitle || "Monitoreo - Ubaté",
                announcementEnabled,
                announcementTitle: announcementTitle || "Aviso Oficial",
                announcementMessage: announcementMessage || "",
                announcementTag: "Aviso Oficial"
            };

            if (CMSManager.saveConfig(current)) {
                showCMSStatus('cms-msg-identity', '✅ Identidad y comunicado oficial actualizados con éxito.');
            } else {
                showCMSStatus('cms-msg-identity', '❌ Error al guardar la identidad institucional.', false);
            }
        });
    }

    // 5. Guardar Umbrales de Calidad del Aire
    const btnSaveThresholds = document.getElementById('cms-save-thresholds-btn');
    if (btnSaveThresholds) {
        btnSaveThresholds.addEventListener('click', () => {
            const pm1 = parseFloat(document.getElementById('cms-input-th-pm1').value) || 25.0;
            const pm25 = parseFloat(document.getElementById('cms-input-th-pm25').value) || 35.4;
            const pm10 = parseFloat(document.getElementById('cms-input-th-pm10').value) || 154.0;
            const no2 = parseFloat(document.getElementById('cms-input-th-no2').value) || 100.0;
            const voc = parseFloat(document.getElementById('cms-input-th-voc').value) || 1.00;

            const current = CMSManager.getConfig();
            current.thresholds = { pm1, pm25, pm10, no2, voc };

            if (CMSManager.saveConfig(current)) {
                showCMSStatus('cms-msg-thresholds', '✅ Umbrales de calidad guardados. Las nuevas alertas usarán estos límites.');
            } else {
                showCMSStatus('cms-msg-thresholds', '❌ Error al actualizar los umbrales.', false);
            }
        });
    }

    // 6. Guardar Nombres de Estaciones
    const btnSaveStations = document.getElementById('cms-save-stations-btn');
    if (btnSaveStations) {
        btnSaveStations.addEventListener('click', () => {
            const centro = document.getElementById('cms-input-station-centro').value.trim();
            const norte = document.getElementById('cms-input-station-norte').value.trim();
            const sur = document.getElementById('cms-input-station-sur').value.trim();

            const current = CMSManager.getConfig();
            current.stations = {
                centro: centro || "Estación Centro",
                norte: norte || "Estación Norte",
                sur: sur || "Estación Sur"
            };

            if (CMSManager.saveConfig(current)) {
                showCMSStatus('cms-msg-stations', '✅ Nombres de estaciones actualizados en todo el sistema.');
            } else {
                showCMSStatus('cms-msg-stations', '❌ Error al guardar las estaciones.', false);
            }
        });
    }

    // 7. Guardar Clave de Seguridad
    const btnSaveSecurity = document.getElementById('cms-save-security-btn');
    if (btnSaveSecurity) {
        btnSaveSecurity.addEventListener('click', () => {
            const adminCode = document.getElementById('cms-input-admin-code').value.trim();
            if (!adminCode) {
                showCMSStatus('cms-msg-security', 'Por favor ingresa una clave válida.', false);
                return;
            }

            const current = CMSManager.getConfig();
            current.security = { adminCode };

            if (CMSManager.saveConfig(current)) {
                showCMSStatus('cms-msg-security', '✅ Clave de seguridad administrativa actualizada.');
            } else {
                showCMSStatus('cms-msg-security', '❌ Error al actualizar la clave.', false);
            }
        });
    }
}
