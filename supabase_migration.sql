-- =========================================================================
-- SCRIPT DE MIGRACIÓN DE TABLAS DE REPORTES NOMINALES - MIRANDA SALUD 2026
-- =========================================================================
-- Este script debe ser ejecutado en el editor SQL de Supabase para habilitar 
-- las tablas nominal-quirúrgica, nominal-obstétrica, nominal-defunción, 
-- el catálogo de pacientes y médicos, y la retención autolimpiable de 7 días.

-- 1. TABLA MAESTRA DE PACIENTES
CREATE TABLE IF NOT EXISTS pacientes (
    cedula VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    edad INTEGER NOT NULL,
    sexo VARCHAR(50) NOT NULL,
    telefono VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA MAESTRA DE MEDICOS TRATANTES
CREATE TABLE IF NOT EXISTS "DATOS_DEL_MEDICO_TRATANTE" (
    cedula VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    telefono VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. REGISTROS QUIRÚRGICOS
CREATE TABLE IF NOT EXISTS registros_quirurgicos (
    id SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(100) DEFAULT 'MIRANDA',
    centro_salud VARCHAR(255) NOT NULL,
    cedula_paciente VARCHAR(50) REFERENCES pacientes(cedula) ON UPDATE CASCADE,
    nombre_paciente VARCHAR(255),
    apellido_paciente VARCHAR(255),
    edad_paciente INTEGER,
    sexo_paciente VARCHAR(50),
    telefono_paciente VARCHAR(150),
    especialidad_quirurgica VARCHAR(255) NOT NULL,
    tipo_intervencion VARCHAR(255) NOT NULL,
    urgente_electiva VARCHAR(50) NOT NULL, -- 'URGENTE' o 'ELECTIVA'
    cantidad_intervencion INTEGER DEFAULT 1,
    nombre_medico VARCHAR(255),
    apellido_medico VARCHAR(255),
    cedula_medico VARCHAR(50) REFERENCES "DATOS_DEL_MEDICO_TRATANTE"(cedula) ON UPDATE CASCADE,
    telefono_medico VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. REGISTROS OBSTÉTRICOS
CREATE TABLE IF NOT EXISTS registros_obstetricos (
    id SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(100) DEFAULT 'MIRANDA',
    centro_salud VARCHAR(255) NOT NULL,
    cedula_madre VARCHAR(50) REFERENCES pacientes(cedula) ON UPDATE CASCADE,
    nombre_madre VARCHAR(255),
    apellido_madre VARCHAR(255),
    edad_madre INTEGER,
    telefono_madre VARCHAR(150),
    nombre_infante VARCHAR(255),
    sexo_infante VARCHAR(50),
    tipo_parto VARCHAR(100) NOT NULL, -- 'EUTÓCICO' o 'DISTÓCICO'
    tipo_intervencion VARCHAR(100) NOT NULL, -- 'NATURAL' o 'CESÁREA'
    nombre_medico VARCHAR(255),
    apellido_medico VARCHAR(255),
    cedula_medico VARCHAR(50) REFERENCES "DATOS_DEL_MEDICO_TRATANTE"(cedula) ON UPDATE CASCADE,
    telefono_medico VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. REGISTROS DE DEFUNCIONES
CREATE TABLE IF NOT EXISTS registros_defunciones (
    id SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(100) DEFAULT 'MIRANDA',
    centro_salud VARCHAR(255) NOT NULL,
    cedula_fallecido VARCHAR(50), -- Hacemos opcional FK o un campo texto tradicional según el caso
    nombre_fallecido VARCHAR(255) NOT NULL,
    apellido_fallecido VARCHAR(255) NOT NULL,
    edad_fallecido INTEGER NOT NULL,
    sexo_fallecido VARCHAR(50) NOT NULL,
    hora_fallecimiento VARCHAR(100) NOT NULL,
    patologia VARCHAR(500) NOT NULL,
    observacion TEXT,
    nombre_medico VARCHAR(255),
    apellido_medico VARCHAR(255),
    cedula_medico VARCHAR(50) REFERENCES "DATOS_DEL_MEDICO_TRATANTE"(cedula) ON UPDATE CASCADE,
    telefono_medico VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA GENERAL "NOMINALES" DE RETENCIÓN TEMPORAL (7 DIAS)
CREATE TABLE IF NOT EXISTS nominales (
    id SERIAL PRIMARY KEY,
    tipo_registro VARCHAR(100) NOT NULL, -- 'quirurgica', 'obstetrica', 'defuncion'
    registro_id INTEGER NOT NULL,
    cedula_principal VARCHAR(50) NOT NULL, -- cedula paciente, madre o fallecido
    centro_salud VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    datos JSONB NOT NULL
);

-- Creación de Índices para velocidad de búsqueda por cédula
CREATE INDEX IF NOT EXISTS idx_pacientes_cedula ON pacientes(cedula);
CREATE INDEX IF NOT EXISTS idx_medicos_cedula ON "DATOS_DEL_MEDICO_TRATANTE"(cedula);
CREATE INDEX IF NOT EXISTS idx_nominales_tipo ON nominales(tipo_registro);
CREATE INDEX IF NOT EXISTS idx_nominales_fecha_creacion ON nominales(fecha_creacion);

-- =========================================================================
-- 7. FUNCIÓN Y ENROQUE DE RETENCIÓN AUTOMÁTICA (7 DÍAS LLAVE EN SUPABASE)
-- =========================================================================
-- Esta función purga automáticamente todos los registros con más de 7 días
CREATE OR REPLACE FUNCTION purgar_nominales_antiguos()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM nominales 
    WHERE fecha_creacion < NOW() - INTERVAL '7 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la limpieza de registros antiguos cada vez que se inserta un nuevo registro
DROP TRIGGER IF EXISTS tr_purgar_nominales ON nominales;
CREATE TRIGGER tr_purgar_nominales
AFTER INSERT ON nominales
FOR EACH STATEMENT
EXECUTE FUNCTION purgar_nominales_antiguos();

-- =========================================================================
-- 8. FUNCIÓN ALMACENADA PARA PROPAGAR REAJUSTED DE PACIENTES/MEDICOS
-- =========================================================================
-- Reajusta referencias vacías en tablas previas cuando se guarda un paciente/médico
CREATE OR REPLACE FUNCTION propagar_datos_por_cedula(target_cedula VARCHAR, target_nombre VARCHAR, target_apellido VARCHAR, target_telefono VARCHAR, target_edad INTEGER, target_sexo VARCHAR)
RETURNS VOID AS $$
BEGIN
    -- Actualizar quirúrgicas vacías
    UPDATE registros_quirurgicos
    SET 
        nombre_paciente = COALESCE(nombre_paciente, target_nombre),
        apellido_paciente = COALESCE(apellido_paciente, target_apellido),
        telefono_paciente = COALESCE(telefono_paciente, target_telefono),
        edad_paciente = COALESCE(edad_paciente, target_edad),
        sexo_paciente = COALESCE(sexo_paciente, target_sexo)
    WHERE cedula_paciente = target_cedula AND (nombre_paciente IS NULL OR nombre_paciente = '');

    -- Actualizar quirúrgicas vacías del médico
    UPDATE registros_quirurgicos
    SET 
        nombre_medico = COALESCE(nombre_medico, target_nombre),
        apellido_medico = COALESCE(apellido_medico, target_apellido),
        telefono_medico = COALESCE(telefono_medico, target_telefono)
    WHERE cedula_medico = target_cedula AND (nombre_medico IS NULL OR nombre_medico = '');

    -- Actualizar obstétricas vacías de la madre
    UPDATE registros_obstetricos
    SET 
        nombre_madre = COALESCE(nombre_madre, target_nombre),
        apellido_madre = COALESCE(apellido_madre, target_apellido),
        telefono_madre = COALESCE(telefono_madre, target_telefono),
        edad_madre = COALESCE(edad_madre, target_edad)
    WHERE cedula_madre = target_cedula AND (nombre_madre IS NULL OR nombre_madre = '');

    -- Actualizar obstétricas vacías del médico
    UPDATE registros_obstetricos
    SET 
        nombre_medico = COALESCE(nombre_medico, target_nombre),
        apellido_medico = COALESCE(apellido_medico, target_apellido),
        telefono_medico = COALESCE(telefono_medico, target_telefono)
    WHERE cedula_medico = target_cedula AND (nombre_medico IS NULL OR nombre_medico = '');

    -- Actualizar defunciones vacías del médico
    UPDATE registros_defunciones
    SET 
        nombre_medico = COALESCE(nombre_medico, target_nombre),
        apellido_medico = COALESCE(apellido_medico, target_apellido),
        telefono_medico = COALESCE(telefono_medico, target_telefono)
    WHERE cedula_medico = target_cedula AND (nombre_medico IS NULL OR nombre_medico = '');
END;
$$ LANGUAGE plpgsql;
