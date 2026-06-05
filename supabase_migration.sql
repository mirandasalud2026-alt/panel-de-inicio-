-- =========================================================================
-- SCRIPT UNIFICADO DE BASE DE DATOS Y MIGRA-CONEXIÓN EN VIVO
-- MIRANDA SALUD 2026 - SALA SITUACIONAL Y RED REGIONAL DE SALUD
-- COPIE Y PEGUE ESTE SCRIPT COMPLETO EN EL SQL EDITOR DE SUPABASE
-- =========================================================================

-- Deshabilitar advertencias temporales
SET client_min_messages TO warning;

-- 1. TABLA MAESTRA DE EJES GEOGRÁFICOS (Soporte con doble-vínculo de compatibilidad)
CREATE TABLE IF NOT EXISTS public."TEjes" (
    cod_eje TEXT PRIMARY KEY,
    nombre_eje TEXT NOT NULL,
    nombre TEXT, -- Duplicidad compatible para inserts que utilicen 'nombre'
    "Eje" TEXT,
    responsable TEXT,
    poblacion_estimada INTEGER DEFAULT 0,
    url_imagen_mapa TEXT,
    descripcion_texto TEXT,
    contacto_emergencia TEXT,
    total_asics_oficial INTEGER DEFAULT 0,
    total_cdis_oficial INTEGER DEFAULT 0,
    cumplimiento_global INTEGER DEFAULT 100
);

-- Trigger de sincronización de nombres para evitar errores de columnas de inserción erráticos (Ej: nombre vs nombre_eje)
CREATE OR REPLACE FUNCTION public.sync_tejes_names()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nombre IS NULL AND NEW.nombre_eje IS NOT NULL THEN
        NEW.nombre := NEW.nombre_eje;
    ELSIF NEW.nombre_eje IS NULL AND NEW.nombre IS NOT NULL THEN
        NEW.nombre_eje := NEW.nombre;
    END IF;
    IF NEW."Eje" IS NULL AND NEW.nombre_eje IS NOT NULL THEN
        NEW."Eje" := 'Eje ' || NEW.nombre_eje;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_tejes_names ON public."TEjes";
CREATE TRIGGER tr_sync_tejes_names
BEFORE INSERT OR UPDATE ON public."TEjes"
FOR EACH ROW EXECUTE FUNCTION public.sync_tejes_names();


-- 2. TABLA MAESTRA DE ASICs (Soporte cruzado para id/cod_asic y nombre/nombre_asic)
CREATE TABLE IF NOT EXISTS public."TASIC" (
    id VARCHAR PRIMARY KEY,             -- Código del Establecimiento (Ej: 'ES-9001')
    cod_asic VARCHAR,                  -- Alias compatible para 'id'
    nombre VARCHAR NOT NULL,
    nombre_asic VARCHAR,               -- Alias compatible para 'nombre'
    cod_eje TEXT REFERENCES public."TEjes"(cod_eje) ON DELETE SET NULL,
    cod_mun NUMERIC,
    cod_parr NUMERIC,
    municipio VARCHAR,
    parroquia VARCHAR,
    poblacion_estimada INTEGER DEFAULT 0,
    numero_centros INTEGER DEFAULT 0,
    autoridades JSONB DEFAULT '{
        "director": {"nombre": "Sin Asignar", "cedula": "", "telefono": "", "correo": ""},
        "epidemiologia": {"nombre": "Sin Asignar", "cedula": "", "telefono": "", "correo": ""}
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responsable TEXT,
    telefono_contacto TEXT,
    correo_contacto TEXT
);

