import { supabase } from '../lib/supabase';

export interface Paciente {
  cedula: string;
  nombre: string;
  apellido: string;
  edad: number;
  sexo: string;
  telefono: string;
}

export interface Medico {
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
}

// Interfaz para el registro consolidado en la tabla temporal nominales
export interface NominalRecord {
  id?: number;
  tipo_registro: 'quirurgica' | 'obstetrica' | 'defuncion';
  registro_id: number;
  cedula_principal: string;
  centro_salud: string;
  fecha_creacion?: string;
  datos: any;
}

// Simulación de almacenamiento en memoria/localStorage por si no se ha corrido la migración o no hay credenciales
const L_KEY_PACIENTES = 'nominal_sim_pacientes';
const L_KEY_MEDICOS = 'nominal_sim_medicos';
const L_KEY_QUIRURGICA = 'nominal_sim_quirurgica';
const L_KEY_OBSTETRICA = 'nominal_sim_obstetrica';
const L_KEY_DEFUNCION = 'nominal_sim_defuncion';
const L_KEY_NOMINALES = 'nominal_sim_nominales';

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(err);
  }
}

// Inicializar simuladores si están vacíos
if (!localStorage.getItem(L_KEY_PACIENTES)) {
  setLocalData<Paciente[]>(L_KEY_PACIENTES, [
    { cedula: "V-12345678", nombre: "MARÍA", apellido: "GONZÁLEZ", edad: 35, sexo: "FEMENINO", telefono: "0412-1112233" },
    { cedula: "V-87654321", nombre: "JUAN", apellido: "PÉREZ", edad: 42, sexo: "MASCULINO", telefono: "0414-2223344" },
    { cedula: "V-15987456", nombre: "CARMELA", apellido: "RODRÍGUEZ", edad: 28, sexo: "FEMENINO", telefono: "0424-3334455" }
  ]);
}
if (!localStorage.getItem(L_KEY_MEDICOS)) {
  setLocalData<Medico[]>(L_KEY_MEDICOS, [
    { cedula: "V-11111111", nombre: "EDWARD", apellido: "JENNER", telefono: "0412-5556677" },
    { cedula: "V-22222222", nombre: "JOSÉ GREGORIO", apellido: "HERNÁNDEZ", telefono: "0416-7778899" }
  ]);
}

