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

-- 5. Tabla de Datos Territoriales (Conexión Google Sheets/App Script)
CREATE TABLE IF NOT EXISTS public.territorial_data (
    eje_id TEXT PRIMARY KEY, -- ex: 'altos_mirandinos', 'valles_del_tuy'
    name TEXT NOT NULL,
    valor_principal FLOAT DEFAULT 0, -- Porcentaje de operatividad o carga
    metadata JSONB DEFAULT '{}', -- Datos adicionales (medicos, insumos, etc)
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5b. Tabla de Tránsito de Reportes (Monitoreo de Cumplimiento Canal 3)
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

-- Habilitar RLS en todas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapa_poligonos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territorial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transito_reportes ENABLE ROW LEVEL SECURITY;

-- 6. FUNCIÓN CRÍTICA PARA EVITAR RECURSIÓN INFINITA
-- Esta función usa SECURITY DEFINER para saltarse el RLS al consultar perfiles.
-- Se añade SET row_security TO 'off' para mayor robustez ante recursión.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT rol FROM public.usuarios
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET row_security TO 'off';

-- POLÍTICAS PARA USUARIOS (REVISADAS PARA EVITAR RECURSIÓN)
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios ven su propio perfil" ON public.usuarios
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins gestionan todo" ON public.usuarios;
CREATE POLICY "Admins gestionan todo" ON public.usuarios
    FOR ALL TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- POLÍTICAS PARA NOTICIAS
DROP POLICY IF EXISTS "Lectura pública noticias" ON public.noticias;
CREATE POLICY "Lectura pública noticias" ON public.noticias
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Admins escriben noticias" ON public.noticias;
CREATE POLICY "Admins escriben noticias" ON public.noticias
    FOR ALL TO authenticated
    USING (get_user_role() = 'admin');

-- POLÍTICAS PARA CONFIGURACION (mapa_config)
-- Lectura: Pública (SELECT para todos)
-- Escritura: Solo Admin (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Lectura pública config" ON public.mapa_config;
CREATE POLICY "Lectura pública config" ON public.mapa_config
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Admins gestionan config" ON public.mapa_config;
CREATE POLICY "Admins gestionan config" ON public.mapa_config
    FOR ALL TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- POLÍTICAS PARA POLIGONOS (mapa_poligonos)
-- Lectura: Pública (SELECT para todos)
-- Escritura: Solo Admin (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Lectura pública poligonos" ON public.mapa_poligonos;
CREATE POLICY "Lectura pública poligonos" ON public.mapa_poligonos
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Admins gestionan poligonos" ON public.mapa_poligonos;
CREATE POLICY "Admins gestionan poligonos" ON public.mapa_poligonos
    FOR ALL TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- POLÍTICAS PARA DATOS TERRITORIALES
DROP POLICY IF EXISTS "Lectura pública territorial" ON public.territorial_data;
CREATE POLICY "Lectura pública territorial" ON public.territorial_data
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Admins gestionan territorial" ON public.territorial_data;
CREATE POLICY "Admins gestionan territorial" ON public.territorial_data
    FOR ALL TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- POLÍTICAS PARA TRÁNSITO DE REPORTES (transito_reportes)
DROP POLICY IF EXISTS "Lectura pública transito" ON public.transito_reportes;
CREATE POLICY "Lectura pública transito" ON public.transito_reportes
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Admins gestionan transito" ON public.transito_reportes;
CREATE POLICY "Admins gestionan transito" ON public.transito_reportes
    FOR ALL TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- 7. TRIGGER DE AUTOMATIZACIÓN DE REGISTRO (Acreditación)
-- Crea automáticamente el perfil en public.usuarios cuando alguien se registra en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, nombre, email, rol, estado)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario Nuevo'), 
    NEW.email, 
    'oficina', 
    'pendiente'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. DATOS INICIALES
INSERT INTO public.mapa_config (id, background_image)
VALUES ('default', 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&q=80&w=2000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.noticias (titulo, categoria, texto)
VALUES 
('Sistema SIG Miranda Activado', 'informativa', 'El sistema de información geográfica ha sido desplegado exitosamente.'),
('Alerta de Brote en Eje Metropolitano', 'urgente', 'Se reporta incremento de casos en la red ambulatoria. Favor verificar capas de SIG.')
ON CONFLICT DO NOTHING;

-- 8. TIP: SI NO PUEDES ENTRAR COMO ADMIN
-- Ejecuta esto reemplazando el email para darte permisos manuales:
-- UPDATE public.usuarios SET rol = 'admin', estado = 'aprobado' WHERE email = 'miranda.salud2026@gmail.com';
