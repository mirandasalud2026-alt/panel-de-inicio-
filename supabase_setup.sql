-- SQL para Supabase - Configuración de Roles y Perfiles
-- Ejecutar esto en el SQL Editor de su proyecto Supabase

-- 1. Crear tabla de perfiles si no existe
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
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins pueden ver todos los perfiles" ON public.usuarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- 4. Función Trigger para asignar "admin" automáticamente al correo específico
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (id, email, nombre, rol)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        CASE 
            WHEN new.email = 'miranda.salud2026@gmail.com' THEN 'admin'
            ELSE 'oficina'
        END
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Crear el trigger en la tabla auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Actualizar usuario existente si ya se registró
UPDATE public.usuarios 
SET rol = 'admin' 
WHERE email = 'miranda.salud2026@gmail.com';
