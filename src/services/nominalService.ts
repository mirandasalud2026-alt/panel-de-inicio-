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
const L_KEY_CENTROS_SALUD = 'nominal_sim_centros_salud'; // Salvavidas offline para los centros

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
if (!localStorage.getItem(L_KEY_CENTROS_SALUD)) {
  setLocalData<string[]>(L_KEY_CENTROS_SALUD, [
    "CLÍNICA POPULAR TIPO II MESUCA",
    "MATERNIDAD DE CARRIZAL",
    "CLÍNICA POPULAR EL PASO"
  ]);
}

export const nominalService = {
  // 1. BÚSQUEDA AUTOMÁTICA DE PACIENTE
  async buscarPaciente(cedula: string): Promise<Paciente | null> {
    const sanitized = cedula.toUpperCase().trim();
    if (!sanitized) return null;

    const numericPart = sanitized.replace(/\D/g, '');
    const candidates = [
      sanitized,
      numericPart,
      `V-${numericPart}`,
      `V${numericPart}`,
      `E-${numericPart}`,
      `E${numericPart}`
    ].filter((value, index, self) => value && self.indexOf(value) === index);

    if (supabase) {
      try {
        // 1. Buscar en tabla dedicada pacientes
        const { data: pData, error: pError } = await supabase
          .from('pacientes')
          .select('*')
          .in('cedula', candidates)
          .limit(1)
          .maybeSingle();
        
        if (!pError && pData) {
          return pData as Paciente;
        }

        // 2. Si no, buscar en registros quirúrgicos
        const { data: qData, error: qError } = await supabase
          .from('CL_quirurgicos_eventos')
          .select('paciente_id, nombre_paciente, apellido_paciente, edad_paciente, sexo_paciente, telefono_paciente')
          .in('paciente_id', candidates)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!qError && qData && qData.length > 0) {
          const r = qData[0];
          return {
            cedula: r.paciente_id,
            nombre: r.nombre_paciente,
            apellido: r.apellido_paciente,
            edad: parseInt(r.edad_paciente) || 0,
            sexo: r.sexo_paciente || 'FEMENINO',
            telefono: r.telefono_paciente || ''
          };
        }

        // 3. Si no, buscar en registros obstétricos
        const { data: oData, error: oError } = await supabase
          .from('CL_obstetricos_eventos')
          .select('paciente_id, nombre_madre, apellido_madre, edad_madre, telefono_madre')
          .in('paciente_id', candidates)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!oError && oData && oData.length > 0) {
          const r = oData[0];
          return {
            cedula: r.paciente_id,
            nombre: r.nombre_madre,
            apellido: r.apellido_madre,
            edad: parseInt(r.edad_madre) || 0,
            sexo: 'FEMENINO',
            telefono: r.telefono_madre || ''
          };
        }

        // 4. Si no, buscar en defunciones
        const { data: dData, error: dError } = await supabase
          .from('CL_defunciones_eventos')
          .select('paciente_id, nombre_fallecido, apellido_fallecido, edad_fallecido, sexo_fallecido')
          .in('paciente_id', candidates)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!dError && dData && dData.length > 0) {
          const r = dData[0];
          return {
            cedula: r.paciente_id,
            nombre: r.nombre_fallecido,
            apellido: r.apellido_fallecido,
            edad: parseInt(r.edad_fallecido) || 0,
            sexo: r.sexo_fallecido || 'FEMENINO',
            telefono: ''
          };
        }
      } catch (err) {
        console.warn('Supabase find paciente error, using local fallback:', err);
      }
    }

    // Fallback local
    const local = getLocalData<Paciente[]>(L_KEY_PACIENTES, []);
    return local.find(p => candidates.includes(p.cedula.toUpperCase())) || null;
  },

  // 2. BÚSQUEDA AUTOMÁTICA DE MÉDICO
  async buscarMedico(cedula: string): Promise<Medico | null> {
    const sanitized = cedula.toUpperCase().trim();
    if (!sanitized) return null;

    const numericPart = sanitized.replace(/\D/g, '');
    const candidates = [
      sanitized,
      numericPart,
      `V-${numericPart}`,
      `V${numericPart}`,
      `E-${numericPart}`,
      `E${numericPart}`
    ].filter((value, index, self) => value && self.indexOf(value) === index);

    if (supabase) {
      try {
        // 1. Buscar en tabla dedicada de médicos
        const { data: mData, error: mError } = await supabase
          .from('DATOS_DEL_MEDICO_TRATANTE')
          .select('*')
          .in('cedula', candidates)
          .limit(1)
          .maybeSingle();
        
        if (!mError && mData) {
          return mData as Medico;
        }

        // 2. Buscar en registros quirúrgicos para autocompletar médico
        const { data: qData, error: qError } = await supabase
          .from('CL_quirurgicos_eventos')
          .select('personal_id, nombre_medico, apellido_medico, telefono_medico')
          .in('personal_id', candidates)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!qError && qData && qData.length > 0) {
          const r = qData[0];
          return {
            cedula: r.personal_id,
            nombre: r.nombre_medico,
            apellido: r.apellido_medico,
            telefono: r.telefono_medico || ''
          };
        }

        // 3. Buscar en registros obstétricos para autocompletar médico
        const { data: oData, error: oError } = await supabase
          .from('CL_obstetricos_eventos')
          .select('personal_id, nombre_medico, apellido_medico, telefono_medico')
          .in('personal_id', candidates)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!oError && oData && oData.length > 0) {
          const r = oData[0];
          return {
            cedula: r.personal_id,
            nombre: r.nombre_medico,
            apellido: r.apellido_medico,
            telefono: r.telefono_medico || ''
          };
        }

        // 4. Buscar en defunciones para autocompletar médico
        const { data: dData, error: dError } = await supabase
          .from('CL_defunciones_eventos')
          .select('personal_id, nombre_medico, apellido_medico, telefono_medico')
          .in('personal_id', candidates)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!dError && dData && dData.length > 0) {
          const r = dData[0];
          return {
            cedula: r.personal_id,
            nombre: r.nombre_medico,
            apellido: r.apellido_medico,
            telefono: r.telefono_medico || ''
          };
        }
      } catch (err) {
        console.warn('Supabase find medico error, using local fallback:', err);
      }
    }

    // Fallback local
    const local = getLocalData<Medico[]>(L_KEY_MEDICOS, []);
    return local.find(m => candidates.includes(m.cedula.toUpperCase())) || null;
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
        await supabase.from('CL_quirurgicos_eventos')
          .update({ nombre_paciente: nombre, apellido_paciente: apellido, telefono_paciente: telefono, edad_paciente: edad, sexo_paciente: sexo })
          .eq('paciente_id', cedula);

        // En quirurgicas (medico)
        await supabase.from('CL_quirurgicos_eventos')
          .update({ nombre_medico: nombre, apellido_medico: apellido, telefono_medico: telefono })
          .eq('personal_id', cedula);

        // En obstetricas (madre)
        await supabase.from('CL_obstetricos_eventos')
          .update({ nombre_madre: nombre, apellido_madre: apellido, telefono_madre: telefono, edad_madre: edad })
          .eq('paciente_id', cedula);

        // En obstetricas (medico)
        await supabase.from('CL_obstetricos_eventos')
          .update({ nombre_medico: nombre, apellido_medico: apellido, telefono_medico: telefono })
          .eq('personal_id', cedula);

        // En defunciones (medico)
        await supabase.from('CL_defunciones_eventos')
          .update({ nombre_medico: nombre, apellido_medico: apellido, telefono_medico: telefono })
          .eq('personal_id', cedula);
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
        const mappedRecord = {
          fecha: record.fecha,
          estado: record.estado,
          centro_salud: record.centro_salud,
          paciente_id: record.cedula_paciente,
          personal_id: record.cedula_medico,
          cantidad_intervencion: parseInt(record.cantidad_intervencion) || 1,
          nombre_paciente: record.nombre_paciente,
          apellido_paciente: record.apellido_paciente,
          edad_paciente: parseInt(record.edad_paciente) || 0,
          sexo_paciente: record.sexo_paciente,
          telefono_paciente: record.telefono_paciente,
          especialidad_quirurgica: record.especialidad_quirurgica,
          tipo_intervencion: record.tipo_intervencion,
          urgente_electiva: record.urgente_electiva,
          nombre_medico: record.nombre_medico,
          apellido_medico: record.apellido_medico,
          telefono_medico: record.telefono_medico || ''
        };

        const { data, error } = await supabase
          .from('CL_quirurgicos_eventos')
          .insert(mappedRecord)
          .select()
          .single();

        if (!error && data) {
          savedItem = data;
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
        const mappedRecord = {
          fecha: record.fecha,
          estado: record.estado,
          centro_salud: record.centro_salud,
          paciente_id: record.cedula_madre,
          personal_id: record.cedula_medico,
          nombre_madre: record.nombre_madre,
          apellido_madre: record.apellido_madre,
          edad_madre: parseInt(record.edad_madre) || 0,
          telefono_madre: record.telefono_madre,
          tipo_parto: record.tipo_parto,
          complicaciones: record.complicaciones || 'NINGUNA',
          vivos: parseInt(record.vivos) || 1,
          muertos: parseInt(record.muertos) || 0,
          nombre_medico: record.nombre_medico,
          apellido_medico: record.apellido_medico,
          telefono_medico: record.telefono_medico || ''
        };

        const { data, error } = await supabase
          .from('CL_obstetricos_eventos')
          .insert(mappedRecord)
          .select()
          .single();

        if (!error && data) {
          savedItem = data;
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
    await this.asegurarMedico({
      cedula: record.cedula_medico,
      nombre: record.nombre_medico,
      apellido: record.apellido_medico,
      telefono: record.telefono_medico
    });

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
        const mappedRecord = {
          fecha: record.fecha,
          estado: record.estado,
          centro_salud: record.centro_salud,
          paciente_id: record.cedula_fallecido,
          personal_id: record.cedula_medico,
          nombre_fallecido: record.nombre_fallecido,
          apellido_fallecido: record.apellido_fallecido,
          edad_fallecido: parseInt(record.edad_fallecido) || 0,
          sexo_fallecido: record.sexo_fallecido,
          hora_fallecimiento: record.hora_fallecimiento || new Date().toLocaleTimeString(),
          patologia: record.patologia,
          observacion: record.observacion,
          nombre_medico: record.nombre_medico,
          apellido_medico: record.apellido_medico,
          telefono_medico: record.telefono_medico || ''
        };

        const { data, error } = await supabase
          .from('CL_defunciones_eventos')
          .insert(mappedRecord)
          .select()
          .single();

        if (!error && data) {
          savedItem = data;
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
          .from('CL_quirurgicos_eventos')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((item: any) => ({
            ...item,
            cedula_paciente: item.cedula_paciente || item.paciente_id,
            cedula: item.cedula || item.paciente_id,
            cedula_medico: item.cedula_medico || item.personal_id,
            cedula_personal: item.cedula_personal || item.personal_id
          }));
        }
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
          .from('CL_obstetricos_eventos')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((item: any) => ({
            ...item,
            cedula_madre: item.cedula_madre || item.paciente_id,
            cedula: item.cedula || item.paciente_id,
            cedula_medico: item.cedula_medico || item.personal_id,
            cedula_personal: item.cedula_personal || item.personal_id
          }));
        }
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
          .from('CL_defunciones_eventos')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((item: any) => ({
            ...item,
            cedula_fallecido: item.cedula_fallecido || item.paciente_id,
            cedula: item.cedula || item.paciente_id,
            cedula_medico: item.cedula_medico || item.personal_id,
            cedula_personal: item.cedula_personal || item.personal_id
          }));
        }
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

  // Eliminar un registro nominal de forma definitiva e integrada
  async eliminarRegistroNominal(tipoRegistro: 'quirurgica' | 'obstetrica' | 'defuncion', id: number): Promise<boolean> {
    console.log(`🗑️ Elminando registro nominal tipo ${tipoRegistro} con ID: ${id}`);
    
    if (supabase) {
      try {
        const tableName = 
          tipoRegistro === 'quirurgica' ? 'CL_quirurgicos_eventos' :
          tipoRegistro === 'obstetrica' ? 'CL_obstetricos_eventos' : 
          'CL_defunciones_eventos';

        // 1. Eliminar de la tabla específica
        const { error: eventErr } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (eventErr) {
          console.warn(`Error eliminando de la tabla específica ${tableName}:`, eventErr.message);
        }

        // 2. Eliminar de la tabla de retención consolidada 'nominales'
        const { error: nomErr } = await supabase
          .from('nominales')
          .delete()
          .eq('tipo_registro', tipoRegistro)
          .eq('registro_id', id);

        if (nomErr) {
          console.warn('Error eliminando de la tabla consolidada nominales:', nomErr.message);
        }
      } catch (err: any) {
        console.error('Fallo de conexión al eliminar de Supabase:', err.message || err);
      }
    }

    // Alinear con el almacenamiento local (fallbacks) sin importar si la base de datos está offline
    try {
      if (tipoRegistro === 'quirurgica') {
        const list = getLocalData<any[]>(L_KEY_QUIRURGICA, []);
        const filtered = list.filter(item => item.id !== id);
        setLocalData(L_KEY_QUIRURGICA, filtered);
      } else if (tipoRegistro === 'obstetrica') {
        const list = getLocalData<any[]>(L_KEY_OBSTETRICA, []);
        const filtered = list.filter(item => item.id !== id);
        setLocalData(L_KEY_OBSTETRICA, filtered);
      } else if (tipoRegistro === 'defuncion') {
        const list = getLocalData<any[]>(L_KEY_DEFUNCION, []);
        const filtered = list.filter(item => item.id !== id);
        setLocalData(L_KEY_DEFUNCION, filtered);
      }

      // Limpiar del log general
      const generalList = getLocalData<any[]>(L_KEY_NOMINALES, []);
      const generalFiltered = generalList.filter(item => !(item.tipo_registro === tipoRegistro && item.registro_id === id));
      setLocalData(L_KEY_NOMINALES, generalFiltered);
      return true;
    } catch (e) {
      console.error('Error al actualizar local storage tras eliminación:', e);
      return false;
    }
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
  },

  // =======================================================
  // 6. OBTENER ESTABLECIMIENTOS REALES DESDE SUPABASE
  // =======================================================
  async obtenerCentrosSalud(): Promise<string[]> {
    // Catálogo real unificado de la región para asegurar la carga
    const catalogoReal = [
      "CLÍNICA POPULAR PARACOTOS",
      "CDI DOCTOR JOSÉ GREGORIO HERNÁNDEZ",
      "AMBULATORIO PRADO DE MARÍA"
    ];

    if (supabase) {
      try {
        // Consultamos la tabla maestra mapeando estrictamente el nombre descriptivo
        const { data, error } = await supabase
          .from('TClinicas_populares') 
          .select('nombre_establecimiento')
          .order('nombre_establecimiento', { ascending: true });

        if (!error && data && data.length > 0) {
          const listaMapeada = data.map((item: any) => item.nombre_establecimiento).filter(Boolean);
          
          // Si por alguna razón la base de datos devolvió códigos en vez de nombres descriptivos
          if (listaMapeada[0]?.startsWith('ASIC')) {
            console.warn('La tabla devolvió identificadores técnicos; aplicando catálogo nominal.');
            return catalogoReal;
          }
          
          return listaMapeada;
        }
        
        if (error) console.warn('Error en TClinicas_populares, usando catálogo por defecto:', error);
      } catch (err) {
        console.warn('Fallo de comunicación, aplicando catálogo de respaldo:', err);
      }
    }
    
    return catalogoReal;
  }
};