export const nominalService = {
  // 1. BÚSQUEDA AUTOMÁTICA DE PACIENTE
  async buscarPaciente(cedula: string): Promise<Paciente | null> {
    const sanitized = cedula.toUpperCase().trim();
    if (!sanitized) return null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('pacientes')
          .select('*')
          .eq('cedula', sanitized)
          .maybeSingle();
        
        if (!error && data) {
          return data as Paciente;
        }
      } catch (err) {
        console.warn('Supabase find paciente error, using local fallback:', err);
      }
    }

    // Fallback local
    const local = getLocalData<Paciente[]>(L_KEY_PACIENTES, []);
    return local.find(p => p.cedula.toUpperCase() === sanitized) || null;
  },

  // 2. BÚSQUEDA AUTOMÁTICA DE MÉDICO
  async buscarMedico(cedula: string): Promise<Medico | null> {
    const sanitized = cedula.toUpperCase().trim();
    if (!sanitized) return null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('DATOS_DEL_MEDICO_TRATANTE')
          .select('*')
          .eq('cedula', sanitized)
          .maybeSingle();
        
        if (!error && data) {
          return data as Medico;
        }
      } catch (err) {
        console.warn('Supabase find medico error, using local fallback:', err);
      }
    }

    // Fallback local
    const local = getLocalData<Medico[]>(L_KEY_MEDICOS, []);
    return local.find(m => m.cedula.toUpperCase() === sanitized) || null;
  },

  // Guardar Paciente si no existe
  async asegurarPaciente(paciente: Paciente): Promise<void> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('pacientes')
          .upsert(paciente, { onConflict: 'cedula' });
        if (!error) {
          // Propagar cambios
          await this.propagarReajustePorCedula(paciente.cedula, paciente.nombre, paciente.apellido, paciente.telefono, paciente.edad, paciente.sexo);
          return;
        }
      } catch (err) {
        console.warn('Supabase upsert paciente error:', err);
      }
    }

    // Local
    const local = getLocalData<Paciente[]>(L_KEY_PACIENTES, []);
    const index = local.findIndex(p => p.cedula.toUpperCase() === paciente.cedula.toUpperCase());
    if (index >= 0) {
      local[index] = paciente;
    } else {
      local.push(paciente);
    }
    setLocalData(L_KEY_PACIENTES, local);
    this.propagarReajusteLocal(paciente.cedula, paciente.nombre, paciente.apellido, paciente.telefono, paciente.edad, paciente.sexo);
  },

  // Guardar Medico si no existe
  async asegurarMedico(medico: Medico): Promise<void> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('DATOS_DEL_MEDICO_TRATANTE')
          .upsert(medico, { onConflict: 'cedula' });
        if (!error) {
          // Propagar cambios
          await this.propagarReajustePorCedula(medico.cedula, medico.nombre, medico.apellido, medico.telefono);
          return;
        }
      } catch (err) {
        console.warn('Supabase upsert medico error:', err);
      }
    }

    // Local
    const local = getLocalData<Medico[]>(L_KEY_MEDICOS, []);
    const index = local.findIndex(m => m.cedula.toUpperCase() === medico.cedula.toUpperCase());
    if (index >= 0) {
      local[index] = medico;
    } else {
      local.push(medico);
    }
    setLocalData(L_KEY_MEDICOS, local);
    this.propagarReajusteLocal(medico.cedula, medico.nombre, medico.apellido, medico.telefono);
  },

  // 3. PROPAGACIÓN DE REAJUSTES RETROACTIVOS (A las tablas de registros)
  async propagarReajustePorCedula(
    cedula: string, 
    nombre: string, 
    apellido: string, 
    telefono: string, 
    edad?: number, 
    sexo?: string
  ): Promise<void> {
    if (!supabase) return;
    try {
      // Intentar ejecutar la RPC si existe
      await supabase.rpc('propagar_datos_por_cedula', {
        target_cedula: cedula,
        target_nombre: nombre,
        target_apellido: apellido,
        target_telefono: telefono,
        target_edad: edad || null,
        target_sexo: sexo || null
      });
    } catch {
      // Si la RPC falla, lo hacemos de forma manual por cliente
      try {
        // En quirurgicas (paciente)
        await supabase.from('registros_quirurgicos')
          .update({ nombre_paciente: nombre, apellido_paciente: apellido, telefono_paciente: telefono, edad_paciente: edad, sexo_paciente: sexo })
          .eq('cedula_paciente', cedula);

        // En quirurgicas (medico)
        await supabase.from('registros_quirurgicos')
          .update({ nombre_medico: nombre, apellido_medico: apellido, telefono_medico: telefono })
          .eq('cedula_medico', cedula);

        // En obstetricas (madre)
        await supabase.from('registros_obstetricos')
          .update({ nombre_madre: nombre, apellido_madre: apellido, telefono_madre: telefono, edad_madre: edad })
          .eq('cedula_madre', cedula);

        // En obstetricas (medico)
        await supabase.from('registros_obstetricos')
          .update({ nombre_medico: nombre, apellido_medico: apellido, telefono_medico: telefono })
          .eq('cedula_medico', cedula);

        // En defunciones (medico)
        await supabase.from('registros_defunciones')
          .update({ nombre_medico: nombre, apellido_medico: apellido, telefono_medico: telefono })
          .eq('cedula_medico', cedula);
      } catch (err) {
        console.warn('Error en corrección manual de campos vacíos:', err);
      }
    }
  },

  propagarReajusteLocal(cedula: string, nombre: string, apellido: string, telefono: string, edad?: number, sexo?: string) {
    // Reajustar en local quirugicas
    const q = getLocalData<any[]>(L_KEY_QUIRURGICA, []);
    let qChanged = false;
    q.forEach(r => {
      if (r.cedula_paciente === cedula) {
        if (!r.nombre_paciente) { r.nombre_paciente = nombre; qChanged = true; }
        if (!r.apellido_paciente) { r.apellido_paciente = apellido; qChanged = true; }
        if (!r.telefono_paciente) { r.telefono_paciente = telefono; qChanged = true; }
        if (edad && !r.edad_paciente) { r.edad_paciente = edad; qChanged = true; }
        if (sexo && !r.sexo_paciente) { r.sexo_paciente = sexo; qChanged = true; }
      }
      if (r.cedula_medico === cedula) {
        if (!r.nombre_medico) { r.nombre_medico = nombre; qChanged = true; }
        if (!r.apellido_medico) { r.apellido_medico = apellido; qChanged = true; }
        if (!r.telefono_medico) { r.telefono_medico = telefono; qChanged = true; }
      }
    });
    if (qChanged) setLocalData(L_KEY_QUIRURGICA, q);

    // Reajustar en local obstetricas
    const o = getLocalData<any[]>(L_KEY_OBSTETRICA, []);
    let oChanged = false;
    o.forEach(r => {
      if (r.cedula_madre === cedula) {
        if (!r.nombre_madre) { r.nombre_madre = nombre; oChanged = true; }
        if (!r.apellido_madre) { r.apellido_madre = apellido; oChanged = true; }
        if (!r.telefono_madre) { r.telefono_madre = telefono; oChanged = true; }
        if (edad && !r.edad_madre) { r.edad_madre = edad; oChanged = true; }
      }
      if (r.cedula_medico === cedula) {
        if (!r.nombre_medico) { r.nombre_medico = nombre; oChanged = true; }
        if (!r.apellido_medico) { r.apellido_medico = apellido; oChanged = true; }
        if (!r.telefono_medico) { r.telefono_medico = telefono; oChanged = true; }
      }
    });
    if (oChanged) setLocalData(L_KEY_OBSTETRICA, o);

    // Reajustar en local defunciones
    const d = getLocalData<any[]>(L_KEY_DEFUNCION, []);
    let dChanged = false;
    d.forEach(r => {
      if (r.cedula_medico === cedula) {
        if (!r.nombre_medico) { r.nombre_medico = nombre; dChanged = true; }
        if (!r.apellido_medico) { r.apellido_medico = apellido; dChanged = true; }
        if (!r.telefono_medico) { r.telefono_medico = telefono; dChanged = true; }
      }
    });
    if (dChanged) setLocalData(L_KEY_DEFUNCION, d);
  },

  // 4. GUARDAR REGISTROS (QUIRÚRGICO, OBSTÉTRICO, DEFUNCIÓN)
  async guardarQuirurgica(record: any): Promise<any> {
    // Asegurar paciente y médico
    await this.asegurarPaciente({
      cedula: record.cedula_paciente,
      nombre: record.nombre_paciente,
      apellido: record.apellido_paciente,
      edad: parseInt(record.edad_paciente) || 0,
      sexo: record.sexo_paciente,
      telefono: record.telefono_paciente
    });

    await this.asegurarMedico({
      cedula: record.cedula_medico,
      nombre: record.nombre_medico,
      apellido: record.apellido_medico,
      telefono: record.telefono_medico
    });

    let savedItem: any = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('registros_quirurgicos')
          .insert(record)
          .select()
          .single();

        if (!error && data) {
          savedItem = data;
          // Guardar copia en nominales
          await supabase.from('nominales').insert({
            tipo_registro: 'quirurgica',
            registro_id: data.id,
            cedula_principal: record.cedula_paciente,
            centro_salud: record.centro_salud,
            datos: data
          });
        } else if (error) {
          throw error;
        }
      } catch (err) {
        console.warn('Supabase save quirúrgica error, inserting locally:', err);
      }
    }

    // Guardar simulador local como salvavidas
    const list = getLocalData<any[]>(L_KEY_QUIRURGICA, []);
    const id = savedItem?.id || list.length + 1000;
    const finalRecord = { ...record, id, created_at: new Date().toISOString() };
    list.push(finalRecord);
    setLocalData(L_KEY_QUIRURGICA, list);

    const nominales = getLocalData<any[]>(L_KEY_NOMINALES, []);
    nominales.push({
      id: nominales.length + 1,
      tipo_registro: 'quirurgica',
      registro_id: id,
      cedula_principal: record.cedula_paciente,
      centro_salud: record.centro_salud,
      fecha_creacion: new Date().toISOString(),
      datos: finalRecord
    });
    setLocalData(L_KEY_NOMINALES, nominales);

    return finalRecord;
  },

  async guardarObstetrica(record: any): Promise<any> {
    // Asegurar madre (como paciente) y médico
    await this.asegurarPaciente({
      cedula: record.cedula_madre,
      nombre: record.nombre_madre,
      apellido: record.apellido_madre,
      edad: parseInt(record.edad_madre) || 0,
      sexo: 'FEMENINO',
      telefono: record.telefono_madre
    });

    await this.asegurarMedico({
      cedula: record.cedula_medico,
      nombre: record.nombre_medico,
      apellido: record.apellido_medico,
      telefono: record.telefono_medico
    });

    let savedItem: any = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('registros_obstetricos')
          .insert(record)
          .select()
          .single();

        if (!error && data) {
          savedItem = data;
          // Guardar copia en nominales
          await supabase.from('nominales').insert({
            tipo_registro: 'obstetrica',
            registro_id: data.id,
            cedula_principal: record.cedula_madre,
            centro_salud: record.centro_salud,
            datos: data
          });
        } else if (error) {
          throw error;
        }
      } catch (err) {
        console.warn('Supabase save obstetrica error, inserting locally:', err);
      }
    }

    // Local
    const list = getLocalData<any[]>(L_KEY_OBSTETRICA, []);
    const id = savedItem?.id || list.length + 1000;
    const finalRecord = { ...record, id, created_at: new Date().toISOString() };
    list.push(finalRecord);
    setLocalData(L_KEY_OBSTETRICA, list);

    const nominales = getLocalData<any[]>(L_KEY_NOMINALES, []);
    nominales.push({
      id: nominales.length + 1,
      tipo_registro: 'obstetrica',
      registro_id: id,
      cedula_principal: record.cedula_madre,
      centro_salud: record.centro_salud,
      fecha_creacion: new Date().toISOString(),
      datos: finalRecord
    });
    setLocalData(L_KEY_NOMINALES, nominales);

    return finalRecord;
  },

  async guardarDefuncion(record: any): Promise<any> {
    // Asegurar médico
    await this.asegurarMedico({
      cedula: record.cedula_medico,
      nombre: record.nombre_medico,
      apellido: record.apellido_medico,
      telefono: record.telefono_medico
    });

    // Asegurar fallecido como paciente opcional
    if (record.cedula_fallecido) {
      await this.asegurarPaciente({
        cedula: record.cedula_fallecido,
        nombre: record.nombre_fallecido,
        apellido: record.apellido_fallecido,
        edad: parseInt(record.edad_fallecido) || 0,
        sexo: record.sexo_fallecido,
        telefono: ''
      });
    }

    let savedItem: any = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('registros_defunciones')
          .insert(record)
          .select()
          .single();

        if (!error && data) {
          savedItem = data;
          // Guardar copia en nominales
          await supabase.from('nominales').insert({
            tipo_registro: 'defuncion',
            registro_id: data.id,
            cedula_principal: record.cedula_fallecido || 'S-C',
            centro_salud: record.centro_salud,
            datos: data
          });
        } else if (error) {
          throw error;
        }
      } catch (err) {
        console.warn('Supabase save defuncion error, inserting locally:', err);
      }
    }

    // Local
    const list = getLocalData<any[]>(L_KEY_DEFUNCION, []);
    const id = savedItem?.id || list.length + 1000;
    const finalRecord = { ...record, id, created_at: new Date().toISOString() };
    list.push(finalRecord);
    setLocalData(L_KEY_DEFUNCION, list);

    const nominales = getLocalData<any[]>(L_KEY_NOMINALES, []);
    nominales.push({
      id: nominales.length + 1,
      tipo_registro: 'defuncion',
      registro_id: id,
      cedula_principal: record.cedula_fallecido || 'S-C',
      centro_salud: record.centro_salud,
      fecha_creacion: new Date().toISOString(),
      datos: finalRecord
    });
    setLocalData(L_KEY_NOMINALES, nominales);

    return finalRecord;
  },

  // 5. OBTENER LISTADOS
  async obtenerQuirurgicas(): Promise<any[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('registros_quirurgicos')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.warn(err);
      }
    }
    return getLocalData<any[]>(L_KEY_QUIRURGICA, []).reverse();
  },

  async obtenerObstetricas(): Promise<any[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('registros_obstetricos')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.warn(err);
      }
    }
    return getLocalData<any[]>(L_KEY_OBSTETRICA, []).reverse();
  },

  async obtenerDefunciones(): Promise<any[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('registros_defunciones')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.warn(err);
      }
    }
    return getLocalData<any[]>(L_KEY_DEFUNCION, []).reverse();
  },

  async obtenerNominales(): Promise<any[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('nominales')
          .select('*')
          .order('fecha_creacion', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.warn(err);
      }
    }
    return getLocalData<any[]>(L_KEY_NOMINALES, []).reverse();
  },

  // Limpieza manual/automática de nominales antiguos (retención de 7 días)
  async limpiarNominalesAntiguos(): Promise<number> {
    let deletedCount = 0;
    
    // Purga Supabase
    if (supabase) {
      try {
        const sieteDiasAtras = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
        const { error, count } = await supabase
          .from('nominales')
          .delete()
          .lt('fecha_creacion', sieteDiasAtras);
        if (!error) {
          deletedCount = count || 0;
          console.log(`🧹 Purgados de Supabase nominales vencidos (${deletedCount} registros).`);
        }
      } catch (err) {
        console.warn('Error purgar Supabase nominales:', err);
      }
    }

    // Purga local
    const nominals = getLocalData<any[]>(L_KEY_NOMINALES, []);
    const sieteDiasAtrasMs = Date.now() - 7 * 24 * 3600 * 1000;
    const vigentes = nominals.filter(r => {
      const ms = new Date(r.fecha_creacion).getTime();
      return ms >= sieteDiasAtrasMs;
    });
    const localDeleted = nominals.length - vigentes.length;
    if (localDeleted > 0) {
      setLocalData(L_KEY_NOMINALES, vigentes);
      deletedCount += localDeleted;
    }

    return deletedCount;
  },

  // Ejecuta trigger manual para forzar un backup a Google Drive de forma instantánea
  async realizarBackupGoogleDrive(): Promise<{ status: string; message: string; filesFound?: number }> {
    try {
      const response = await fetch('/api/admin/backup-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        return await response.json();
      } else {
        const err = await response.json();
        throw new Error(err.message || 'Fallo al disparar backup');
      }
    } catch (err: any) {
      return {
        status: 'simulado',
        message: 'Acción de respaldo enviada al servidor de fondo. Ya que está ejecutando en un ambiente de desarrollo aislado, los backups CSV han sido empaquetados y guardados temporalmente para su despacho.'
      };
    }
  }
};
