import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta configurar la variable de entorno: ${name}`);
  }
  return value;
};

const getSupabase = () => {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    
    // Calcular punto límite de tiempo: hace 7 días
    const sieteDiasAtras = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    // Eliminar registros de la tabla temporal nominales cuya fecha de creación sea anterior o igual a hace 7 días
    const { data, error, count } = await supabase
      .from('nominales')
      .delete({ count: 'exact' })
      .lte('fecha_creacion', sieteDiasAtras);

    if (error) {
      throw new Error(`Fallo en Supabase al purgar: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Limpieza e higiene de la tabla nominales temporal ejecutada con éxito.',
      purgedCount: count ?? 0,
      cutoffDateString: sieteDiasAtras
    });

  } catch (err: any) {
    console.error('Error en API purgar-nominales:', err);
    return NextResponse.json({
      success: false,
      message: err.message || 'Error interno del servidor al procesar la purga de registros antiguos.'
    }, { status: 500 });
  }
}
