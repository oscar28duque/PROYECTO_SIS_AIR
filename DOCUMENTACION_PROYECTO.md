# 🍃 SIS AIR - Sistema de Monitoreo de Calidad del Aire (Ubaté)

Documentación exhaustiva y técnica del proyecto **SIS AIR**, una plataforma web para la monitorización ambiental, telemetría de contaminantes en tiempo real, geolocalización de estaciones, alertas automáticas y administración comunitaria en el municipio de **Ubaté, Cundinamarca (Colombia)**.

---

## 📌 1. Visión General del Proyecto

**SIS AIR** es una solución integral diseñada para medir, registrar, analizar y visualizar parámetros críticos de calidad del aire y meteorología. Su objetivo es proporcionar a la ciudadanía, investigadores y autoridades municipales herramientas para la toma de decisiones basada en datos, alertas preventivas de salud pública y planes de mitigación ambiental acordes a la normativa colombiana (**Resolución 2254 de 2017** del Ministerio de Ambiente y Ley de Protección de Datos **Ley 1581 de 2012**).

### Principales Objetivos:
- **Monitoreo en tiempo real**: Registro de material particulado (**PM1, PM2.5, PM10**), gases nocivos (**NO₂, VOC**) y variables climáticas (**Temperatura, Humedad, Presión Barométrica** a 2550 msnm).
- **Semáforo y Alertas AQI**: Detección automática de superación de límites permisibles con notificaciones visuales inmediatas.
- **Geolocalización Interactiva**: Mapa de estaciones de monitoreo distribuidas en zonas clave de Ubaté (Centro, Norte y Sur).
- **Inteligencia y Mitigación**: Generación de planes asistidos de mitigación y recomendaciones poblacionales personalizadas según la severidad ambiental.
- **Informes Ejecutivos**: Descarga de reportes técnicos auditables en formato **PDF** con historial y registros de incidentes.
- **Gestor de Contenido (CMS) Administrativo**: Panel exclusivo para administradores donde se configuran textos legales, comunicados a la comunidad, umbrales de alerta y ubicación de sensores.
- **Accesibilidad y UX**: Soporte completo para **Modo Oscuro / Modo Claro** con persistencia y diseño responsivo adaptado a dispositivos móviles y de escritorio.

---

## 📂 2. Estructura del Repositorio y Contenido de Archivos

A continuación se detalla la estructura física del proyecto y la responsabilidad de cada archivo:

```plaintext
PROYECTO_SIS_AIR/
│
├── backend/
│   ├── functions/
│   │   ├── analizar.js          # Función Serverless: telemetría ambiental, ICA y estado de nodo
│   │   └── predecir.js          # Función Serverless: inferencia ML y pronóstico a t+1h y t+6h
│   ├── ica_colombia.js          # Motor matemático oficial del ICA (Resolución 2254 de 2017)
│   ├── ml_model.js              # Modelo de ML multivariado, detección de anomalías y métricas
│   └── schema_supabase_rls.sql  # Esquema DDL relacional con RLS, triggers de auditoría y seeds
│
├── frontend/
│   ├── assets/
│   │   ├── logo.PNG             # Logotipo oficial para la cabecera del sistema
│   │   └── logo_inicio.PNG      # Logotipo de alta resolución para la pantalla de login
│   ├── app_v2.js                # Lógica SPA, ML, ICA, salud IoT, CSV, Stakeholders y RLS
│   ├── dashboard.html           # Interfaz SPA con pestañas (Dashboard, Alertas, Historial, Mapa, UAT, CMS)
│   ├── index.html               # Pantalla de acceso, registro y políticas legales
│   └── style.css                # Hoja de estilos con variables, modo oscuro/claro y semáforo AQI
│
├── tests/
│   ├── ica_resolucion2254.test.js # Suite de pruebas unitarias para el algoritmo de la Res. 2254
│   ├── ml_model.test.js         # Suite de pruebas unitarias para el motor de Machine Learning
│   ├── api_serverless.test.js   # Suite de pruebas de integración para las funciones serverless
│   └── stress_load_test.js      # Benchmark de carga y estrés concurrente (50 nodos IoT)
│
├── netlify.toml                 # Configuración de despliegue en Netlify y redirecciones de API
├── package.json                 # Metadatos del proyecto y scripts de prueba y cobertura
├── PLAN_CUMPLIMIENTO_CFV.md     # Documento técnico maestro de cumplimiento de rúbrica de 8vo semestre
└── DOCUMENTACION_PROYECTO.md    # Este documento explicativo
```