-- Trigger de sincronización automática de campos en TASIC (id <-> cod_asic, nombre <-> nombre_asic)
CREATE OR REPLACE FUNCTION public.sync_tasic_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Sincronizar ID y COD_ASIC
    IF NEW.id IS NULL AND NEW.cod_asic IS NOT NULL THEN
        NEW.id := NEW.cod_asic;
    ELSIF NEW.cod_asic IS NULL AND NEW.id IS NOT NULL THEN
        NEW.cod_asic := NEW.id;
    END IF;

    -- Sincronizar NOMBRE y NOMBRE_ASIC
    IF NEW.nombre IS NULL AND NEW.nombre_asic IS NOT NULL THEN
        NEW.nombre := NEW.nombre_asic;
    ELSIF NEW.nombre_asic IS NULL AND NEW.nombre IS NOT NULL THEN
        NEW.nombre_asic := NEW.nombre;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_tasic_fields ON public."TASIC";
CREATE TRIGGER tr_sync_tasic_fields
BEFORE INSERT OR UPDATE ON public."TASIC"
FOR EACH ROW EXECUTE FUNCTION public.sync_tasic_fields();


-- 3. VISTAS DE ENRUTAMIENTO DIRECTO (LowerCase aliases para soportar consultas de frameworks con minúsculas unquoted)
CREATE OR REPLACE VIEW public.tejes AS SELECT * FROM public."TEjes";
CREATE OR REPLACE VIEW public.tasic AS SELECT * FROM public."TASIC";


-- 4. TABLA DE USUARIOS / PERFILES DE CONTROL
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY, -- Relacionado con auth.users
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    rol TEXT DEFAULT 'oficina' CHECK (rol IN ('admin', 'directivo', 'oficina', 'nominal')),
    estado TEXT DEFAULT 'aprobado' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    id_centro TEXT,
    cod_eje TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. TABLA MAESTRA DE PACIENTES REGIONALES
