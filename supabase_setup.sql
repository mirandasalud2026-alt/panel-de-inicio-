-- SQL para Supabase - Configuración de Roles y Perfiles
-- Ejecutar esto en el SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Tabla de perfiles
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT,
    rol TEXT CHECK (rol IN ('admin', 'directivo', 'oficina')) DEFAULT 'oficina',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar Seguridad (RLS)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 2b. Función para evitar recursión en consultas RLS (SECURITY DEFINER + row_security = off)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT rol FROM public.usuarios 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET row_security TO 'off';

-- 3. Políticas de seguridad
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.usuarios
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins pueden ver todos los perfiles" ON public.usuarios;
DROP POLICY IF EXISTS "Admins gestionan todo" ON public.usuarios;
CREATE POLICY "Admins gestionan todo" ON public.usuarios
    FOR ALL TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- 4. Función Trigger - LA CLAVE MAESTRA
-- Esta función se encarga de asignar el rol de 'admin' automáticamente al correo solicitado.
-- La clave 'Roble.26' debe ser configurada manualmente en Supabase Auth > Users (Create User).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (id, email, nombre, rol)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Administrador'),
        CASE 
            WHEN new.email = 'miranda.salud2026@gmail.com' THEN 'admin'
            ELSE 'oficina'
        END
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Vincular el trigger a la creación de usuarios en Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Asegurar que el usuario actual tenga rol admin
-- Si ya te registraste con este correo, ejecuta esto:
UPDATE public.usuarios SET rol = 'admin' WHERE email = 'miranda.salud2026@gmail.com';

-- 7. Tablas para el Mapa Interactivo SIG
-- Tabla para configuración general (Fondo, Ejes)
CREATE TABLE IF NOT EXISTS public.mapa_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    background_image TEXT,
    ejes_data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla para Polígonos Dibujados