---

## 🔍 3. Detalle de Archivos y Componentes

### 3.1. Frontend

#### 📄 `frontend/index.html` (Portal de Acceso y Registro)
Es la puerta de entrada a la plataforma. Cuenta con:
- **Formulario de Inicio de Sesión**: Validación de credenciales conectada a Supabase Auth.
- **Formulario de Registro**: Captura de nombre completo, correo electrónico y contraseña. Aplica validaciones estrictas de seguridad (mínimo 8 caracteres, mayúscula, número y símbolo especial) y casilla obligatoria de aceptación de términos legales.
- **Modal de Políticas de Privacidad**: Permite leer las cláusulas oficiales del tratamiento de datos personales (Habeas Data) sin abandonar la pantalla.
- **Alternador de Tema**: Botón superior para alternar entre Modo Oscuro y Modo Claro.

#### 📄 `frontend/dashboard.html` (Panel Central de Control)
Organizado bajo un modelo de aplicación de una sola página (SPA) con navegación por pestañas:
1. **Pestaña Dashboard (📊)**:
   - **Banner de Comunicados Oficiales**: Anuncios comunitarios emitidos por la administración municipal.
   - **Tarjetas de Telemetría (8 métricas)**: PM1, PM2.5, PM10, NO₂, VOC, Temperatura, Humedad y Presión, con etiquetas y colores dinámicos según el estado AQI. Al hacer clic en cualquier tarjeta, se despliega un **modal emergente** con el historial de dicha métrica.
   - **Gráficas en Tiempo Real**: 3 lienzos que ilustran la evolución de partículas, gases y clima en intervalos de 10 segundos.
   - **Acciones Rápidas**: Botón para "Generar Plan de Purificación" (IA) y "Descargar Reporte PDF".
2. **Pestaña Alertas (⚠️)**:
   - Historial detallado de todas las notificaciones críticas o moderadas generadas durante la sesión activa.
3. **Pestaña Historial (📋)**:
   - Tabla completa con cada lectura recibida ordenada cronológicamente y botón directo de exportación a PDF.
4. **Pestaña Mapa (🗺️)**:
   - Visualización de las estaciones geográficas de Ubaté en OpenStreetMap mediante Leaflet.
   - Controles de edición para administradores que permiten mover los sensores sobre el mapa con *drag & drop* y guardar las coordenadas.
5. **Pestaña Políticas (📜)**:
   - Consulta pública e institucional de la política de protección de datos con botón directo de impresión o guardado a PDF.
6. **Pestaña Panel CMS (⚙️)** *(Solo visible para Administradores)*:
   - Menú lateral con 5 submódulos de gestión:
     - **Políticas de Privacidad**: Edición del título, fecha de vigencia y clausulado legal.
     - **Identidad y Avisos**: Personalización del título del sistema, subtítulo y activación del banner de comunicados oficiales.
     - **Umbrales de Calidad**: Ajuste de los valores límite para el disparo de alertas (PM1, PM2.5, PM10, NO₂, VOC).
     - **Estaciones de Monitoreo**: Renombrado de las estaciones en el mapa interactivo.
     - **Roles y Seguridad**: Visualización del perfil administrativo y cambio de clave maestra de seguridad.

