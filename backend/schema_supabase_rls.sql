-- ============================================================================
-- SIS AIR UBATÉ - ESQUEMA DE BASE DE DATOS Y POLÍTICAS RLS (SUPABASE / POSTGRESQL)
-- Rúbrica de Madurez Técnica - 8vo Semestre Ingeniería de Sistemas
-- ============================================================================

-- 1. Tabla de Historial de Telemetría Ambiental
CREATE TABLE IF NOT EXISTS public.historial_sensores (
    id BIGSERIAL PRIMARY KEY,
    estacion_id TEXT DEFAULT 'estacion-centro',
    pm1 NUMERIC(6, 2) NOT NULL,
    pm25 NUMERIC(6, 2) NOT NULL,
    pm10 NUMERIC(6, 2) NOT NULL,
    no2 NUMERIC(6, 2) NOT NULL,
    voc NUMERIC(6, 2) NOT NULL,
    temperatura NUMERIC(5, 2) NOT NULL,
    humedad NUMERIC(5, 2) NOT NULL,
    presion NUMERIC(6, 2) NOT NULL,
    ica INTEGER,
    categoria_ica TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Bogota', NOW())
);

-- 2. Tabla de Estaciones de Monitoreo Georreferenciadas
CREATE TABLE IF NOT EXISTS public.estaciones_sensores (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    latitud NUMERIC(10, 6) NOT NULL,
    longitud NUMERIC(10, 6) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    estado_conexion TEXT DEFAULT 'Online', -- 'Online', 'Degradado', 'Offline'
    latencia_ms INTEGER DEFAULT 45,
    ultimo_latido TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Umbrales de Calidad del Aire (Límites Normativos)
CREATE TABLE IF NOT EXISTS public.umbrales_calidad (
    id SERIAL PRIMARY KEY,
    parametro TEXT UNIQUE NOT NULL, -- 'pm1', 'pm25', 'pm10', 'no2', 'voc'
    limite_moderado NUMERIC(8, 2) NOT NULL,
    limite_danino NUMERIC(8, 2) NOT NULL,
    unidad TEXT NOT NULL,
    norma_referencia TEXT DEFAULT 'Resolución 2254 de 2017 (MADS)',
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Configuración Institucional y CMS
CREATE TABLE IF NOT EXISTS public.cms_configuracion (
    clave TEXT PRIMARY KEY,
    valor JSONB NOT NULL,
    descripcion TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Auditoría de Cambios Administrativos
CREATE TABLE IF NOT EXISTS public.auditoria_cambios (
    id BIGSERIAL PRIMARY KEY,
    tabla_afectada TEXT NOT NULL,
    registro_id TEXT NOT NULL,
    accion TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario_id UUID REFERENCES auth.users(id),
    usuario_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de Validación de Stakeholders y Pruebas UAT (Escala SUS)
CREATE TABLE IF NOT EXISTS public.stakeholder_feedback (
    id BIGSERIAL PRIMARY KEY,
    entidad_o_actor TEXT NOT NULL, -- 'Alcaldía de Ubaté', 'CAR Cundinamarca', 'Hospital Ubaté', 'Comunidad'
    evaluador_nombre TEXT NOT NULL,
    evaluador_rol TEXT NOT NULL,
    score_sus NUMERIC(5, 2) NOT NULL, -- 0 a 100
    hallazgos_principales TEXT NOT NULL,
    impacto TEXT CHECK (impacto IN ('Bajo', 'Medio', 'Alto', 'Crítico')),
    estado_mejora TEXT DEFAULT 'Implementado y Verificado',
    acciones_implementadas TEXT,
    fecha_evaluacion TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- POLÍTICAS DE SEGURIDAD A NIVEL DE FILA (ROW LEVEL SECURITY - RLS)
-- ============================================================================

ALTER TABLE public.historial_sensores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estaciones_sensores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umbrales_calidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_cambios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_feedback ENABLE ROW LEVEL SECURITY;

-- 1. Políticas de Lectura Pública (Cualquier usuario autenticado o anónimo puede consultar telemetría e info institucional)
CREATE POLICY "Lectura pública de historial" ON public.historial_sensores FOR SELECT USING (true);
CREATE POLICY "Lectura pública de estaciones" ON public.estaciones_sensores FOR SELECT USING (true);
CREATE POLICY "Lectura pública de umbrales" ON public.umbrales_calidad FOR SELECT USING (true);
CREATE POLICY "Lectura pública de cms" ON public.cms_configuracion FOR SELECT USING (true);
CREATE POLICY "Lectura pública de feedback" ON public.stakeholder_feedback FOR SELECT USING (true);

-- Inserción de telemetría permitida anónimamente (para ingesta de sensores IoT / API)
CREATE POLICY "Inserción de sensores IoT" ON public.historial_sensores FOR INSERT WITH CHECK (true);

-- Inserción de feedback permitida a usuarios autenticados
CREATE POLICY "Inserción de feedback usuarios" ON public.stakeholder_feedback FOR INSERT TO authenticated WITH CHECK (true);

-- 2. Políticas Restrictivas: Solo Administradores pueden Modificar Configuraciones Críticas
CREATE POLICY "Admin gestiona estaciones" ON public.estaciones_sensores
FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'email' = 'oscarduquegar@gmail.com' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    auth.jwt() ->> 'email' = 'oscarduquegar@gmail.com' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin gestiona umbrales" ON public.umbrales_calidad
FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'email' = 'oscarduquegar@gmail.com' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    auth.jwt() ->> 'email' = 'oscarduquegar@gmail.com' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin gestiona cms" ON public.cms_configuracion
FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'email' = 'oscarduquegar@gmail.com' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    auth.jwt() ->> 'email' = 'oscarduquegar@gmail.com' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin consulta auditoria" ON public.auditoria_cambios
FOR SELECT TO authenticated
USING (
    auth.jwt() ->> 'email' = 'oscarduquegar@gmail.com' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================================================
-- DISPARADORES (TRIGGERS) PARA AUDITORÍA AUTOMÁTICA DE CAMBIOS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_auditar_cambios()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.auditoria_cambios (
        tabla_afectada,
        registro_id,
        accion,
        datos_anteriores,
        datos_nuevos,
        usuario_id,
        usuario_email
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT, 'N/A'),
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid(),
        auth.jwt() ->> 'email'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auditar_estaciones ON public.estaciones_sensores;
CREATE TRIGGER trg_auditar_estaciones
AFTER INSERT OR UPDATE OR DELETE ON public.estaciones_sensores
FOR EACH ROW EXECUTE FUNCTION public.fn_auditar_cambios();

DROP TRIGGER IF EXISTS trg_auditar_umbrales ON public.umbrales_calidad;
CREATE TRIGGER trg_auditar_umbrales
AFTER INSERT OR UPDATE OR DELETE ON public.umbrales_calidad
FOR EACH ROW EXECUTE FUNCTION public.fn_auditar_cambios();

-- ============================================================================
-- DATOS INICIALES SEMILLA (SEED DATA)
-- ============================================================================

INSERT INTO public.estaciones_sensores (id, nombre, latitud, longitud, descripcion, estado_conexion, latencia_ms)
VALUES 
    ('centro', 'Estación Centro - Parque Principal', 5.308600, -73.814400, 'Nodo céntrico de alto tránsito peatonal y vehicular', 'Online', 42),
    ('norte',  'Estación Norte - Salida Samacá',    5.315000, -73.810000, 'Corredor vial de carga y transporte pesado', 'Online', 58),
    ('sur',    'Estación Sur - Zona Agropecuaria',   5.300000, -73.820000, 'Zona rural y ganadera de Ubaté', 'Online', 35)
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    latitud = EXCLUDED.latitud,
    longitud = EXCLUDED.longitud;

INSERT INTO public.umbrales_calidad (parametro, limite_moderado, limite_danino, unidad)
VALUES 
    ('pm1',  15.0,  25.0,  'µg/m³'),
    ('pm25', 12.0,  37.4,  'µg/m³'),
    ('pm10', 54.0,  154.0, 'µg/m³'),
    ('no2',  100.0, 189.0, 'µg/m³'),
    ('voc',  0.60,  1.20,  'ppm')
ON CONFLICT (parametro) DO UPDATE SET
    limite_moderado = EXCLUDED.limite_moderado,
    limite_danino = EXCLUDED.limite_danino;

-- Datos de Auditoría UAT de Stakeholders Semilla
INSERT INTO public.stakeholder_feedback 
    (entidad_o_actor, evaluador_nombre, evaluador_rol, score_sus, hallazgos_principales, impacto, estado_mejora, acciones_implementadas)
VALUES
    ('Secretaría de Salud y Medio Ambiente Ubaté', 'Ing. Carlos Mendoza', 'Director Ambiental', 87.5, 'Necesidad de correlacionar el índice con la Resolución 2254 de 2017 e incluir alertas tempranas para centros educativos.', 'Alto', 'Implementado y Verificado', 'Integración del cálculo matemático oficial por breakpoints de la Res. 2254 y semáforo visual de 6 categorías.'),
    ('Hospital El Salvador de Ubaté', 'Dra. Martha Riaño', 'Epidemióloga Comunitaria', 85.0, 'Requerimiento de recomendaciones médicas automatizadas para pacientes asmáticos según pronóstico.', 'Alto', 'Implementado y Verificado', 'Generación de plan de mitigación asistido por Machine Learning con segmentación de población vulnerable.'),
    ('Líderes Comunales Sector Norte', 'Javier Peña', 'Presidente JAC', 82.5, 'La interfaz debe ser comprensible en teléfonos móviles y disponer de reportes para asambleas.', 'Medio', 'Implementado y Verificado', 'Diseño responsivo optimizado para móviles y exportación directa de reportes PDF y CSV.')
ON CONFLICT DO NOTHING;
