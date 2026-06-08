-- =========================================================================
-- MIRANDA SALUD 2026 - ESQUEMA ÚNICO
-- Este script reemplaza database-setup.sql, supabase_setup.sql, etc.
-- Ejecutar en SQL Editor de Supabase.
-- =========================================================================

-- 1. TABLA DE EJES GEOGRÁFICOS (con doble columna para compatibilidad)
CREATE TABLE IF NOT EXISTS public.tejes (
    cod_eje TEXT PRIMARY KEY,
    nombre_eje TEXT NOT NULL,
    nombre TEXT,                    -- alias compatible
    eje TEXT,                       -- alias compatible
    responsable TEXT,
    poblacion_estimada INTEGER DEFAULT 0,
    url_imagen_mapa TEXT,
    descripcion_texto TEXT,
    contacto_emergencia TEXT,
    total_asics_oficial INTEGER DEFAULT 0,
    total_cdis_oficial INTEGER DEFAULT 0,
    cumplimiento_global INTEGER DEFAULT 100
);

-- Trigger para sincronizar nombre_eje <-> nombre
CREATE OR REPLACE FUNCTION sync_tejes_names()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nombre IS NULL AND NEW.nombre_eje IS NOT NULL THEN
        NEW.nombre := NEW.nombre_eje;
    ELSIF NEW.nombre_eje IS NULL AND NEW.nombre IS NOT NULL THEN
        NEW.nombre_eje := NEW.nombre;
    END IF;
    IF NEW.eje IS NULL AND NEW.nombre_eje IS NOT NULL THEN
        NEW.eje := 'Eje ' || NEW.nombre_eje;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_tejes_names ON public.tejes;
CREATE TRIGGER tr_sync_tejes_names
BEFORE INSERT OR UPDATE ON public.tejes
FOR EACH ROW EXECUTE FUNCTION sync_tejes_names();

-- 2. TABLA DE ASIC (con doble columna)
CREATE TABLE IF NOT EXISTS public.tasic (
    id VARCHAR PRIMARY KEY,         -- código ASIC
    cod_asic VARCHAR,               -- alias
    nombre VARCHAR NOT NULL,
    nombre_asic VARCHAR,            -- alias
    cod_eje TEXT REFERENCES public.tejes(cod_eje) ON DELETE SET NULL,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    responsable TEXT,
    telefono_contacto TEXT,
    correo_contacto TEXT
);

-- Trigger para sincronizar id <-> cod_asic y nombre <-> nombre_asic
CREATE OR REPLACE FUNCTION sync_tasic_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id IS NULL AND NEW.cod_asic IS NOT NULL THEN
        NEW.id := NEW.cod_asic;
    ELSIF NEW.cod_asic IS NULL AND NEW.id IS NOT NULL THEN
        NEW.cod_asic := NEW.id;
    END IF;
    IF NEW.nombre IS NULL AND NEW.nombre_asic IS NOT NULL THEN
        NEW.nombre := NEW.nombre_asic;
    ELSIF NEW.nombre_asic IS NULL AND NEW.nombre IS NOT NULL THEN
        NEW.nombre_asic := NEW.nombre;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_tasic_fields ON public.tasic;
CREATE TRIGGER tr_sync_tasic_fields
BEFORE INSERT OR UPDATE ON public.tasic
FOR EACH ROW EXECUTE FUNCTION sync_tasic_fields();