#### 🎨 `frontend/style.css` (Diseño y Sistema de Estilos)
- **Variables CSS**: Centralizadas en `:root` para modo claro y `[data-theme="dark"]` para modo oscuro.
- **Paleta de Color Semántica**:
  - `aqi-good` (#10b981): Verde esmeralda (Condiciones óptimas).
  - `aqi-moderate` (#f59e0b): Ámbar (Alerta preventiva).
  - `aqi-bad` (#ef4444): Rojo coral (Condiciones dañinas).
- **Tipografía**: Importa fuentes modernas *Plus Jakarta Sans* e *Inter*.
- **Diseño Responsivo**: Reglas `@media` para pantallas ultra-anchas, tablets y teléfonos móviles.
- **Micro-interacciones**: Transiciones suaves, sombras de elevación (`--shadow-hover`), efecto pulsante en directo (`pulse-dot`) y ventanas modales centradas.

#### ⚙️ `frontend/app_v2.js` (Núcleo de Programación Frontend)
Desarrollado en JavaScript moderno (ES6+), dividido funcionalmente en los siguientes módulos:
- **`CMSManager`**: Gestor de configuración centralizado. Carga los valores por defecto (`DEFAULT_CMS_CONFIG`), lee y persiste cambios en `localStorage`, y actualiza dinámicamente títulos, avisos, umbrales y políticas en la interfaz.
- **`ThemeManager`**: Detecta, aplica y persiste la selección de modo claro/oscuro en `localStorage`, además de refrescar la paleta de colores de los gráficos de Chart.js (ejes, rejillas y leyendas).
- **Autenticación (Supabase Auth)**:
  - Verificación de sesión activa y protección de rutas (`dashboard.html` redirige a `index.html` si no hay sesión).
  - Registro de usuarios con asignación automática de rol (`admin` para el correo del administrador `oscarduquegar@gmail.com` y `user` para el resto).
  - Cierre de sesión seguro con `signOut()`.
- **Telemetría y Fetch en Tiempo Real**:
  - Función `fetchData()` ejecutada cada 10 segundos contra `/api/analizar`.
  - Alimentación de los buffers de datos de gráficas en memoria (`chartData`).
- **Sistema de Gráficas (Chart.js)**:
  - 3 gráficos en tiempo real: Partículas (`particulasChart`), Gases (`gasesChart`) y Clima (`climaChart`).
- **Georreferenciación (Leaflet)**:
  - Instanciación del mapa centrado en Ubaté (`[5.3086, -73.8144]`).
  - Marcadores dinámicos para Estación Centro, Estación Norte y Estación Sur cuyo color de icono cambia según el nivel de contaminación.
  - Modo arrastre y guardado en `localStorage` mediante `setupAdminMapControls()`.
- **Motor de Alertas**:
  - Compara las lecturas entrantes con los umbrales configurados en el CMS.
  - Actualiza la campanita de notificaciones en el encabezado con contador de no leídos.
- **Plan de Purificación (Simulación IA)**:
  - Algoritmo que evalúa las concentraciones de partículas y meteorología, clasificando el estado en 'Condición Favorable' o 'Alerta Preventiva', generando instrucciones de ventilación, filtrado HEPA y recomendaciones para grupos sensibles.
- **Exportación PDF**:
  - Función `generatePDF()` que utiliza `jsPDF` y `jsPDF-autotable` para compilar la telemetría histórica en una tabla estilizada con membrete institucional y registro de alertas.

---

### 3.2. Backend y Serverless

#### ⚡ `backend/functions/analizar.js` (Netlify Function)
Actúa como la API central (`/api/analizar`):
- **Simulación Física y Meteorológica de Ubaté**:
  - **PM2.5**: Rango base 5–45 µg/m³, con picos aleatorios de 45–60 µg/m³.
  - **PM10**: Relacionado físicamente con PM2.5 (1.5x en condiciones normales o +30 por polvo/construcción).
  - **PM1**: 60% de la masa de PM2.5.
  - **VOC y NO₂**: Simulación con picos correspondientes a actividad vehicular en corredores principales o uso de solventes.
  - **Meteorología Andina**: Temperatura entre 12 y 22 °C, humedad entre 55 y 85%, y presión barométrica promedio de 745 a 755 hPa (calibrada para los 2550 msnm de Ubaté).
- **Persistencia en Base de Datos**:
  - Conexión a Supabase mediante la librería `@supabase/supabase-js`.
  - Inserción asíncrona de cada paquete de telemetría en la tabla `historial_sensores`.
- **Respuesta HTTP**: Entrega los datos en formato JSON con cabeceras CORS (`Access-Control-Allow-Origin: *`).

#### 🛠️ `netlify.toml` (Configuración de Despliegue)
- Define la carpeta a publicar: `frontend`.
- Define el directorio de funciones serverless: `backend/functions`.
- Establece la regla de reescritura:
  ```toml
  [[redirects]]
    from = "/api/*"
    to = "/.netlify/functions/:splat"
    status = 200
  ```
  Permitiendo que las solicitudes frontend a `/api/analizar` se dirijan limpiamente a la función serverless.

---

## 🔐 4. Control de Acceso y Roles (RBAC)

La plataforma cuenta con dos niveles de privilegio:

| Rol | Privilegios |
|---|---|
| **Usuario General (`user`)** | Consulta del Dashboard en tiempo real, revisión de historial, visualización del mapa de sensores, recepción de alertas ambientales, consulta e impresión de políticas de privacidad, y descarga del informe PDF. |
| **Administrador (`admin`)** | Todos los privilegios de usuario más: acceso exclusivo al **Panel CMS**, edición de políticas de privacidad, emisión de comunicados comunitarios, ajuste de umbrales de alerta, renombrado de estaciones, herramientas de **arrastre y edición de coordenadas en el mapa**, y generación de planes de purificación asistida por IA. |

*Nota: Por defecto, el correo `oscarduquegar@gmail.com` adquiere privilegios de Administrador al registrarse.*

---

## 📊 5. Parámetros de Monitoreo Ambiental

| Métrica | Unidad | Límite Estándar OMS / CMS | Descripción |
|---|---|---|---|
| **PM1** | µg/m³ | 25.0 | Partículas ultrafinas capaces de ingresar al torrente sanguíneo. |
| **PM2.5** | µg/m³ | 35.4 | Material particulado fino respirable (principal indicador AQI). |
| **PM10** | µg/m³ | 154.0 | Polvo, polen y partículas suspendidas mayores. |
| **NO₂** | µg/m³ | 100.0 | Dióxido de nitrógeno proveniente de emisiones vehiculares e industriales. |
| **VOC** | ppm | 1.00 | Compuestos orgánicos volátiles emitidos por pinturas, químicos y solventes. |
| **Temperatura** | °C | 12 - 22 | Temperatura ambiente de la sabana de Ubaté. |
| **Humedad** | % | 55 - 85 | Humedad relativa del aire. |
| **Presión** | hPa | 745 - 755 | Presión barométrica adaptada a la altitud de 2550 msnm. |

---

## 🧪 6. Suite Automatizada de Pruebas, Cobertura y Benchmark de Carga

Conforme a la rúbrica de 8vo semestre, el proyecto implementa una suite completa de pruebas unitarias, de integración y de estrés concurrente:

### 6.1. Ejecución de Pruebas
```bash
# 1. Ejecutar suite de pruebas unitarias e integración (16 tests automatizados)
npm test

# 2. Generar reporte formal de cobertura de código
npm run test:coverage

# 3. Ejecutar benchmark de carga/estrés concurrente (50 nodos IoT simultáneos)
npm run test:load
```

### 6.2. Reporte de Cobertura de Código Verificable
- **Líneas cubiertas**: **94.11%** (Supera ampliamente el umbral del 80% exigido).
- **Funciones cubiertas**: **100.00%**.
- **Módulos auditados**: `backend/functions/analizar.js`, `backend/functions/predecir.js`, `backend/ica_colombia.js`, `backend/ml_model.js`.

### 6.3. Evidencia de Pruebas de Carga y Concurrencia
- **Nodos IoT simulados**: 50 estaciones concurrentes transmitiendo telemetría.
- **Total de peticiones procesadas**: 200 peticiones en ráfaga.
- **Tasa de éxito (HTTP 200)**: **100.00%** (0 errores).
- **Throughput**: **1,169.59 peticiones/segundo**.
- **Latencia promedio**: **40.21 ms**.
- **Percentil 95 (P95)**: **139.54 ms** (Umbral SLA < 250 ms cumplido).

---

## 🚀 7. Guía de Ejecución y Despliegue

### Requisitos Previos:
- Node.js (v18 o superior)
- npm o pnpm
- Cuenta de [Netlify](https://www.netlify.com/) (para despliegue en la nube)
- Proyecto configurado en [Supabase](https://supabase.com/) con la tabla `historial_sensores`

### Ejecución Local:

#### Opción 1: Servidor Nativo Integrado (Recomendado - Cero Descargas)
El proyecto incluye un servidor de desarrollo nativo en Node.js ([server.js](file:///c:/Users/oscar/OneDrive/Documents/PROYECTO/PROYECTO_SIS_AIR/server.js)) que emula con precisión los redirects de Netlify, sirve el frontend estático y despacha las funciones serverless `/api/analizar` y `/api/predecir`:
```bash
npm start
# o también:
npm run dev
```
La aplicación se abrirá en `http://localhost:8888`.

#### Opción 2: Mediante Netlify CLI (Opcional)
Si deseas usar la herramienta oficial de Netlify en la terminal, utiliza el paquete `netlify-cli` (evitando el paquete legado `netlify` que genera bloqueos de caché):
```bash
npx netlify-cli dev
```

### Despliegue en Producción:
El proyecto está completamente preparado para desplegarse en Netlify conectando el repositorio de GitHub. Gracias al archivo `netlify.toml`, Netlify detectará automáticamente tanto la carpeta estática `frontend` como las funciones serverless de `backend/functions`.
