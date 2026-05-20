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

-- 3. Políticas de seguridad
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.usuarios
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins pueden ver todos los perfiles" ON public.usuarios;
CREATE POLICY "Admins pueden ver todos los perfiles" ON public.usuarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

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
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin')
);

DROP POLICY IF EXISTS "Todos pueden ver poligonos" ON public.mapa_poligonos;
CREATE POLICY "Todos pueden ver poligonos" ON public.mapa_poligonos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins pueden editar poligonos" ON public.mapa_poligonos;
CREATE POLICY "Admins pueden editar poligonos" ON public.mapa_poligonos FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin')
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
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin')
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
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin')
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
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin')
);