CREATE TABLE IF NOT EXISTS public.mapa_poligonos (
    id TEXT PRIMARY KEY,
    eje_id TEXT NOT NULL,
    points JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en nuevas tablas
ALTER TABLE public.mapa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapa_poligonos ENABLE ROW LEVEL SECURITY;

-- Políticas: Todos pueden ver, solo Admins pueden editar
DROP POLICY IF EXISTS "Todos pueden ver config mapa" ON public.mapa_config;
CREATE POLICY "Todos pueden ver config mapa" ON public.mapa_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins pueden editar config mapa" ON public.mapa_config;
CREATE POLICY "Admins pueden editar config mapa" ON public.mapa_config FOR ALL USING (
    get_user_role() = 'admin'
);

DROP POLICY IF EXISTS "Todos pueden ver poligonos" ON public.mapa_poligonos;
CREATE POLICY "Todos pueden ver poligonos" ON public.mapa_poligonos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins pueden editar poligonos" ON public.mapa_poligonos;
CREATE POLICY "Admins pueden editar poligonos" ON public.mapa_poligonos FOR ALL USING (
    get_user_role() = 'admin'
);

-- 8. Tabla para Calendario / Jornadas
CREATE TABLE IF NOT EXISTS public.calendario (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    fecha DATE NOT NULL,
    tipo TEXT CHECK (tipo IN ('jornada', 'vacunacion', 'reunion', 'otro')) DEFAULT 'jornada',
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.calendario ENABLE ROW LEVEL SECURITY;

-- Políticas: Todos pueden ver, solo Admins pueden editar
DROP POLICY IF EXISTS "Todos pueden ver calendario" ON public.calendario;
CREATE POLICY "Todos pueden ver calendario" ON public.calendario FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins pueden editar calendario" ON public.calendario;
CREATE POLICY "Admins pueden editar calendario" ON public.calendario FOR ALL USING (
    get_user_role() = 'admin'
);

-- 9. Tabla para Noticias
CREATE TABLE IF NOT EXISTS public.noticias (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    categoria TEXT CHECK (categoria IN ('urgente', 'informativa', 'evento')) DEFAULT 'informativa',
    texto TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;

-- Políticas: Todos pueden ver, solo Admins pueden editar
DROP POLICY IF EXISTS "Todos pueden ver noticias" ON public.noticias;
CREATE POLICY "Todos pueden ver noticias" ON public.noticias FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins pueden editar noticias" ON public.noticias;
CREATE POLICY "Admins pueden editar noticias" ON public.noticias FOR ALL USING (
    get_user_role() = 'admin'
);

-- 10. Tabla de Tránsito de Reportes (Monitoreo de Cumplimiento Canal 3)
CREATE TABLE IF NOT EXISTS public.transito_reportes (
    id_centro TEXT PRIMARY KEY,
    nombre_centro TEXT NOT NULL,
    asic TEXT NOT NULL,
    eje_geografico TEXT NOT NULL,
    ultimo_reporte TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    estado_semaforo TEXT NOT NULL DEFAULT 'Verde' CHECK (estado_semaforo IN ('Verde', 'Amarillo', 'Rojo')),
    horas_retraso INTEGER NOT NULL DEFAULT 0,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.transito_reportes ENABLE ROW LEVEL SECURITY;

-- Políticas: Todos pueden ver, solo Admins pueden editar
DROP POLICY IF EXISTS "Todos pueden ver transito_reportes" ON public.transito_reportes;
CREATE POLICY "Todos pueden ver transito_reportes" ON public.transito_reportes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins pueden editar transito_reportes" ON public.transito_reportes;
CREATE POLICY "Admins pueden editar transito_reportes" ON public.transito_reportes FOR ALL USING (
    get_user_role() = 'admin'
);


-- 11. TABLAS DE COMPLEMENTO GEOGRÁFICO Y ASIC (RELACIONES DETECTADAS POR SEMÁNTICA)
CREATE TABLE IF NOT EXISTS public.tejes (
    cod_eje TEXT PRIMARY KEY,
    nombre_eje TEXT NOT NULL,
    eje TEXT,
    responsable TEXT,
    poblacion_estimada INTEGER,
    url_imagen_mapa TEXT,
    descripcion_texto TEXT,
    contacto_emergencia TEXT
);

CREATE TABLE IF NOT EXISTS public.tmunicipios (
    cod_mun NUMERIC PRIMARY KEY,
    nombre_municipio TEXT NOT NULL,
    cod_eje TEXT REFERENCES public.tejes(cod_eje) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.tparroquias (
    cod_parr NUMERIC PRIMARY KEY,
    nombre_parroquia TEXT NOT NULL,
    cod_mun NUMERIC REFERENCES public.tmunicipios(cod_mun) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.tasic (
    cod_asic TEXT PRIMARY KEY,
    nombre_asic TEXT NOT NULL,
    cod_eje TEXT REFERENCES public.tejes(cod_eje) ON DELETE SET NULL,
    cod_mun NUMERIC REFERENCES public.tmunicipios(cod_mun) ON DELETE SET NULL,
    cod_parr NUMERIC REFERENCES public.tparroquias(cod_parr) ON DELETE SET NULL,
    responsable TEXT,
    poblacion_estimada INTEGER,
    telefono_contacto TEXT,
    correo_contacto TEXT,
    numero_centros INTEGER
);

-- Habilitar RLS en tablas complementarias
ALTER TABLE public.tejes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tmunicipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tparroquias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasic ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para todas las de referencia
DROP POLICY IF EXISTS "Lectura pública tejes" ON public.tejes;
CREATE POLICY "Lectura pública tejes" ON public.tejes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública tmunicipios" ON public.tmunicipios;
CREATE POLICY "Lectura pública tmunicipios" ON public.tmunicipios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública tparroquias" ON public.tparroquias;
CREATE POLICY "Lectura pública tparroquias" ON public.tparroquias FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública tasic" ON public.tasic;
CREATE POLICY "Lectura pública tasic" ON public.tasic FOR SELECT USING (true);

-- Políticas de escritura para administradores en tablas complementarias (Evita el bloqueo de RLS al guardar fichas)
DROP POLICY IF EXISTS "Admins pueden editar tejes" ON public.tejes;
CREATE POLICY "Admins pueden editar tejes" ON public.tejes FOR ALL USING (
    get_user_role() = 'admin'
);

DROP POLICY IF EXISTS "Admins pueden editar tmunicipios" ON public.tmunicipios;
CREATE POLICY "Admins pueden editar tmunicipios" ON public.tmunicipios FOR ALL USING (
    get_user_role() = 'admin'
);

DROP POLICY IF EXISTS "Admins pueden editar tparroquias" ON public.tparroquias;
CREATE POLICY "Admins pueden editar tparroquias" ON public.tparroquias FOR ALL USING (
    get_user_role() = 'admin'
);

DROP POLICY IF EXISTS "Admins pueden editar tasic" ON public.tasic;
CREATE POLICY "Admins pueden editar tasic" ON public.tasic FOR ALL USING (
    get_user_role() = 'admin'
);

-- 12. COMPONENTES DE BASE DE DATOS Y TABLAS SINCROLEIDAS
-- Tabla resumen_asic (Sincronizada por Google Sheets, contiene el resumen agregativo de ASICs)
CREATE TABLE IF NOT EXISTS public.resumen_asic (
    asic TEXT PRIMARY KEY,
    eje TEXT,
    total_centros INTEGER DEFAULT 0,
    centros_reportaron INTEGER DEFAULT 0,
    porcentaje_reporte NUMERIC DEFAULT 0,
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar políticas de lectura y escritura para la tabla resumen_asic
ALTER TABLE public.resumen_asic ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública resumen_asic" ON public.resumen_asic;
CREATE POLICY "Lectura pública resumen_asic" ON public.resumen_asic FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins pueden editar resumen_asic" ON public.resumen_asic;
CREATE POLICY "Admins pueden editar resumen_asic" ON public.resumen_asic FOR ALL USING (
    get_user_role() = 'admin'
);

-- Vista 2: Vista Unificada Territorial (Completa)
CREATE OR REPLACE VIEW public.vista_unificada_territorial AS
SELECT 
    tr.id_centro,
    tr.nombre_centro,
    tr.asic AS centro_asic_cod,
    tr.estado_semaforo,
    tr.horas_retraso,
    tr.ultimo_reporte,
    tr.actualizado_en,
    a.nombre_asic,
    COALESCE(tr.eje_geografico, e.nombre_eje) AS eje_geografico,
    e.cod_eje AS eje_id,
    m.nombre_municipio,
    m.cod_mun AS municipio_id,
    p.nombre_parroquia,
    p.cod_parr AS parroquia_id
FROM public.transito_reportes tr
LEFT JOIN public.tasic a ON a.cod_asic = tr.asic
LEFT JOIN public.tejes e ON e.cod_eje = a.cod_eje
LEFT JOIN public.tmunicipios m ON m.cod_mun = a.cod_mun
LEFT JOIN public.tparroquias p ON p.cod_parr = a.cod_parr;

-- Vista 3: Noticias con Autores Unificados
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

-- Vista 4: Directiva de Redes Comunales 2026 (Clasificación epidemiológica por rango etario)
CREATE OR REPLACE VIEW public.v_redes_comunales_2026 AS
SELECT 
    e.cod_eje,
    e.nombre_eje,
    e.responsable AS responsable_eje,
    e.url_imagen_mapa,
    a.cod_asic,
    a.nombre_asic,
    m.nombre_municipio,
    COALESCE(a.poblacion_estimada, 0) AS poblacion_estimada,
    ROUND(COALESCE(a.poblacion_estimada, 0) * 0.12)::INTEGER AS total_infantiles_0_5,
    ROUND(COALESCE(a.poblacion_estimada, 0) * 0.14)::INTEGER AS total_infantiles_6_11,
    ROUND(COALESCE(a.poblacion_estimada, 0) * 0.15)::INTEGER AS total_adolescentes,
    ROUND(COALESCE(a.poblacion_estimada, 0) * 0.44)::INTEGER AS total_adultos,
    ROUND(COALESCE(a.poblacion_estimada, 0) * 0.15)::INTEGER AS total_adulto_mayor
FROM public.tasic a
LEFT JOIN public.tejes e ON e.cod_eje = a.cod_eje
LEFT JOIN public.tmunicipios m ON m.cod_mun = a.cod_mun;