-- 3. TABLA DE USUARIOS (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    rol TEXT DEFAULT 'nominal' CHECK (rol IN ('admin', 'directivo', 'oficina', 'nominal')),
    estado TEXT DEFAULT 'aprobado' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    id_centro TEXT,
    cod_eje TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLAS MAESTRAS DE PACIENTES Y MÉDICOS (snake_case, sin espacios)
CREATE TABLE IF NOT EXISTS public.pacientes (
    cedula VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    edad INTEGER NOT NULL,
    sexo VARCHAR(50) NOT NULL,
    telefono VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.medicos (
    cedula VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    telefono VARCHAR(150),
    especialidad VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLAS DE REGISTROS NOMINALES (operativas)
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
    cedula_medico VARCHAR(50) REFERENCES public.medicos(cedula) ON UPDATE CASCADE,
    nombre_medico VARCHAR(255),
    apellido_medico VARCHAR(255),
    telefono_medico VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
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
    cedula_medico VARCHAR(50) REFERENCES public.medicos(cedula) ON UPDATE CASCADE,
    nombre_medico VARCHAR(255),
    apellido_medico VARCHAR(255),
    telefono_medico VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.registros_defunciones (
    id SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(100) DEFAULT 'MIRANDA',
    centro_salud VARCHAR(255) NOT NULL,
    cedula_fallecido VARCHAR(50) REFERENCES public.pacientes(cedula) ON UPDATE CASCADE,
    nombre_fallecido VARCHAR(255) NOT NULL,
    apellido_fallecido VARCHAR(255) NOT NULL,
    edad_fallecido INTEGER NOT NULL,
    sexo_fallecido VARCHAR(50) NOT NULL,
    hora_fallecimiento VARCHAR(100) NOT NULL,
    patologia VARCHAR(500) NOT NULL,
    observacion TEXT,
    cedula_medico VARCHAR(50) REFERENCES public.medicos(cedula) ON UPDATE CASCADE,
    nombre_medico VARCHAR(255),
    apellido_medico VARCHAR(255),
    telefono_medico VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE NOMINALES (retención 7 días)
CREATE TABLE IF NOT EXISTS public.nominales (
    id SERIAL PRIMARY KEY,
    tipo_registro VARCHAR(100) NOT NULL,
    registro_id INTEGER NOT NULL,
    cedula_principal VARCHAR(50) NOT NULL,
    centro_salud VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    datos JSONB NOT NULL
);

-- 7. TABLAS DEL SEMÁFORO Y REPORTES
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

-- 8. TABLAS AUXILIARES
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

CREATE TABLE IF NOT EXISTS public.clinicas_populares (
    id SERIAL PRIMARY KEY,
    nombre_establecimiento VARCHAR(255) NOT NULL,
    cod_asic VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. VISTAS
DO $$
DECLARE
    transito_table TEXT;
    join_cond      TEXT;
    asic_column   TEXT;
    semaforo_column TEXT;
    horas_retraso_column TEXT;
    ultimo_reporte_column TEXT;
    actualizado_en_column TEXT;
    eje_join_column TEXT;
    sql_create TEXT;
BEGIN
    -- 1. Detectar tabla de tránsito (ignorando mayúsculas y comillas)
    SELECT CASE
        WHEN to_regclass('public.transito_reportes') IS NOT NULL THEN 'transito_reportes'
        WHEN to_regclass('public."transito_reportes"') IS NOT NULL THEN 'transito_reportes'
        WHEN to_regclass('public."TRANSITO_REPORTES"') IS NOT NULL THEN 'TRANSITO_REPORTES'
        WHEN to_regclass('public."Transito_reportes"') IS NOT NULL THEN 'Transito_reportes'
        ELSE NULL
    END INTO transito_table;

    -- Fallback simple si no lo detecta de forma directa con regclass
    IF transito_table IS NULL THEN
        SELECT relname INTO transito_table
        FROM pg_class
        WHERE relkind = 'r'
          AND relnamespace = 'public'::regnamespace
          AND lower(relname) = 'transito_reportes'
        LIMIT 1;
    END IF;

    IF transito_table IS NULL THEN
        -- Si no existe en absoluto, creamos la tabla física como fallback para permitir compilar
        CREATE TABLE IF NOT EXISTS public.transito_reportes (
            id_centro SERIAL PRIMARY KEY,
            nombre_centro VARCHAR(255) NOT NULL UNIQUE,
            asic VARCHAR(100),
            estado_semaforo VARCHAR(50) DEFAULT 'Rojo',
            horas_retraso INTEGER DEFAULT 0,
            ultimo_reporte TIMESTAMPTZ DEFAULT NOW(),
            actualizado_en TIMESTAMPTZ DEFAULT NOW(),
            eje_geografico VARCHAR(100)
        );
        transito_table := 'transito_reportes';
        RAISE NOTICE 'Se ha creado una tabla dummy transito_reportes como fallback.';
    END IF;

    -- 2. Detectar columnas en esa tabla
    -- Código ASIC
    SELECT column_name INTO asic_column
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = transito_table
      AND lower(column_name) IN ('asic', 'cod_asic', 'id_asic')
    ORDER BY ordinal_position
    LIMIT 1;

    -- Estado semáforo
    SELECT column_name INTO semaforo_column
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = transito_table
      AND lower(column_name) IN ('estado_semaforo', 'semaforo', 'color')
    ORDER BY ordinal_position
    LIMIT 1;

    -- Horas de retraso
    SELECT column_name INTO horas_retraso_column
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = transito_table
      AND lower(column_name) IN ('horas_retraso', 'retraso_horas', 'horas_demora')
    ORDER BY ordinal_position
    LIMIT 1;

    -- Último reporte
    SELECT column_name INTO ultimo_reporte_column
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = transito_table
      AND lower(column_name) IN ('ultimo_reporte', 'fecha_reporte', 'fecha')
    ORDER BY ordinal_position
    LIMIT 1;

    -- Actualizado en
    SELECT column_name INTO actualizado_en_column
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = transito_table
      AND lower(column_name) IN ('actualizado_en', 'updated_at', 'fecha_actualizacion')
    ORDER BY ordinal_position
    LIMIT 1;

    -- Asignación de columnas por defecto en caso de nulo
    asic_column := COALESCE(asic_column, 'asic');
    semaforo_column := COALESCE(semaforo_column, 'estado_semaforo');
    horas_retraso_column := COALESCE(horas_retraso_column, 'horas_retraso');
    ultimo_reporte_column := COALESCE(ultimo_reporte_column, 'ultimo_reporte');
    actualizado_en_column := COALESCE(actualizado_en_column, 'actualizado_en');

    -- 3. Detectar join territorial con TASIC (por columnas existentes)
    join_cond := '';
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name IN ('TASIC','tasic')
          AND column_name IN ('id','Id','ID')
    ) THEN
        join_cond := join_cond || format('tas.id::TEXT = tr.%I', asic_column);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name IN ('TASIC','tasic')
          AND column_name ILIKE 'cod_asic'
    ) THEN
        IF join_cond <> '' THEN join_cond := join_cond || ' OR '; END IF;
        
        join_cond := join_cond || (
          SELECT format('tas.%I::TEXT = tr.%I', column_name, asic_column)
          FROM information_schema.columns
          WHERE table_schema='public'
            AND table_name IN ('TASIC','tasic')
            AND column_name ILIKE 'cod_asic'
          ORDER BY ordinal_position
          LIMIT 1
        );
    END IF;

    IF join_cond = '' THEN
        join_cond := format('tas.cod_asic::TEXT = tr.%I', asic_column); -- Fallback
    END IF;

    -- Detectar columna de eje en TASIC (para join con TEjes)
    SELECT column_name INTO eje_join_column
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'TASIC'
      AND lower(column_name) IN ('cod_eje', 'eje_id', 'id_eje')
    ORDER BY ordinal_position
    LIMIT 1;

    eje_join_column := COALESCE(eje_join_column, 'cod_eje');

    -- 4. Crear vista_unificada_territorial (dinámica)
    sql_create := format('
        CREATE OR REPLACE VIEW public.vista_unificada_territorial AS
        SELECT
            tr.id_centro,
            tr.nombre_centro,
            tr.%I AS centro_asic_cod,
            tr.%I AS estado_semaforo,
            COALESCE(tr.%I, 0) AS horas_retraso,
            tr.%I AS ultimo_reporte,
            tr.%I AS actualizado_en,
            tas.nombre_asic,
            COALESCE(tr.eje_geografico, eje.nombre_eje) AS eje_geografico,
            eje.cod_eje AS eje_id,
            tas.municipio AS nombre_municipio,
            tas.municipio_id,
            tas.parroquia AS nombre_parroquia,
            tas.parroquia_id
        FROM public.%I tr
        LEFT JOIN public."TASIC" tas ON (%s)
        LEFT JOIN public."TEjes" eje ON eje.cod_eje = tas.%I
    ',
    asic_column, semaforo_column, horas_retraso_column,
    ultimo_reporte_column, actualizado_en_column,
    transito_table, join_cond, eje_join_column
    );
    EXECUTE sql_create;
    RAISE NOTICE 'Vista vista_unificada_territorial creada';

    -- 5. Crear v_acumulado_semanal_agregado (dinámica)
    EXECUTE format($sql$
        CREATE OR REPLACE VIEW public.v_acumulado_semanal_agregado AS
        SELECT
            tr.%I AS asic,
            UPPER(COALESCE(eje.nombre_eje, tr.eje_geografico, 'Sin Eje')) AS eje_geografico,
            COUNT(tr.id_centro) AS total_centros,
            SUM(CASE WHEN tr.%I = 'Verde' THEN 1 ELSE 0 END) AS centros_verdes,
            SUM(CASE WHEN tr.%I = 'Amarillo' THEN 1 ELSE 0 END) AS centros_amarillos,
            SUM(CASE WHEN tr.%I = 'Rojo' THEN 1 ELSE 0 END) AS centros_rojos,
            ROUND(AVG(COALESCE(tr.%I, 0)))::INTEGER AS promedio_retraso,
            (COUNT(tr.id_centro) * 45
              + COALESCE((
                  SELECT COUNT(*)
                  FROM public.nominales n
                  JOIN public.%I tr2 ON tr2.nombre_centro = n.centro_salud
                  WHERE tr2.%I = tr.%I
              ), 0)
            )::INTEGER AS total_atenciones_semanales
        FROM public.%I tr
        LEFT JOIN public."TASIC" tas ON (%s)
        LEFT JOIN public."TEjes" eje ON eje.cod_eje = tas.%I
        GROUP BY tr.%I, eje.nombre_eje, tr.eje_geografico;
    $sql$, 
    asic_column, semaforo_column, semaforo_column, semaforo_column, horas_retraso_column,
    transito_table, asic_column, asic_column,
    transito_table, join_cond, eje_join_column, asic_column);
    RAISE NOTICE 'Vista v_acumulado_semanal_agregado creada';

    -- 6. Crear vistas adicionales del dashboard territorial + nominales
    -- Vista 1: Resumen territorial para tarjetas y gráficos
    EXECUTE '
        CREATE OR REPLACE VIEW public.v_dashboard_territorial AS
        SELECT
            COALESCE(eje_geografico, \'Sin eje\') AS eje,
            COUNT(DISTINCT id_centro) AS total_centros,
            SUM(CASE WHEN estado_semaforo = \'Verde\' THEN 1 ELSE 0 END) AS verdes,
            SUM(CASE WHEN estado_semaforo = \'Amarillo\' THEN 1 ELSE 0 END) AS amarillos,
            SUM(CASE WHEN estado_semaforo = \'Rojo\' THEN 1 ELSE 0 END) AS rojos,
            COALESCE(ROUND(AVG(horas_retraso))::INT, 0) AS retraso_promedio,
            (SELECT COUNT(*) FROM public.nominales WHERE fecha_registro >= CURRENT_DATE - INTERVAL \'7 days\') AS atenciones_semana
        FROM public.vista_unificada_territorial
        GROUP BY eje_geografico
        ORDER BY total_centros DESC;
    ';

    -- Vista 2: Detalle por municipio (drilldown)
    EXECUTE '
        CREATE OR REPLACE VIEW public.v_drilldown_municipio AS
        SELECT
            nombre_municipio,
            municipio_id,
            eje_geografico,
            COUNT(DISTINCT id_centro) AS centros,
            SUM(CASE WHEN estado_semaforo = \'Rojo\' THEN 1 ELSE 0 END) AS alertas_rojas,
            AVG(horas_retraso) AS retraso_promedio
        FROM public.vista_unificada_territorial
        WHERE nombre_municipio IS NOT NULL
        GROUP BY nombre_municipio, municipio_id, eje_geografico
        ORDER BY alertas_rojas DESC;
    ';

    -- Vista 3: Detalle por parroquia (drilldown)
    EXECUTE '
        CREATE OR REPLACE VIEW public.v_drilldown_parroquia AS
        SELECT
            nombre_parroquia,
            parroquia_id,
            nombre_municipio,
            COUNT(DISTINCT id_centro) AS centros,
            SUM(CASE WHEN estado_semaforo = \'Rojo\' THEN 1 ELSE 0 END) AS alertas_rojas,
            MAX(horas_retraso) AS max_retraso
        FROM public.vista_unificada_territorial
        WHERE nombre_parroquia IS NOT NULL
        GROUP BY nombre_parroquia, parroquia_id, nombre_municipio;
    ';

    -- Vista 4: Histórico nominal semanal (últimos 7 días) con tipo_registro desglosado
    EXECUTE '
        CREATE OR REPLACE VIEW public.v_nominales_semana AS
        SELECT
            n.id,
            n.centro_salud,
            n.cedula_paciente,
            n.nombre_paciente,
            n.medico_tratante,
            n.tipo_registro->>\'tipo\' AS tipo,
            n.tipo_registro->>\'descripcion\' AS descripcion,
            n.fecha_registro,
            v.eje_geografico,
            v.nombre_municipio
        FROM public.nominales n
        LEFT JOIN public.vista_unificada_territorial v ON v.nombre_centro = n.centro_salud
        WHERE n.fecha_registro >= CURRENT_DATE - INTERVAL \'7 days\'
        ORDER BY n.fecha_registro DESC;
    ';

    -- Vista 5: Exportación nominal (optimizada para grandes volúmenes)
    EXECUTE '
        CREATE OR REPLACE VIEW public.v_export_nominales AS
        SELECT
            n.id,
            n.centro_salud,
            n.cedula_paciente,
            n.nombre_paciente,
            n.medico_tratante,
            n.tipo_registro,
            n.fecha_registro,
            v.eje_geografico,
            v.nombre_asic,
            v.nombre_municipio,
            v.nombre_parroquia
        FROM public.nominales n
        INNER JOIN public.vista_unificada_territorial v ON v.nombre_centro = n.centro_salud
        ORDER BY n.fecha_registro DESC;
    ';

    -- Vista 6: Administración de centros (listado paginable con filtros)
    EXECUTE '
        CREATE OR REPLACE VIEW public.v_admin_centros AS
        SELECT
            id_centro,
            nombre_centro,
            centro_asic_cod,
            estado_semaforo,
            horas_retraso,
            ultimo_reporte,
            actualizado_en,
            nombre_asic,
            eje_geografico,
            nombre_municipio,
            nombre_parroquia
        FROM public.vista_unificada_territorial;
    ';

    -- Vista 7: Resumen por ASIC con métricas nominales reales (si existe columna de fecha en nominales)
    EXECUTE '
        CREATE OR REPLACE VIEW public.v_asic_resumen_nominal AS
        SELECT
            v.centro_asic_cod AS asic,
            v.eje_geografico,
            COUNT(DISTINCT v.id_centro) AS centros,
            COUNT(n.id) AS atenciones_ultima_semana,
            ROUND(AVG(v.horas_retraso))::INT AS retraso_promedio
        FROM public.vista_unificada_territorial v
        LEFT JOIN public.nominales n ON n.centro_salud = v.nombre_centro
            AND n.fecha_registro >= CURRENT_DATE - INTERVAL \'7 days\'
        GROUP BY v.centro_asic_cod, v.eje_geografico;
    ';

    RAISE NOTICE 'Todas las vistas fueron creadas exitosamente.';
END $$;

-- 10. FUNCIONES Y TRIGGERS
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
    UPDATE public.registros_quirurgicos
    SET 
        nombre_paciente = COALESCE(nombre_paciente, target_nombre),
        apellido_paciente = COALESCE(apellido_paciente, target_apellido),
        telefono_paciente = COALESCE(telefono_paciente, target_telefono),
        edad_paciente = COALESCE(edad_paciente, target_edad),
        sexo_paciente = COALESCE(sexo_paciente, target_sexo)
    WHERE cedula_paciente = target_cedula AND (nombre_paciente IS NULL OR nombre_paciente = '');

    UPDATE public.registros_quirurgicos
    SET 
        nombre_medico = COALESCE(nombre_medico, target_nombre),
        apellido_medico = COALESCE(apellido_medico, target_apellido),
        telefono_medico = COALESCE(telefono_medico, target_telefono)
    WHERE cedula_medico = target_cedula AND (nombre_medico IS NULL OR nombre_medico = '');

    UPDATE public.registros_obstetricos
    SET 
        nombre_madre = COALESCE(nombre_madre, target_nombre),
        apellido_madre = COALESCE(apellido_madre, target_apellido),
        telefono_madre = COALESCE(telefono_madre, target_telefono),
        edad_madre = COALESCE(edad_madre, target_edad)
    WHERE cedula_madre = target_cedula AND (nombre_madre IS NULL OR nombre_madre = '');

    UPDATE public.registros_obstetricos
    SET 
        nombre_medico = COALESCE(nombre_medico, target_nombre),
        apellido_medico = COALESCE(apellido_medico, target_apellido),
        telefono_medico = COALESCE(telefono_medico, target_telefono)
    WHERE cedula_medico = target_cedula AND (nombre_medico IS NULL OR nombre_medico = '');

    UPDATE public.registros_defunciones
    SET 
        nombre_medico = COALESCE(nombre_medico, target_nombre),
        apellido_medico = COALESCE(apellido_medico, target_apellido),
        telefono_medico = COALESCE(telefono_medico, target_telefono)
    WHERE cedula_medico = target_cedula AND (nombre_medico IS NULL OR nombre_medico = '');
END;
$$ LANGUAGE plpgsql;

-- Trigger para purgar nominales antiguos (7 días)
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

-- Trigger para crear perfil de usuario automáticamente
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
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. DATOS SEMILLA (EJES, ASICS, CLÍNICAS)
INSERT INTO public.tejes (cod_eje, nombre_eje, nombre, eje, poblacion_estimada, total_asics_oficial, total_cdis_oficial, responsable, contacto_emergencia, cumplimiento_global) VALUES
('AMI', 'Altos Mirandinos', 'Altos Mirandinos', 'Eje Altos Mirandinos', 460469, 9, 7, 'Ericka Andrelys Medina Zapata', '+58-412-4795341', 92),
('VTY', 'Valles del Tuy', 'Valles del Tuy', 'Eje Valles del Tuy', 883132, 18, 16, 'Evi Mizael Padilla Hernandez', '+58-412-9952583', 78),
('GGU', 'Guarenas - Guatire', 'Guarenas - Guatire', 'Eje Guarenas - Guatire', 497893, 9, 9, 'Maria Isabel Aguirre Marquez', '+58-424-1073830', 95),
('BAR', 'Barlovento', 'Barlovento', 'Eje Barlovento', 305313, 8, 8, 'Saudis Alexandra Herrera Ortuño', '+58-412-9111995', 84),
('MET', 'Metropolitano', 'Metropolitano', 'Eje Metropolitano', 1326302, 23, 20, 'Dra. Sofía Delgado Castro (Sinc)', 'Por definir', 70)
ON CONFLICT (cod_eje) DO UPDATE SET 
    nombre_eje = EXCLUDED.nombre_eje,
    nombre = EXCLUDED.nombre,
    eje = EXCLUDED.eje,
    poblacion_estimada = EXCLUDED.poblacion_estimada,
    responsable = EXCLUDED.responsable,
    contacto_emergencia = EXCLUDED.contacto_emergencia;

INSERT INTO public.tasic (id, cod_asic, nombre, nombre_asic, cod_eje, municipio, parroquia, poblacion_estimada, numero_centros, responsable, telefono_contacto) VALUES
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

-- 11.5. MÓDULOS DE AUDITORÍA, ADMINISTRACIÓN DE USUARIOS Y GESTIÓN NOMINAL AVANZADA

-- 11.5.1. TABLA DE AUDITORÍA REGIONAL DE SUCESOS
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id UUID,                     -- ID en auth.users / public.usuarios
    usuario_email TEXT,                  -- Email del ejecutor
    accion TEXT NOT NULL,                -- 'CREAR_USUARIO', 'EDITAR_USUARIO', 'ELIMINAR_USUARIO', 'REGISTRO_NOMINAL_CREAR', 'REGISTRO_NOMINAL_PURGA'
    tabla_afectada TEXT,                 -- Tabla sobre la que se actuó
    registro_id TEXT,                    -- ID físico del registro afectado
    detalles JSONB DEFAULT '{}'::jsonb,  -- Detalles estructurados de la operación
    fecha TIMESTAMPTZ DEFAULT NOW()      -- Sello temporal perpetuo
);

-- Habilitar RLS en auditoría
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

-- 11.5.2. ALTERACIÓN ADAPTATIVA Y COMPATIBILIDAD RETROACTIVA DE NOMINALES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='nominales' AND column_name='cedula_paciente') THEN
        ALTER TABLE public.nominales ADD COLUMN cedula_paciente VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='nominales' AND column_name='nombre_paciente') THEN
        ALTER TABLE public.nominales ADD COLUMN nombre_paciente VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='nominales' AND column_name='medico_tratante') THEN
        ALTER TABLE public.nominales ADD COLUMN medico_tratante VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='nominales' AND column_name='fecha_registro') THEN
        ALTER TABLE public.nominales ADD COLUMN fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='nominales' AND column_name='registros_quirurgicos_id') THEN
        ALTER TABLE public.nominales ADD COLUMN registros_quirurgicos_id INTEGER;
    END IF;

    UPDATE public.nominales 
    SET 
        cedula_paciente = COALESCE(cedula_paciente, cedula_principal),
        fecha_registro = COALESCE(fecha_registro, fecha_creacion),
        nombre_paciente = COALESCE(nombre_paciente, datos->>'nombre_paciente', datos->> 'nombre_madre', datos->>'nombre_fallecido', 'Paciente'),
        medico_tratante = COALESCE(medico_tratante, datos->>'nombre_medico', 'No Especificado')
    WHERE cedula_paciente IS NULL OR nombre_paciente IS NULL;
END $$;

-- 11.5.3. FUNCIONES RPC DE ADMINISTRACIÓN DE USUARIOS

-- RPC: Listado de usuarios con filtros y conteo total integrado para paginación precisa
CREATE OR REPLACE FUNCTION public.listar_usuarios(
    p_rol TEXT DEFAULT NULL,
    p_estado TEXT DEFAULT NULL,
    p_eje TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    email TEXT,
    rol TEXT,
    estado TEXT,
    id_centro TEXT,
    cod_eje TEXT,
    created_at TIMESTAMPTZ,
    total_count BIGINT
) AS $$
DECLARE
    v_total_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_total_count
    FROM public.usuarios u
    WHERE (p_rol IS NULL OR u.rol = p_rol)
      AND (p_estado IS NULL OR u.estado = p_estado)
      AND (p_eje IS NULL OR u.cod_eje = p_eje);

    RETURN QUERY
    SELECT 
        u.id,
        u.nombre,
        u.email,
        u.rol,
        u.estado,
        u.id_centro,
        u.cod_eje,
        u.created_at,
        v_total_count
    FROM public.usuarios u
    WHERE (p_rol IS NULL OR u.rol = p_rol)
      AND (p_estado IS NULL OR u.estado = p_estado)
      AND (p_eje IS NULL OR u.cod_eje = p_eje)
    ORDER BY u.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Crear o invitar usuario desde la administración (con validación de rol operador)
CREATE OR REPLACE FUNCTION public.crear_usuario_admin(
    p_id UUID,
    p_nombre TEXT,
    p_email TEXT,
    p_rol TEXT,
    p_estado TEXT DEFAULT 'aprobado',
    p_id_centro TEXT DEFAULT NULL,
    p_cod_eje TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_operador_rol TEXT;
    v_operador_email TEXT;
BEGIN
    SELECT rol, email INTO v_operador_rol, v_operador_email
    FROM public.usuarios
    WHERE id = auth.uid();

    IF COALESCE(v_operador_rol, '') NOT IN ('admin', 'directivo') AND auth.role() <> 'service_role' THEN
        RAISE EXCEPTION 'Acceso denegado. Solo administradores o supervisores pueden registrar usuarios.';
    END IF;

    IF p_id IS NULL OR p_nombre IS NULL OR p_email IS NULL OR p_rol IS NULL THEN
        RAISE EXCEPTION 'Parámetros obligatorios faltantes (id, nombre, email, rol).';
    END IF;

    IF p_rol NOT IN ('admin', 'directivo', 'oficina', 'nominal') THEN
        RAISE EXCEPTION 'Rol inválido. Debe ser: admin, directivo, oficina o nominal.';
    END IF;

    INSERT INTO public.usuarios (id, nombre, email, rol, estado, id_centro, cod_eje)
    VALUES (p_id, p_nombre, p_email, p_rol, p_estado, p_id_centro, p_cod_eje)
    ON CONFLICT (id) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        email = EXCLUDED.email,
        rol = EXCLUDED.rol,
        estado = EXCLUDED.estado,
        id_centro = EXCLUDED.id_centro,
        cod_eje = EXCLUDED.cod_eje;

    INSERT INTO public.logs_auditoria (usuario_id, usuario_email, accion, tabla_afectada, registro_id, detalles)
    VALUES (
        auth.uid(),
        v_operador_email,
        'CREAR_USUARIO',
        'usuarios',
        p_id::TEXT,
        jsonb_build_object(
            'id', p_id,
            'nombre', p_nombre,
            'email', p_email,
            'rol', p_rol,
            'estado', p_estado,
            'id_centro', p_id_centro,
            'cod_eje', p_cod_eje
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Usuario registrado y perfil sincronizado exitosamente.',
        'usuario_id', p_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Editar rol, estado y adscripción de usuario de forma segura
CREATE OR REPLACE FUNCTION public.editar_usuario(
    p_id UUID,
    p_nombre TEXT DEFAULT NULL,
    p_rol TEXT DEFAULT NULL,
    p_estado TEXT DEFAULT NULL,
    p_id_centro TEXT DEFAULT NULL,
    p_cod_eje TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_operador_rol TEXT;
    v_operador_email TEXT;
    v_old_usuario RECORD;
BEGIN
    SELECT rol, email INTO v_operador_rol, v_operador_email
    FROM public.usuarios
    WHERE id = auth.uid();

    IF COALESCE(v_operador_rol, '') NOT IN ('admin') AND auth.role() <> 'service_role' THEN
        RAISE EXCEPTION 'Acceso denegado. Solo administradores pueden modificar perfiles.';
    END IF;

    SELECT * INTO v_old_usuario FROM public.usuarios WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario con ID % no encontrado.', p_id;
    END IF;

    UPDATE public.usuarios SET
        nombre = COALESCE(p_nombre, nombre),
        rol = COALESCE(p_rol, rol),
        estado = COALESCE(p_estado, estado),
        id_centro = CASE WHEN p_id_centro IS NOT NULL THEN p_id_centro ELSE id_centro END,
        cod_eje = CASE WHEN p_cod_eje IS NOT NULL THEN p_cod_eje ELSE cod_eje END
    WHERE id = p_id;

    INSERT INTO public.logs_auditoria (usuario_id, usuario_email, accion, tabla_afectada, registro_id, detalles)
    VALUES (
        auth.uid(),
        v_operador_email,
        'EDITAR_USUARIO',
        'usuarios',
        p_id::TEXT,
        jsonb_build_object(
            'id_usuario_editado', p_id,
            'modificaciones', jsonb_build_object(
                'nombre', p_nombre,
                'rol', p_rol,
                'estado', p_estado,
                'id_centro', p_id_centro,
                'cod_eje', p_cod_eje
            ),
            'valores_anteriores', jsonb_build_object(
                'nombre', v_old_usuario.nombre,
                'rol', v_old_usuario.rol,
                'estado', v_old_usuario.estado,
                'id_centro', v_old_usuario.id_centro,
                'cod_eje', v_old_usuario.cod_eje
            )
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Usuario modificado exitosamente.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Eliminar físicamente un perfil de usuario (restringido a administradores)
CREATE OR REPLACE FUNCTION public.eliminar_usuario(
    p_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_operador_rol TEXT;
    v_operador_email TEXT;
    v_old_usuario RECORD;
BEGIN
    SELECT rol, email INTO v_operador_rol, v_operador_email
    FROM public.usuarios
    WHERE id = auth.uid();

    IF COALESCE(v_operador_rol, '') NOT IN ('admin') AND auth.role() <> 'service_role' THEN
        RAISE EXCEPTION 'Acceso denegado. Solo administradores pueden eliminar usuarios.';
    END IF;

    SELECT * INTO v_old_usuario FROM public.usuarios WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario con ID % no encontrado.', p_id;
    END IF;

    DELETE FROM public.usuarios WHERE id = p_id;

    INSERT INTO public.logs_auditoria (usuario_id, usuario_email, accion, tabla_afectada, registro_id, detalles)
    VALUES (
        auth.uid(),
        v_operador_email,
        'ELIMINAR_USUARIO',
        'usuarios',
        p_id::TEXT,
        jsonb_build_object(
            'id_usuario_eliminado', p_id,
            'nombre', v_old_usuario.nombre,
            'email', v_old_usuario.email,
            'rol', v_old_usuario.rol
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Perfil eliminado correctamente.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 11.5.4. FUNCIONES RPC DEL MÓDULO NOMINAL (PACIENTES Y ATENCIONES)

-- RPC: Búsqueda incremental por cédula (Autocomplete)
CREATE OR REPLACE FUNCTION public.pacientes_autocomplete_cedula(
    p_prefix TEXT,
    p_lim INTEGER DEFAULT 10
)
RETURNS TABLE (
    cedula VARCHAR,
    nombre VARCHAR,
    apellido VARCHAR,
    edad INTEGER,
    sexo VARCHAR,
    telefono VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.cedula,
        p.nombre,
        p.apellido,
        p.edad,
        p.sexo,
        p.telefono
    FROM public.pacientes p
    WHERE p.cedula ILIKE trim(p_prefix) || '%'
    ORDER BY p.cedula ASC
    LIMIT p_lim;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Validación de existencia del Médico Tratante
CREATE OR REPLACE FUNCTION public.validar_medico_tratante(
    p_cedula TEXT
)
RETURNS TABLE (
    existe BOOLEAN,
    nombre VARCHAR,
    apellido VARCHAR,
    telefono VARCHAR
) AS $$
DECLARE
    v_nombre VARCHAR;
    v_apellido VARCHAR;
    v_telefono VARCHAR;
    v_existe BOOLEAN := FALSE;
    v_table_name TEXT;
BEGIN
    SELECT relname INTO v_table_name
    FROM pg_class
    WHERE relkind = 'r'
      AND relnamespace = 'public'::regnamespace
      AND lower(relname) IN ('datos_del_medico_tratante', 'medicos', 'ppersonal');

    IF v_table_name IS NOT NULL THEN
        EXECUTE format('
            SELECT TRUE, nombre, apellido, telefono 
            FROM public.%I 
            WHERE cedula = $1 
            LIMIT 1', v_table_name)
        USING trim(p_cedula)
        INTO v_existe, v_nombre, v_apellido, v_telefono;
    END IF;

    RETURN QUERY SELECT COALESCE(v_existe, FALSE), v_nombre, v_apellido, v_telefono;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Inserción Atómica y Transaccional de Registros Nominales
CREATE OR REPLACE FUNCTION public.insertar_registro_nominal(
    p_tipo_registro TEXT,             -- 'quirurgica', 'obstetrica', 'defuncion'
    p_centro_salud TEXT,              -- Centro de adscripción
    
    -- Información del paciente
    p_cedula_paciente TEXT,
    p_nombre_paciente TEXT,
    p_apellido_paciente TEXT,
    p_edad_paciente INTEGER,
    p_sexo_paciente TEXT,
    p_telefono_paciente TEXT DEFAULT NULL,
    
    -- Información del médico tratante
    p_cedula_medico TEXT DEFAULT NULL,
    p_nombre_medico TEXT DEFAULT NULL,
    p_apellido_medico TEXT DEFAULT NULL,
    p_telefono_medico TEXT DEFAULT NULL,
    
    -- Carga dinámica JSON para atributos específicos
    p_datos_registro JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_operador_rol TEXT;
    v_operador_email TEXT;
    v_registro_id INTEGER;
    v_nominal_id INTEGER;
    v_combined_data JSONB;
    v_medico_table TEXT;
BEGIN
    SELECT rol, email INTO v_operador_rol, v_operador_email
    FROM public.usuarios
    WHERE id = auth.uid();

    IF v_operador_rol IS NULL AND auth.role() <> 'service_role' THEN
        RAISE EXCEPTION 'Acceso denegado. No tiene un perfil activo asignado.';
    END IF;

    p_cedula_paciente   := trim(p_cedula_paciente);
    p_nombre_paciente   := upper(trim(p_nombre_paciente));
    p_apellido_paciente := upper(trim(p_apellido_paciente));
    p_cedula_medico     := trim(p_cedula_medico);

    INSERT INTO public.pacientes (cedula, nombre, apellido, edad, sexo, telefono)
    VALUES (p_cedula_paciente, p_nombre_paciente, p_apellido_paciente, p_edad_paciente, p_sexo_paciente, trim(p_telefono_paciente))
    ON CONFLICT (cedula) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        apellido = EXCLUDED.apellido,
        edad = EXCLUDED.edad,
        sexo = EXCLUDED.sexo,
        telefono = COALESCE(trim(EXCLUDED.telefono), pacientes.telefono);

    SELECT relname INTO v_medico_table
    FROM pg_class
    WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace AND lower(relname) = 'datos_del_medico_tratante';

    IF p_cedula_medico IS NOT NULL AND p_cedula_medico <> '' THEN
        IF v_medico_table IS NOT NULL THEN
            EXECUTE format('
                INSERT INTO public.%I (cedula, nombre, apellido, telefono)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (cedula) DO UPDATE SET
                    nombre = EXCLUDED.nombre,
                    apellido = EXCLUDED.apellido,
                    telefono = COALESCE(EXCLUDED.telefono, public.%I.telefono)
            ', v_medico_table, v_medico_table)
            USING 
                p_cedula_medico, 
                upper(trim(COALESCE(p_nombre_medico, 'MÉDICO'))), 
                upper(trim(COALESCE(p_apellido_medico, 'TRATANTE'))), 
                trim(p_telefono_medico);
        ELSE
            INSERT INTO public.medicos (cedula, nombre, apellido, telefono)
            VALUES (p_cedula_medico, upper(trim(COALESCE(p_nombre_medico, 'MÉDICO'))), upper(trim(COALESCE(p_apellido_medico, 'TRATANTE'))), trim(p_telefono_medico))
            ON CONFLICT (cedula) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                apellido = EXCLUDED.apellido,
                telefono = COALESCE(trim(EXCLUDED.telefono), medicos.telefono);
        END IF;
    END IF;

    IF p_tipo_registro = 'quirurgica' THEN
        INSERT INTO public.registros_quirurgicos (
            centro_salud, cedula_paciente, nombre_paciente, apellido_paciente, edad_paciente, sexo_paciente, telefono_paciente,
            especialidad_quirurgica, tipo_intervencion, urgente_electiva, cantidad_intervencion,
            nombre_medico, apellido_medico, cedula_medico, telefono_medico
        ) 
        VALUES (
            p_centro_salud, p_cedula_paciente, p_nombre_paciente, p_apellido_paciente, p_edad_paciente, p_sexo_paciente, trim(p_telefono_paciente),
            COALESCE(p_datos_registro->>'especialidad_quirurgica', 'General'),
            COALESCE(p_datos_registro->>'tipo_intervencion', 'Cirugía General'),
            COALESCE(p_datos_registro->>'urgente_electiva', 'Electiva'),
            COALESCE((p_datos_registro->>'cantidad_intervencion')::INTEGER, 1),
            upper(trim(p_nombre_medico)), upper(trim(p_apellido_medico)), p_cedula_medico, trim(p_telefono_medico)
        )
        RETURNING id INTO v_registro_id;

        v_combined_data := jsonb_build_object(
            'tipo', 'Intervención Quirúrgica',
            'descripcion', COALESCE(p_datos_registro->>'tipo_intervencion', 'Procedimiento Quirúrgico'),
            'paciente', jsonb_build_object('cedula', p_cedula_paciente, 'nombre', p_nombre_paciente, 'apellido', p_apellido_paciente, 'edad', p_edad_paciente, 'sexo', p_sexo_paciente),
            'medico', jsonb_build_object('cedula', p_cedula_medico, 'nombre', p_nombre_medico, 'apellido', p_apellido_medico),
            'detalles', p_datos_registro
        );

    ELSIF p_tipo_registro = 'obstetrica' THEN
        INSERT INTO public.registros_obstetricos (
            centro_salud, cedula_madre, nombre_madre, apellido_madre, edad_madre, telefono_madre,
            nombre_infante, sexo_infante, tipo_parto, tipo_intervencion,
            nombre_medico, apellido_medico, cedula_medico, telefono_medico
        )
        VALUES (
            p_centro_salud, p_cedula_paciente, p_nombre_paciente, p_apellido_paciente, p_edad_paciente, trim(p_telefono_paciente),
            COALESCE(p_datos_registro->>'nombre_infante', 'Recién Nacido'),
            COALESCE(p_datos_registro->>'sexo_infante', 'Sin Definir'),
            COALESCE(p_datos_registro->>'tipo_parto', 'Eutócico'),
            COALESCE(p_datos_registro->>'tipo_intervencion', 'Parto'),
            upper(trim(p_nombre_medico)), upper(trim(p_apellido_medico)), p_cedula_medico, trim(p_telefono_medico)
        )
        RETURNING id INTO v_registro_id;

        v_combined_data := jsonb_build_object(
            'tipo', 'Atención Obstétrica',
            'descripcion', COALESCE(p_datos_registro->>'tipo_parto', 'Parto'),
            'paciente', jsonb_build_object('cedula', p_cedula_paciente, 'nombre', p_nombre_paciente, 'apellido', p_apellido_paciente, 'edad', p_edad_paciente),
            'medico', jsonb_build_object('cedula', p_cedula_medico, 'nombre', p_nombre_medico, 'apellido', p_apellido_medico),
            'detalles', p_datos_registro
        );

    ELSIF p_tipo_registro = 'defuncion' THEN
        INSERT INTO public.registros_defunciones (
            centro_salud, cedula_fallecido, nombre_fallecido, apellido_fallecido, edad_fallecido, sexo_fallecido,
            hora_fallecimiento, patologia, observacion,
            nombre_medico, apellido_medico, cedula_medico, telefono_medico
        )
        VALUES (
            p_centro_salud, p_cedula_paciente, p_nombre_paciente, p_apellido_paciente, p_edad_paciente, p_sexo_paciente,
            COALESCE(p_datos_registro->>'hora_fallecimiento', '12:00 PM'),
            COALESCE(p_datos_registro->>'patologia', 'No Informada'),
            COALESCE(p_datos_registro->>'observacion', ''),
            upper(trim(p_nombre_medico)), upper(trim(p_apellido_medico)), p_cedula_medico, trim(p_telefono_medico)
        )
        RETURNING id INTO v_registro_id;

        v_combined_data := jsonb_build_object(
            'tipo', 'Registro de Defunción',
            'descripcion', COALESCE(p_datos_registro->>'patologia', 'Fallecimiento'),
            'paciente', jsonb_build_object('cedula', p_cedula_paciente, 'nombre', p_nombre_paciente, 'apellido', p_apellido_paciente, 'edad', p_edad_paciente),
            'medico', jsonb_build_object('cedula', p_cedula_medico, 'nombre', p_nombre_medico, 'apellido', p_apellido_medico),
            'detalles', p_datos_registro
        );
    ELSE
        RAISE EXCEPTION 'Tipo de registro % inválido. Use quirurgica, obstetrica o defuncion.', p_tipo_registro;
    END IF;

    INSERT INTO public.nominales (
        tipo_registro,
        registro_id,
        registros_quirurgicos_id,
        cedula_principal,
        cedula_paciente,
        nombre_paciente,
        medico_tratante,
        centro_salud,
        fecha_registro,
        fecha_creacion,
        datos
    )
    VALUES (
        p_tipo_registro,
        v_registro_id,
        CASE WHEN p_tipo_registro = 'quirurgica' THEN v_registro_id ELSE NULL END,
        p_cedula_paciente,
        p_cedula_paciente,
        p_nombre_paciente || ' ' || p_apellido_paciente,
        COALESCE(p_nombre_medico || ' ' || p_apellido_medico, 'No Especificado'),
        p_centro_salud,
        NOW(),
        NOW(),
        v_combined_data
    )
    RETURNING id INTO v_nominal_id;

    INSERT INTO public.logs_auditoria (usuario_id, usuario_email, accion, tabla_afectada, registro_id, detalles)
    VALUES (
        auth.uid(),
        v_operador_email,
        'REGISTRO_NOMINAL_CREAR',
        p_tipo_registro,
        v_registro_id::TEXT,
        jsonb_build_object(
            'nominal_id', v_nominal_id,
            'paciente', p_cedula_paciente,
            'centro_salud', p_centro_salud
        )
    );

    RETURN jsonb_build_object(
         'success', true,
         'message', 'Registro nominal guardado de forma atómica regional exitosamente.',
         'registro_id', v_registro_id,
         'nominal_id', v_nominal_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Purga Manual
CREATE OR REPLACE FUNCTION public.purga_automatica_nominales(
    p_dias_retencion INT DEFAULT 7
)
RETURNS JSONB AS $$
DECLARE
    v_operador_rol TEXT;
    v_operador_email TEXT;
    v_filas_afectadas INTEGER;
BEGIN
    IF auth.role() <> 'service_role' THEN
        SELECT rol, email INTO v_operador_rol, v_operador_email
        FROM public.usuarios
        WHERE id = auth.uid();

        IF COALESCE(v_operador_rol, '') <> 'admin' THEN
            RAISE EXCEPTION 'Acceso denegado. Solo administradores pueden realizar purgas manuales.';
        END IF;
    ELSE
        v_operador_email := 'SYSTEM/SERVICE';
    END IF;

    DELETE FROM public.nominales
    WHERE fecha_creacion < (NOW() - (p_dias_retencion || ' days')::INTERVAL);

    GET DIAGNOSTICS v_filas_afectadas = ROW_COUNT;

    IF v_filas_afectadas > 0 THEN
        INSERT INTO public.logs_auditoria (usuario_id, usuario_email, accion, tabla_afectada, detalles)
        VALUES (
            auth.uid(),
            v_operador_email,
            'REGISTRO_NOMINAL_PURGA',
            'nominales',
            jsonb_build_object(
                'filas_afectadas', v_filas_afectadas,
                'dias_retencion', p_dias_retencion
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'filas_purgadas', v_filas_afectadas,
        'fecha_corte', (NOW() - (p_dias_retencion || ' days')::INTERVAL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 11.5.5. VISTA DE CONEXIÓN NOMINAL DETALLADA
CREATE OR REPLACE VIEW public.v_nominales_detallado AS
SELECT
    n.id AS nominal_id,
    n.tipo_registro,
    n.registro_id,
    n.cedula_principal,
    n.cedula_paciente,
    n.nombre_paciente,
    n.medico_tratante,
    n.centro_salud,
    n.fecha_registro,
    n.fecha_creacion,
    n.datos,
    v.eje_id,
    v.eje_geografico,
    v.nombre_asic,
    v.centro_asic_cod,
    v.nombre_municipio,
    v.municipio_id,
    v.nombre_parroquia,
    v.parroquia_id,
    v.estado_semaforo AS centro_status,
    v.horas_retraso AS centro_retraso
FROM public.nominales n
LEFT JOIN public.vista_unificada_territorial v ON v.nombre_centro = n.centro_salud;


-- 12. NOTIFICACIÓN DE REFRESCO DE ESQUEMA PARA POSTGREST
NOTIFY pgrst, 'reload schema';