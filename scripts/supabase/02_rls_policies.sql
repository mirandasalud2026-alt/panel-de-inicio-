-- =========================================================================
-- POLÍTICAS RLS PARA MIRANDA SALUD
-- Lectura pública para todos, escritura solo para rol 'admin' o mediante service_role.
-- =========================================================================

-- HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.tejes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasic ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_quirurgicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_obstetricos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_defunciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transito_reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumen_asic ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapa_poligonos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinicas_populares ENABLE ROW LEVEL SECURITY;

-- LECTURA PÚBLICA PARA TODAS LAS TABLAS (permite consultas anónimas)
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Lectura publica %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Lectura publica %I" ON public.%I FOR SELECT USING (true)', tbl, tbl);
    END LOOP;
END;
$$;

-- ESCRITURA SOLO PARA EL ROL 'admin' (desde frontend autenticado) 
-- O para cualquier rol si se usa service_role (bypass RLS)
-- Para simplificar, damos permisos de inserción/actualización solo a usuarios autenticados con rol='admin'
-- Las inserciones desde Google Apps Script usarán service_role y no necesitan estas políticas.

-- Función auxiliar para saber si el usuario actual es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND rol = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas de escritura para tablas operativas (solo admin)
CREATE POLICY "Admins pueden insertar en pacientes" ON public.pacientes FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins pueden actualizar en pacientes" ON public.pacientes FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins pueden eliminar en pacientes" ON public.pacientes FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins pueden insertar en medicos" ON public.medicos FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins pueden actualizar en medicos" ON public.medicos FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins pueden eliminar en medicos" ON public.medicos FOR DELETE USING (public.is_admin());

-- Para registros clínicos, damos inserción también a usuarios con rol 'nominal' (los operadores)
CREATE OR REPLACE FUNCTION public.can_write_clinical()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND rol IN ('admin', 'nominal')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Operadores pueden insertar en quirurgicos" ON public.registros_quirurgicos FOR INSERT WITH CHECK (public.can_write_clinical());
CREATE POLICY "Operadores pueden insertar en obstetricos" ON public.registros_obstetricos FOR INSERT WITH CHECK (public.can_write_clinical());
CREATE POLICY "Operadores pueden insertar en defunciones" ON public.registros_defunciones FOR INSERT WITH CHECK (public.can_write_clinical());

-- Solo admin puede actualizar o eliminar registros clínicos
CREATE POLICY "Admin puede actualizar quirurgicos" ON public.registros_quirurgicos FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin puede eliminar quirurgicos" ON public.registros_quirurgicos FOR DELETE USING (public.is_admin());
CREATE POLICY "Admin puede actualizar obstetricos" ON public.registros_obstetricos FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin puede eliminar obstetricos" ON public.registros_obstetricos FOR DELETE USING (public.is_admin());
CREATE POLICY "Admin puede actualizar defunciones" ON public.registros_defunciones FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin puede eliminar defunciones" ON public.registros_defunciones FOR DELETE USING (public.is_admin());

-- Para transito_reportes y resumen_asic, solo admin puede modificar (lectura pública)
CREATE POLICY "Admin puede modificar transito" ON public.transito_reportes FOR ALL USING (public.is_admin());
CREATE POLICY "Admin puede modificar resumen" ON public.resumen_asic FOR ALL USING (public.is_admin());

-- Para nominales, solo admin puede escribir (la tabla se llena desde backend con service_role)
CREATE POLICY "Admin puede escribir nominales" ON public.nominales FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin puede eliminar nominales" ON public.nominales FOR DELETE USING (public.is_admin());