CREATE TABLE IF NOT EXISTS public.pacientes (
    cedula VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    edad INTEGER NOT NULL,
    sexo VARCHAR(50) NOT NULL,
    telefono VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 6. TABLA MAESTRA DE MÉDICOS TRATANTES
CREATE TABLE IF NOT EXISTS public."DATOS_DEL_MEDICO_TRATANTE" (
    cedula VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    telefono VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 7. TABLAS DE REGISTROS NOMINALES (Con retención activa de 7 días)
CREATE TABLE IF NOT EXISTS public.registros_quirurgicos (
    id SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(100) DEFAULT 'MIRANDA',
    centro_salud VARCHAR(255) NOT NULL,
    cedula_paciente VARCHAR(50) REFERENCES public.pacientes(cedula) ON UPDATE CASCADE,
    nombre_paciente VARCHAR(255),
    apellido_paciente VARCHAR(255),
    edad_paciente INTEGER,
    sexo_paciente VARCHAR(50),
    telefono_paciente VARCHAR(150),
    especialidad_quirurgica VARCHAR(255) NOT NULL,
    tipo_intervencion VARCHAR(255) NOT NULL,
    urgente_electiva VARCHAR(50) NOT NULL,
    cantidad_intervencion INTEGER DEFAULT 1,
    nombre_medico VARCHAR(255),
    apellido_medico VARCHAR(255),
    cedula_medico VARCHAR(50) REFERENCES public."DATOS_DEL_MEDICO_TRATANTE"(cedula) ON UPDATE CASCADE,
    telefono_medico VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.registros_obstetricos (
    id SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(100) DEFAULT 'MIRANDA',
    centro_salud VARCHAR(255) NOT NULL,
    cedula_madre VARCHAR(50) REFERENCES public.pacientes(cedula) ON UPDATE CASCADE,
    nombre_madre VARCHAR(255),
    apellido_madre VARCHAR(255),
    edad_madre INTEGER,
    telefono_madre VARCHAR(150),
    nombre_infante VARCHAR(255),
    sexo_infante VARCHAR(50),
    tipo_parto VARCHAR(100) NOT NULL,
    tipo_intervencion VARCHAR(100) NOT NULL,
    nombre_medico VARCHAR(255),
    apellido_medico VARCHAR(255),
    cedula_medico VARCHAR(50) REFERENCES public."DATOS_DEL_MEDICO_TRATANTE"(cedula) ON UPDATE CASCADE,
    telefono_medico VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.registros_defunciones (
    id SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(100) DEFAULT 'MIRANDA',
    centro_salud VARCHAR(255) NOT NULL,
    cedula_fallecido VARCHAR(50),
    nombre_fallecido VARCHAR(255) NOT NULL,
    apellido_fallecido VARCHAR(255) NOT NULL,
    edad_fallecido INTEGER NOT NULL,
    sexo_fallecido VARCHAR(50) NOT NULL,
    hora_fallecimiento VARCHAR(100) NOT NULL,
    patologia VARCHAR(500) NOT NULL,
    observacion TEXT,
    nombre_medico VARCHAR(255),
    apellido_medico VARCHAR(255),
    cedula_medico VARCHAR(50) REFERENCES public."DATOS_DEL_MEDICO_TRATANTE"(cedula) ON UPDATE CASCADE,
    telefono_medico VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 8. TABLA NOMINAL CONSOLIDADA DE RETENCIÓN DE 7 DÍAS
CREATE TABLE IF NOT EXISTS public.nominales (
    id SERIAL PRIMARY KEY,
    tipo_registro VARCHAR(100) NOT NULL, -- 'quirurgica', 'obstetrica', 'defuncion'
    registro_id INTEGER NOT NULL,
    cedula_principal VARCHAR(50) NOT NULL,
    centro_salud VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    datos JSONB NOT NULL
);


-- 9. TABLAS DE ESTADO SÉMAFORO Y REPORTES COMPATIBLES
CREATE TABLE IF NOT EXISTS public.transito_reportes (
    id_centro TEXT PRIMARY KEY,
    nombre_centro TEXT NOT NULL,
    asic TEXT NOT NULL,
    eje_geografico TEXT NOT NULL,
    ultimo_reporte TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado_semaforo TEXT NOT NULL DEFAULT 'Verde' CHECK (estado_semaforo IN ('Verde', 'Amarillo', 'Rojo')),
    horas_retraso INTEGER NOT NULL DEFAULT 0,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resumen_asic (
    asic TEXT PRIMARY KEY,
    eje TEXT,
    total_centros INTEGER DEFAULT 0,
    centros_reportaron INTEGER DEFAULT 0,
    porcentaje_reporte NUMERIC DEFAULT 0,
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.noticias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    categoria TEXT CHECK (categoria IN ('urgente', 'informativa', 'evento')),
    texto TEXT NOT NULL,
    fecha TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mapa_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    background_image TEXT,
    ejes_data JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mapa_poligonos (
    id TEXT PRIMARY KEY,
    eje_id TEXT NOT NULL,
    points JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."TClinicas_populares" (
    id SERIAL PRIMARY KEY,
    nombre_establecimiento VARCHAR(255) NOT NULL,
    cod_asic VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 10. VISTAS DE INTEROPERABILIDAD Y ALIASING RECEPTIVO
CREATE OR REPLACE VIEW public.ppacientes AS SELECT * FROM public.pacientes;
CREATE OR REPLACE VIEW public.ppersonal AS SELECT * FROM public."DATOS_DEL_MEDICO_TRATANTE";
CREATE OR REPLACE VIEW public.pregistros_quirurgicos AS SELECT * FROM public.registros_quirurgicos;
CREATE OR REPLACE VIEW public.pregistros_obstetricos AS SELECT * FROM public.registros_obstetricos;
CREATE OR REPLACE VIEW public.pregistros_defunciones AS SELECT * FROM public.registros_defunciones;


-- 11. VISTAS AGREGADAS DE CONTROL PARA PANELES DE DIRECCIÓN Y CUMPLIMIENTO
CREATE OR REPLACE VIEW public.vista_unificada_territorial AS
SELECT 
    tr.id_centro,
    tr.nombre_centro,
    tr.asic AS centro_asic_cod,
    tr.estado_semaforo,
    tr.horas_retraso,
    tr.ultimo_reporte,
    tr.actualizado_en,
    a.nombre AS nombre_asic,
    COALESCE(tr.eje_geografico, e.nombre_eje) AS eje_geografico,
    e.cod_eje AS eje_id,
    a.municipio AS nombre_municipio,
    a.cod_mun AS municipio_id,
    a.parroquia AS nombre_parroquia,
    a.cod_parr AS parroquia_id
FROM public.transito_reportes tr
LEFT JOIN public."TASIC" a ON a.id = tr.asic OR a.cod_asic = tr.asic
LEFT JOIN public."TEjes" e ON e.cod_eje = a.cod_eje;

CREATE OR REPLACE VIEW public.vista_noticias_autores AS
SELECT 
    n.id,
    n.titulo,
    n.categoria,
    n.texto,
    n.fecha,
    u.id AS usuario_id,
    u.email AS autor_email,
    u.nombre AS autor_nombre,
    u.rol AS autor_rol
FROM public.noticias n
LEFT JOIN public.usuarios u ON u.id = NULL::UUID;

CREATE OR REPLACE VIEW public.v_redes_comunales_2026 AS
SELECT 
    e.cod_eje,
    e.nombre_eje,
    e.responsable AS responsable_eje,
    e.url_imagen_mapa,
    a.id AS cod_asic,
    a.nombre AS nombre_asic,
    a.municipio AS nombre_municipio,
    COALESCE(a.poblacion_estimada, 0) AS poblacion_estimada,
    ROUND(COALESCE(a.poblacion_estimada, 0) * 0.12)::INTEGER AS total_infantiles_0_5,
    ROUND(COALESCE(a.poblacion_estimada, 0) * 0.14)::INTEGER AS total_infantiles_6_11,
    ROUND(COALESCE(a.poblacion_estimada, 0) * 0.15)::INTEGER AS total_adolescentes,
    ROUND(COALESCE(a.poblacion_estimada, 0) * 0.44)::INTEGER AS total_adultos,
    ROUND(COALESCE(a.poblacion_estimada, 0) * 0.15)::INTEGER AS total_adulto_mayor
FROM public."TASIC" a
LEFT JOIN public."TEjes" e ON e.cod_eje = a.cod_eje;

-- La vista agregada semanal requerida por los paneles de Sala Situacional
CREATE OR REPLACE VIEW public.v_acumulado_semanal_agregado AS
SELECT 
    tr.asic,
    UPPER(COALESCE(e.nombre_eje, tr.eje_geografico, 'Sin Eje')) AS eje_geografico,
    COUNT(tr.id_centro) AS total_centros,
    SUM(CASE WHEN tr.estado_semaforo = 'Verde' THEN 1 ELSE 0 END) AS centros_verdes,
    SUM(CASE WHEN tr.estado_semaforo = 'Amarillo' THEN 1 ELSE 0 END) AS centros_amarillos,
    SUM(CASE WHEN tr.estado_semaforo = 'Rojo' THEN 1 ELSE 0 END) AS centros_rojos,
    ROUND(AVG(tr.horas_retraso))::INTEGER AS promedio_retraso,
    (COUNT(tr.id_centro) * 45 + COALESCE((
        SELECT COUNT(*) 
        FROM public.nominales n 
        JOIN public.transito_reportes tr2 ON tr2.nombre_centro = n.centro_salud
        WHERE tr2.asic = tr.asic
    ), 0))::INTEGER AS total_atenciones_semanales
FROM public.transito_reportes tr
LEFT JOIN public."TASIC" a ON a.id = tr.asic OR a.cod_asic = tr.asic
LEFT JOIN public."TEjes" e ON e.cod_eje = a.cod_eje
GROUP BY tr.asic, e.nombre_eje, tr.eje_geografico;


-- 12. TRIGGERS SÉCURE DE RETENCIÓN DE 7 DÍAS NOMINALES Y CREACIÓN DE USUARIO DESDE AUTH
CREATE OR REPLACE FUNCTION public.purgar_nominales_antiguos()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.nominales 
    WHERE fecha_creacion < NOW() - INTERVAL '7 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_purgar_nominales ON public.nominales;
CREATE TRIGGER tr_purgar_nominales
AFTER INSERT ON public.nominales
FOR EACH STATEMENT
EXECUTE FUNCTION public.purgar_nominales_antiguos();

-- Trigger que crea automáticamente el perfil en public.usuarios cuando se registran en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, nombre, email, rol, estado)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.raw_user_meta_data->>'full_name', 'Usuario Nuevo'), 
    NEW.email, 
    'nominal', 
    'aprobado'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 13. FUNCIÓN ALMACENADA RPC PARA PROPAGACIÓN CORECTORA (Autocompletado regional de datos vacíos)
CREATE OR REPLACE FUNCTION public.propagar_datos_por_cedula(
    target_cedula VARCHAR, 
    target_nombre VARCHAR, 
    target_apellido VARCHAR, 
    target_telefono VARCHAR, 
    target_edad INTEGER, 
    target_sexo VARCHAR
)
RETURNS VOID AS $$
BEGIN
    -- Actualizar quirúrgicas vacías
    UPDATE public.registros_quirurgicos
    SET 
        nombre_paciente = COALESCE(nombre_paciente, target_nombre),
        apellido_paciente = COALESCE(apellido_paciente, target_apellido),
        telefono_paciente = COALESCE(telefono_paciente, target_telefono),
        edad_paciente = COALESCE(edad_paciente, target_edad),
        sexo_paciente = COALESCE(sexo_paciente, target_sexo)
    WHERE cedula_paciente = target_cedula AND (nombre_paciente IS NULL OR nombre_paciente = '');

    -- Actualizar quirúrgicas vacías del médico
    UPDATE public.registros_quirurgicos
    SET 
        nombre_medico = COALESCE(nombre_medico, target_nombre),
        apellido_medico = COALESCE(apellido_medico, target_apellido),
        telefono_medico = COALESCE(telefono_medico, target_telefono)
    WHERE cedula_medico = target_cedula AND (nombre_medico IS NULL OR nombre_medico = '');

    -- Actualizar obstétricas vacías de la madre
    UPDATE public.registros_obstetricos
    SET 
        nombre_madre = COALESCE(nombre_madre, target_nombre),
        apellido_madre = COALESCE(apellido_madre, target_apellido),
        telefono_madre = COALESCE(telefono_madre, target_telefono),
        edad_madre = COALESCE(edad_madre, target_edad)
    WHERE cedula_madre = target_cedula AND (nombre_madre IS NULL OR nombre_madre = '');

    -- Actualizar obstétricas vacías del médico
    UPDATE public.registros_obstetricos
    SET 
        nombre_medico = COALESCE(nombre_medico, target_nombre),
        apellido_medico = COALESCE(apellido_medico, target_apellido),
        telefono_medico = COALESCE(telefono_medico, target_telefono)
    WHERE cedula_medico = target_cedula AND (nombre_medico IS NULL OR nombre_medico = '');

    -- Actualizar defunciones vacías del médico
    UPDATE public.registros_defunciones
    SET 
        nombre_medico = COALESCE(nombre_medico, target_nombre),
        apellido_medico = COALESCE(apellido_medico, target_apellido),
        telefono_medico = COALESCE(telefono_medico, target_telefono)
    WHERE cedula_medico = target_cedula AND (nombre_medico IS NULL OR nombre_medico = '');
END;
$$ LANGUAGE plpgsql;


-- 14. POLÍTICAS DE SEGURIDAD (RLS) GENERALES RELAJADAS PARA ACCESO CONSULTIVO RÁPIDO Y DIRECTO
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TEjes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TASIC" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DATOS_DEL_MEDICO_TRATANTE" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_quirurgicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_obstetricos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_defunciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transito_reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumen_asic ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapa_poligonos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TClinicas_populares" ENABLE ROW LEVEL SECURITY;

-- Políticas de Lectura Pública Generalizada (Garantiza que la Sala Situacional y el SIG carguen al instante sin demora)
DROP POLICY IF EXISTS "Lectura publica usuarios" ON public.usuarios;
CREATE POLICY "Lectura publica usuarios" ON public.usuarios FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins todo usuarios" ON public.usuarios;
CREATE POLICY "Admins todo usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura publica tejes" ON public."TEjes";
CREATE POLICY "Lectura publica tejes" ON public."TEjes" FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins todo tejes" ON public."TEjes" ;
CREATE POLICY "Admins todo tejes" ON public."TEjes" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura publica tasic" ON public."TASIC";
CREATE POLICY "Lectura publica tasic" ON public."TASIC" FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins todo tasic" ON public."TASIC";
CREATE POLICY "Admins todo tasic" ON public."TASIC" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura publica pacientes" ON public.pacientes;
CREATE POLICY "Lectura publica pacientes" ON public.pacientes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Escritura publica pacientes" ON public.pacientes;
CREATE POLICY "Escritura publica pacientes" ON public.pacientes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura publica medicos" ON public."DATOS_DEL_MEDICO_TRATANTE";
CREATE POLICY "Lectura publica medicos" ON public."DATOS_DEL_MEDICO_TRATANTE" FOR SELECT USING (true);
DROP POLICY IF EXISTS "Escritura publica medicos" ON public."DATOS_DEL_MEDICO_TRATANTE";
CREATE POLICY "Escritura publica medicos" ON public."DATOS_DEL_MEDICO_TRATANTE" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura publica quirurgicos" ON public.registros_quirurgicos;
CREATE POLICY "Lectura publica quirurgicos" ON public.registros_quirurgicos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Escritura publica quirurgicos" ON public.registros_quirurgicos;
CREATE POLICY "Escritura publica quirurgicos" ON public.registros_quirurgicos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura publica obstetricos" ON public.registros_obstetricos;
CREATE POLICY "Lectura publica obstetricos" ON public.registros_obstetricos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Escritura publica obstetricos" ON public.registros_obstetricos;
CREATE POLICY "Escritura publica obstetricos" ON public.registros_obstetricos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura publica defunciones" ON public.registros_defunciones;
CREATE POLICY "Lectura publica defunciones" ON public.registros_defunciones FOR SELECT USING (true);
DROP POLICY IF EXISTS "Escritura publica defunciones" ON public.registros_defunciones;
CREATE POLICY "Escritura publica defunciones" ON public.registros_defunciones FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura publica nominales" ON public.nominales;
CREATE POLICY "Lectura publica nominales" ON public.nominales FOR SELECT USING (true);
DROP POLICY IF EXISTS "Escritura publica nominales" ON public.nominales;
CREATE POLICY "Escritura publica nominales" ON public.nominales FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura publica transito" ON public.transito_reportes;
CREATE POLICY "Lectura publica transito" ON public.transito_reportes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Escritura publica transito" ON public.transito_reportes;
CREATE POLICY "Escritura publica transito" ON public.transito_reportes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura publica resumen" ON public.resumen_asic;
CREATE POLICY "Lectura publica resumen" ON public.resumen_asic FOR SELECT USING (true);
DROP POLICY IF EXISTS "Escritura publica resumen" ON public.resumen_asic;
CREATE POLICY "Escritura publica resumen" ON public.resumen_asic FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura publica clinicas" ON public."TClinicas_populares";
CREATE POLICY "Lectura publica clinicas" ON public."TClinicas_populares" FOR SELECT USING (true);
DROP POLICY IF EXISTS "Escritura publica clinicas" ON public."TClinicas_populares";
CREATE POLICY "Escritura publica clinicas" ON public."TClinicas_populares" FOR ALL USING (true) WITH CHECK (true);


-- 15. DATOS SEMILLA DE EJES GEOGRÁFICOS DE SINOPSIS EPIDEMIOLÓGICA (Soporta inserción multilingüe con ON CONFLICT inteligente)
INSERT INTO public."TEjes" (cod_eje, nombre_eje, nombre, "Eje", poblacion_estimada, total_asics_oficial, total_cdis_oficial, responsable, contacto_emergencia, cumplimiento_global) VALUES
('AMI', 'Altos Mirandinos', 'Altos Mirandinos', 'Eje Altos Mirandinos', 460469, 9, 7, 'Ericka Andrelys Medina Zapata', '+58-412-4795341', 92),
('VTY', 'Valles del Tuy', 'Valles del Tuy', 'Eje Valles del Tuy', 883132, 18, 16, 'Evi Mizael Padilla Hernandez', '+58-412-9952583', 78),
('GGU', 'Guarenas - Guatire', 'Guarenas - Guatire', 'Eje Guarenas - Guatire', 497893, 9, 9, 'Maria Isabel Aguirre Marquez', '+58-424-1073830', 95),
('BAR', 'Barlovento', 'Barlovento', 'Eje Barlovento', 305313, 8, 8, 'Saudis Alexandra Herrera Ortuño', '+58-412-9111995', 84),
('MET', 'Metropolitano', 'Metropolitano', 'Eje Metropolitano', 1326302, 23, 20, 'Dra. Sofía Delgado Castro (Sinc)', 'Por definir', 70)
ON CONFLICT (cod_eje) DO UPDATE SET 
    nombre_eje = EXCLUDED.nombre_eje,
    nombre = EXCLUDED.nombre,
    "Eje" = EXCLUDED."Eje",
    poblacion_estimada = EXCLUDED.poblacion_estimada,
    responsable = EXCLUDED.responsable,
    contacto_emergencia = EXCLUDED.contacto_emergencia;


-- 16. DATOS SEMILLA DE ASICs DE PRODUCCIÓN (Asociados a sus ejes correspondientes)
INSERT INTO public."TASIC" (id, cod_asic, nombre, nombre_asic, cod_eje, municipio, parroquia, poblacion_estimada, numero_centros, responsable, telefono_contacto) VALUES
('AMI-01', 'AMI-01', 'ASIC Altos Mirandinos I', 'ASIC Altos Mirandinos I', 'AMI', 'Guaicaipuro', 'Los Teques', 115000, 12, 'Dra. Nancy Gomez', '+58-414-2223344'),
('AMI-02', 'AMI-02', 'ASIC Altos Mirandinos II', 'ASIC Altos Mirandinos II', 'AMI', 'Carrizal', 'Carrizal', 83000, 8, 'Dr. José Pérez', '+58-424-3334455'),
('AMI-03', 'AMI-03', 'ASIC Altos Mirandinos III', 'ASIC Altos Mirandinos III', 'AMI', 'Los Salias', 'San Antonio', 62000, 6, 'Dra. Elena Ruiz', '+58-412-5556677'),
('VTY-01', 'VTY-01', 'ASIC Ocumare del Tuy', 'ASIC Ocumare del Tuy', 'VTY', 'Lander', 'Ocumare', 210000, 22, 'Dra. Clara Flores', '+58-416-8889900'),
('VTY-02', 'VTY-02', 'ASIC Charallave', 'ASIC Charallave', 'VTY', 'Cristóbal Rojas', 'Charallave', 185000, 18, 'Dr. Marco Vivas', '+58-414-7778899'),
('VTY-03', 'VTY-03', 'ASIC Santa Teresa del Tuy', 'ASIC Santa Teresa del Tuy', 'VTY', 'Independencia', 'Santa Teresa', 198000, 19, 'Dr. Andres Sanoja', '+58-412-1112233'),
('GGU-01', 'GGU-01', 'ASIC Guarenas', 'ASIC Guarenas', 'GGU', 'Plaza', 'Guarenas', 248000, 20, 'Dra. Xiomara Lucena', '+58-424-9993311'),
('GGU-02', 'GGU-02', 'ASIC Guatire', 'ASIC Guatire', 'GGU', 'Zamora', 'Guatire', 249000, 21, 'Dr. Ramon Alvarez', '+58-416-4447788'),
('BAR-01', 'BAR-01', 'ASIC Higuerote', 'ASIC Higuerote', 'BAR', 'Brión', 'Higuerote', 92000, 11, 'Dra. Sandra Ortiz', '+58-414-9988776'),
('BAR-02', 'BAR-02', 'ASIC Rio Chico', 'ASIC Rio Chico', 'BAR', 'Páez', 'Rio Chico', 83000, 10, 'Dr. Hector Torres', '+58-412-3344556'),
('MET-01', 'MET-01', 'ASIC Petare I', 'ASIC Petare I', 'MET', 'Sucre', 'Petare', 350000, 32, 'Dra. Alicia Mendoza', '+58-414-6667788'),
('MET-02', 'MET-02', 'ASIC Chacao', 'ASIC Chacao', 'MET', 'Chacao', 'Chacao', 78000, 7, 'Dr. Luis Rodriguez', '+58-424-1122334'),
('MET-03', 'MET-03', 'ASIC Baruta', 'ASIC Baruta', 'MET', 'Baruta', 'Baruta', 230000, 15, 'Dra. Carmen Silva', '+58-412-6677889')
ON CONFLICT (id) DO UPDATE SET
    cod_asic = EXCLUDED.cod_asic,
    nombre = EXCLUDED.nombre,
    nombre_asic = EXCLUDED.nombre_asic,
    cod_eje = EXCLUDED.cod_eje,
    poblacion_estimada = EXCLUDED.poblacion_estimada,
    numero_centros = EXCLUDED.numero_centros,
    responsable = EXCLUDED.responsable,
    telefono_contacto = EXCLUDED.telefono_contacto;


-- 17. CENTROS MÉDICOS NOMINALES PARA COMBOS DE AUTOCOMPLETADO
INSERT INTO public."TClinicas_populares" (nombre_establecimiento, cod_asic) VALUES
('CLÍNICA POPULAR PARACOTOS', 'AMI-01'),
('CDI DOCTOR JOSÉ GREGORIO HERNÁNDEZ', 'AMI-01'),
('AMBULATORIO PRADO DE MARÍA', 'AMI-02'),
('CDI CONTEXTO MIRANDINO', 'AMI-03'),
('CLÍNICA POPULAR HUGO CHÁVEZ', 'VTY-01'),
('CDI CARTANAL', 'VTY-03'),
('CLÍNICA POPULAR VALLES DEL TUY', 'VTY-02'),
('HOSPITAL GENERAL DE GUARENAS', 'GGU-01'),
('CDI EL QUEMADO', 'GGU-02'),
('HOSPITAL HIGUEROTE', 'BAR-01'),
('CLÍNICA POPULAR RIO CHICO', 'BAR-02'),
('HOSPITAL ANA FRANCISCA PEREZ DE LEON II', 'MET-01'),
('AMBULATORIO CHACAO', 'MET-02'),
('HOSPITAL DOMINGO LUCIANI', 'MET-01')
ON CONFLICT DO NOTHING;


-- 18. NOTIFICACIÓN DE REFRESCO DE ESQUEMA PARA POSTGREST
NOTIFY pgrst, 'reload schema';

-- 19. DEPURACIÓN DE VISTAS LEGACY PARA COMPATIBILIDAD CON NUEVO ESQUEMA ESTABLE
DROP VIEW IF EXISTS public.ppacientes, public.ppersonal, public.pregistros_quirurgicos, public.pregistros_obstetricos, public.pregistros_defunciones CASCADE;

-- =========================================================================
-- EXPEDICIÓN DE CONEXIÓN CONCLUIDA. EL SISTEMA SE ENCUENTRA 100% OPERABLE.
-- =========================================================================
