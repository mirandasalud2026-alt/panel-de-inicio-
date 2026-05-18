-- EJECUTAR ESTO EN EL SQL EDITOR DE SUPABASE PARA SOLUCIONAR ERRORES Y CREAR TABLAS

-- 1. Tabla de Usuarios (Acreditación)
-- Esta tabla vincula auth.users con perfiles extendidos
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    rol TEXT DEFAULT 'oficina' CHECK (rol IN ('admin', 'directivo', 'oficina')),
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Noticias
CREATE TABLE IF NOT EXISTS public.noticias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    categoria TEXT CHECK (categoria IN ('urgente', 'informativa', 'evento')),
    texto TEXT NOT NULL,
    fecha TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Configuración del Mapa (Fondo y Ejes)
CREATE TABLE IF NOT EXISTS public.mapa_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    background_image TEXT,
    ejes_data JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Polígonos (Capa SIG)
CREATE TABLE IF NOT EXISTS public.mapa_poligonos (
    id TEXT PRIMARY KEY,
    eje_id TEXT NOT NULL,
    points JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en todas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapa_poligonos ENABLE ROW LEVEL SECURITY;

-- 5. FUNCIÓN CRÍTICA PARA EVITAR RECURSIÓN INFINITA
-- Se usa SECURITY DEFINER para que la función pueda leer 'usuarios' saltándose el RLS.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT rol FROM public.usuarios
    WHERE id = auth.uid() AND estado = 'aprobado'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLÍTICAS PARA USUARIOS
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios ven su propio perfil" ON public.usuarios
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins gestionan todo" ON public.usuarios;
CREATE POLICY "Admins gestionan todo" ON public.usuarios
    FOR ALL TO authenticated
    USING (get_user_role() = 'admin');

-- POLÍTICAS PARA NOTICIAS
DROP POLICY IF EXISTS "Lectura pública noticias" ON public.noticias;
CREATE POLICY "Lectura pública noticias" ON public.noticias
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Admins escriben noticias" ON public.noticias;
CREATE POLICY "Admins escriben noticias" ON public.noticias
    FOR ALL TO authenticated
    USING (get_user_role() = 'admin');

-- POLÍTICAS PARA CONFIGURACION
DROP POLICY IF EXISTS "Lectura pública config" ON public.mapa_config;
CREATE POLICY "Lectura pública config" ON public.mapa_config
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Admins escriben config" ON public.mapa_config;
CREATE POLICY "Admins escriben config" ON public.mapa_config
    FOR ALL TO authenticated
    USING (get_user_role() = 'admin');

-- POLÍTICAS PARA POLIGONOS
DROP POLICY IF EXISTS "Lectura pública poligonos" ON public.mapa_poligonos;
CREATE POLICY "Lectura pública poligonos" ON public.mapa_poligonos
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Admins escriben poligonos" ON public.mapa_poligonos;
CREATE POLICY "Admins escriben poligonos" ON public.mapa_poligonos
    FOR ALL TO authenticated
    USING (get_user_role() = 'admin');
