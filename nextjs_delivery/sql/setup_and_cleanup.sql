-- =========================================================================
-- SYSTEMA DE INFORMACIÓN NOMINAL MIRANDA SALUD 2026
-- SCRIPT DE ESTRUCTURAS SQL Y LIMPIEZA AUTOMÁTICA EN SUPABASE
-- =========================================================================
-- Ejecutar este script en el SQL Editor de su Dashboard de Supabase.

-- 1. Asegurar Tabla Maestras "pacientes" (Ya existente, con nombres de columnas solicitados)
CREATE TABLE IF NOT EXISTS public.pacientes (
    "Cedula" TEXT PRIMARY KEY,
    "Nacionalidad" TEXT DEFAULT 'V',
    "Nombre y Apellido" TEXT NOT NULL,
    "Sexo" TEXT CHECK ("Sexo" IN ('FEMENINO', 'MASCULINO')),
    "F_Nac" DATE,
    "Edad" TEXT,
    "Movil01" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para pacientes
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir select para usuarios autenticados" ON public.pacientes
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir insert/update para usuarios autenticados" ON public.pacientes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 2. Asegurar Tabla Maestra "DATOS_DEL_MEDICO_TRATANTE" (Ya existente, con espacios en nombres de columnas)
CREATE TABLE IF NOT EXISTS public."DATOS_DEL_MEDICO_TRATANTE" (
    "Cedula" TEXT PRIMARY KEY,
    "Nacionalidad" TEXT DEFAULT 'V',
    "Nombre y Apellido" TEXT NOT NULL,
    "Sexo" TEXT CHECK ("Sexo" IN ('FEMENINO', 'MASCULINO')),
    "Movil01" TEXT,
    "Correo Personal" TEXT,
    "Especialidad" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para medicos
ALTER TABLE public."DATOS_DEL_MEDICO_TRATANTE" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir select medicos para autenticados" ON public."DATOS_DEL_MEDICO_TRATANTE"
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir insert/update medicos para autenticados" ON public."DATOS_DEL_MEDICO_TRATANTE"
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 3. Tabla "registros_quirurgicos" (Exactos nombres sin espacios y minúsculas)
CREATE TABLE IF NOT EXISTS public.registros_quirurgicos (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado TEXT NOT NULL DEFAULT 'MIRANDA',
    centro_salud TEXT NOT NULL,
    
    -- Paciente
    cedula_paciente TEXT NOT NULL REFERENCES public.pacientes("Cedula") ON DELETE SET NULL,
    nombre_paciente TEXT NOT NULL,
    apellido_paciente TEXT NOT NULL,
    edad_paciente INTEGER NOT NULL,
    sexo_paciente TEXT CHECK (sexo_paciente IN ('FEMENINO', 'MASCULINO')),
    telefono_paciente TEXT,
    
    -- Intervención
    especialidad_quirurgica TEXT NOT NULL,
    tipo_intervencion TEXT NOT NULL,
    urgente_electiva TEXT CHECK (urgente_electiva IN ('URGENTE', 'ELECTIVA')) DEFAULT 'ELECTIVA',
    cantidad_intervencion INTEGER NOT NULL DEFAULT 1,
    
    -- Médico Tratante
    cedula_medico TEXT REFERENCES public."DATOS_DEL_MEDICO_TRATANTE"("Cedula") ON DELETE SET NULL,
    nombre_medico TEXT NOT NULL,
    apellido_medico TEXT NOT NULL,
    telefono_medico TEXT,
    
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.registros_quirurgicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total registros_quirurgicos" ON public.registros_quirurgicos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 4. Tabla "registros_obstetricos" 
CREATE TABLE IF NOT EXISTS public.registros_obstetricos (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado TEXT NOT NULL DEFAULT 'MIRANDA',
    centro_salud TEXT NOT NULL,
    
    -- Madre
    cedula_madre TEXT NOT NULL REFERENCES public.pacientes("Cedula") ON DELETE SET NULL,
    nombre_madre TEXT NOT NULL,
    apellido_madre TEXT NOT NULL,
    edad_madre INTEGER NOT NULL,
    telefono_madre TEXT,
    
    -- Neonato / Parto
    nombre_infante TEXT NOT NULL,
    sexo_infante TEXT CHECK (sexo_infante IN ('FEMENINO', 'MASCULINO')),
    tipo_parto TEXT CHECK (tipo_parto IN ('EUTÓCICO', 'DISTÓCICO')) DEFAULT 'EUTÓCICO',
    tipo_intervencion TEXT CHECK (tipo_intervencion IN ('NATURAL', 'CESÁREA')) DEFAULT 'NATURAL',
    
    -- Médico Tratante
    cedula_medico TEXT REFERENCES public."DATOS_DEL_MEDICO_TRATANTE"("Cedula") ON DELETE SET NULL,
    nombre_medico TEXT NOT NULL,
    apellido_medico TEXT NOT NULL,
    telefono_medico TEXT,
    
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.registros_obstetricos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total registros_obstetricos" ON public.registros_obstetricos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 5. Tabla "registros_defunciones"
CREATE TABLE IF NOT EXISTS public.registros_defunciones (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado TEXT NOT NULL DEFAULT 'MIRANDA',
    centro_salud TEXT NOT NULL,
    
    -- Fallecido
    cedula_fallecido TEXT REFERENCES public.pacientes("Cedula") ON DELETE SET NULL,
    nombre_fallecido TEXT NOT NULL,
    apellido_fallecido TEXT NOT NULL,
    edad_fallecido INTEGER NOT NULL,
    sexo_fallecido TEXT CHECK (sexo_fallecido IN ('FEMENINO', 'MASCULINO')),
    
    -- Defunción
    hora_fallecimiento TEXT NOT NULL, -- Ej: "14:45"
    patologia TEXT NOT NULL,
    observacion TEXT,
    
    -- Médico Certificante
    cedula_medico TEXT REFERENCES public."DATOS_DEL_MEDICO_TRATANTE"("Cedula") ON DELETE SET NULL,
    nombre_medico TEXT NOT NULL,
    apellido_medico TEXT NOT NULL,
    telefono_medico TEXT,
    
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.registros_defunciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total registros_defunciones" ON public.registros_defunciones
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 6. Tabla "nominales" (Auditoría/Bitácora de Sincronización Temporal de 7 Días)
CREATE TABLE IF NOT EXISTS public.nominales (
    id SERIAL PRIMARY KEY,
    tipo_registro TEXT NOT NULL, -- 'quirurgica', 'obstetrica', 'defuncion'
    registro_id INTEGER,         -- ID asignado en la tabla específica
    cedula_principal TEXT,       -- Cédula del paciente/madre/fallecido para búsqueda rápida
    centro_salud TEXT NOT NULL,
    datos JSONB NOT NULL,        -- Copia íntegra de la transacción en JSON
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.nominales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total nominales" ON public.nominales
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- =========================================================================
-- 7. LÓGICA DE LIMPIEZA AUTOMÁTICA DE REGISTROS ANTIGUOS EN NOMINALES (> 7 DÍAS)
-- =========================================================================

-- Opción A: Función de purga de base de datos
CREATE OR REPLACE FUNCTION public.purgar_nominales_antiguos()
RETURNS INTEGER AS $$
DECLARE
    deleted_rows INTEGER;
BEGIN
    DELETE FROM public.nominales
    WHERE fecha_creacion < (NOW() - INTERVAL '7 days');
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    RAISE NOTICE 'Se purgaron % registros antiguos de la tabla de nominales.', deleted_rows;
    RETURN deleted_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Opción B: Automatización vía Supabase pg_cron (Si el proyecto lo tiene activado)
-- SELECT cron.schedule(
--   'purgar-nominales-diario',  -- Identificador del cron job
--   '0 0 * * *',                -- Se ejecuta todos los días a la medianoche (UTC)
--   'SELECT public.purgar_nominales_antiguos()'
-- );


-- Opción C: Trigger de Auto-Limpieza al Insertar (Ideal si no hay soporte para pg_cron)
-- Se ejecuta con cada inserción en la tabla de nominales para garantizar un espacio máximo de 7 días.
CREATE OR REPLACE FUNCTION public.trigger_purgar_nominales()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.nominales
    WHERE fecha_creacion < (NOW() - INTERVAL '7 days');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_purgar_nominales_on_insert ON public.nominales;
CREATE TRIGGER trg_purgar_nominales_on_insert
    AFTER INSERT ON public.nominales
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_purgar_nominales();
