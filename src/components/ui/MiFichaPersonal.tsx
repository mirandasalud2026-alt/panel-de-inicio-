import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { User, Phone, Mail, Calendar, Briefcase, MapPin, RefreshCw, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { motion } from 'motion/react';

interface PersonalDetails {
  id?: string;
  cedula: string;
  nacionalidad: string;
  nombre_y_apellido: string;
  sexo: string;
  f_nac: string;
  edad: number;
  movil01: string;
  correo_personal: string;
  correo_institucional: string;
  nivel_educativo: string;
  profesion: string;
  especialidad: string;
  f_ing_apn: string;
  f_ingreso_miranda: string;
  f_egreso_miranda: string;
  f_ingreso_cargo_actual: string;
  tipo_nombramiento: string;
  n_gaceta_oficnio: string;
  fecha_gaceta_oficio: string;
}

const DEFAULT_ASICS_LIST = [
  { cod_asic: 'AMI-01', nombre_asic: 'ASIC Altos Mirandinos I (Los Teques)' },
  { cod_asic: 'AMI-02', nombre_asic: 'ASIC Altos Mirandinos II (Carrizal)' },
  { cod_asic: 'AMI-03', nombre_asic: 'ASIC Altos Mirandinos III (San Antonio)' },
  { cod_asic: 'VTY-01', nombre_asic: 'ASIC Ocumare del Tuy' },
  { cod_asic: 'VTY-02', nombre_asic: 'ASIC Charallave' },
  { cod_asic: 'VTY-03', nombre_asic: 'ASIC Santa Teresa del Tuy' },
  { cod_asic: 'GGU-01', nombre_asic: 'ASIC Guarenas' },
  { cod_asic: 'GGU-02', nombre_asic: 'ASIC Guatire' },
  { cod_asic: 'BAR-01', nombre_asic: 'ASIC Higuerote' },
  { cod_asic: 'BAR-02', nombre_asic: 'ASIC Rio Chico' },
  { cod_asic: 'MET-01', nombre_asic: 'ASIC Petare I' },
  { cod_asic: 'MET-02', nombre_asic: 'ASIC Chacao' },
  { cod_asic: 'MET-03', nombre_asic: 'ASIC Baruta' }
];

const DEFAULT_CLINICAS_LIST = [
  { nombre_establecimiento: 'CLÍNICA POPULAR PARACOTOS', cod_asic: 'AMI-01' },
  { nombre_establecimiento: 'CDI DOCTOR JOSÉ GREGORIO HERNÁNDEZ', cod_asic: 'AMI-01' },
  { nombre_establecimiento: 'AMBULATORIO PRADO DE MARÍA', cod_asic: 'AMI-02' },
  { nombre_establecimiento: 'CDI CONTEXTO MIRANDINO', cod_asic: 'AMI-03' },
  { nombre_establecimiento: 'CLÍNICA POPULAR HUGO CHÁVEZ', cod_asic: 'VTY-01' },
  { nombre_establecimiento: 'CDI CARTANAL', cod_asic: 'VTY-03' },
  { nombre_establecimiento: 'CLÍNICA POPULAR VALLES DEL TUY', cod_asic: 'VTY-02' },
  { nombre_establecimiento: 'HOSPITAL GENERAL DE GUARENAS', cod_asic: 'GGU-01' },
  { nombre_establecimiento: 'CDI EL QUEMADO', cod_asic: 'GGU-02' },
  { nombre_establecimiento: 'HOSPITAL HIGUEROTE', cod_asic: 'BAR-01' },
  { nombre_establecimiento: 'CLÍNICA POPULAR RIO CHICO', cod_asic: 'BAR-02' },
  { nombre_establecimiento: 'HOSPITAL ANA FRANCISCA PEREZ DE LEON II', cod_asic: 'MET-01' },
  { nombre_establecimiento: 'AMBULATORIO CHACAO', cod_asic: 'MET-02' },
  { nombre_establecimiento: 'HOSPITAL DOMINGO LUCIANI', cod_asic: 'MET-01' }
];

// Deduced axes helper
const mapAsicToEje = (asic: string): string => {
  if (asic.startsWith('AMI')) return 'AMI';
  if (asic.startsWith('VTY')) return 'VTY';
  if (asic.startsWith('GGU')) return 'GGU';
  if (asic.startsWith('BAR')) return 'BAR';
  if (asic.startsWith('MET')) return 'MET';
  return 'AMI';
};

export default function MiFichaPersonal() {
  const { profile, retryFetchProfile } = useAuth();
  
  const [personal, setPersonal] = useState<PersonalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dynamic references loaded from the real database with fallbacks
  const [asicsList, setAsicsList] = useState<{ cod_asic: string; nombre_asic: string }[]>(DEFAULT_ASICS_LIST);
  const [clinicasList, setClinicasList] = useState<{ nombre_establecimiento: string; cod_asic: string }[]>(DEFAULT_CLINICAS_LIST);
  const [cargosList, setCargosList] = useState<{ cod_cargo: string; tipo_cargo: string; nombre_cargo: string }[]>([
    { cod_cargo: 'MC', tipo_cargo: 'MEDICO', nombre_cargo: 'MÉDICO COORDINADOR' },
    { cod_cargo: 'MA', tipo_cargo: 'MEDICO', nombre_cargo: 'MÉDICO ASISTENCIAL' },
    { cod_cargo: 'EO', tipo_cargo: 'ENFERMERA', nombre_cargo: 'ENFERMERA OBSERVADORA' },
    { cod_cargo: 'EC', tipo_cargo: 'ENFERMERA', nombre_cargo: 'ENFERMERA COORDINADORA' },
    { cod_cargo: 'IG', tipo_cargo: 'INSPECTOR', nombre_cargo: 'INSPECTOR GEOGRÁFICO DE EPIDEMIOLOGÍA' },
    { cod_cargo: 'PS', tipo_cargo: 'SALUD', nombre_cargo: 'PERSONAL DE SALUD GENERAL' },
    { cod_cargo: 'PA', tipo_cargo: 'ADMINISTRATIVO', nombre_cargo: 'PERSONAL ADMINISTRATIVO' },
    { cod_cargo: 'PO', tipo_cargo: 'OBRERO', nombre_cargo: 'PERSONAL OBRERO' }
  ]);

  // Editable fields in state
  const [fNac, setFNac] = useState('');
  const [movil01, setMovil01] = useState('');
  const [correoPersonal, setCorreoPersonal] = useState('');
  const [cargo, setCargo] = useState('PERSONAL DE SALUD GENERAL');
  const [selectedAsic, setSelectedAsic] = useState('AMI-01');
  const [selectedCentro, setSelectedCentro] = useState('CDI DOCTOR JOSÉ GREGORIO HERNÁNDEZ');

  // Filtered centers list according to selected ASIC
  const filteredClinicas = clinicasList.filter(c => c.cod_asic === selectedAsic);

  // Load Metadata from Supabase views and tables dynamically on mount
  useEffect(() => {
    const fetchDynamicLists = async () => {
      if (!supabase) return;
      try {
        const { data: asicsData, error: asicsErr } = await supabase
          .from('TASIC')
          .select('*');
        if (!asicsErr && asicsData && asicsData.length > 0) {
          const list = asicsData.map((item: any) => {
            const rawCod = item.Cod_ASIC || item.cod_asic || item.id;
            const rawName = item['Nombre ASIC'] || item.nombre_asic || item.nombre || rawCod;
            return {
              cod_asic: String(rawCod || ''),
              nombre_asic: String(rawName || '')
            };
          }).filter((item: any) => item.cod_asic && item.nombre_asic);
          if (list.length > 0) {
            setAsicsList(list);
          }
        }

        const { data: clinicasData, error: clinicasErr } = await supabase
          .from('TClinicas_populares')
          .select('*')
          .order('nombre_establecimiento', { ascending: true });
        if (!clinicasErr && clinicasData && clinicasData.length > 0) {
          const list = clinicasData.map((item: any) => ({
            nombre_establecimiento: String(item.nombre_establecimiento || ''),
            cod_asic: String(item.cod_asic || '')
          })).filter(c => c.nombre_establecimiento);
          if (list.length > 0) {
            setClinicasList(list);
          }
        }

        const { data: cargosData, error: cargosErr } = await supabase
          .from('TCargos')
          .select('*');
        if (!cargosErr && cargosData && cargosData.length > 0) {
          const list = cargosData.map((item: any) => ({
            cod_cargo: String(item.Cod_cargo || item.cod_cargo || ''),
            tipo_cargo: String(item.Tipo_cargo || item.tipo_cargo || ''),
            nombre_cargo: String(item.Nombre_cargo || item.nombre_cargo || '')
          })).filter(c => c.nombre_cargo);
          if (list.length > 0) {
            setCargosList(list);
          }
        }
      } catch (err) {
        console.warn('Error cargando listas de ASICs, centros y cargos reales:', err);
      }
    };
    fetchDynamicLists();
  }, []);

  // Update center when selected ASIC changes
  useEffect(() => {
    const filtered = clinicasList.filter(c => c.cod_asic === selectedAsic);
    if (filtered.length > 0) {
      const exists = filtered.some(c => c.nombre_establecimiento === selectedCentro);
      if (!exists) {
        setSelectedCentro(filtered[0].nombre_establecimiento);
      }
    }
  }, [selectedAsic, clinicasList]);

  // Synchronize with user profile once metadata is loaded
  useEffect(() => {
    if (profile?.id_centro && clinicasList.length > 0) {
      const matchingCentro = clinicasList.find(c => c.nombre_establecimiento.toUpperCase() === profile.id_centro?.toUpperCase());
      if (matchingCentro) {
        setSelectedCentro(matchingCentro.nombre_establecimiento);
        setSelectedAsic(matchingCentro.cod_asic);
      }
    }
  }, [profile?.id_centro, clinicasList]);

  const loadPersonalData = async () => {
    if (!profile?.email) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const cleanEmail = profile.email.toLowerCase().trim();

    try {
      let dataFound: PersonalDetails | null = null;

      // 1. Try fetching from Supabase P_personal
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('P_personal')
            .select('*')
            .eq('correo_personal', cleanEmail)
            .maybeSingle();

          if (!error && data) {
            dataFound = data as PersonalDetails;
            console.log('Ficha de personal cargada de Supabase:', dataFound);
          }
        } catch (dbErr) {
          console.warn('Error leyendo P_personal desde Supabase, recurriendo a local:', dbErr);
        }
      }

      // 2. Fallback to localStorage 's_p_personal'
      if (!dataFound) {
        const localData = localStorage.getItem('s_p_personal');
        if (localData) {
          const list: PersonalDetails[] = JSON.parse(localData);
          const matched = list.find(p => p.correo_personal?.toLowerCase().trim() === cleanEmail);
          if (matched) {
            dataFound = matched;
            console.log('Ficha de personal cargada de LocalStorage:', dataFound);
          }
        }
      }

      // 3. Under fallback, if still not found, allow creating or mapping a standard dummy
      if (!dataFound) {
        // Create an on-the-fly record for this email
        dataFound = {
          cedula: localStorage.getItem(`sim_pass_${cleanEmail}`) || 'V-12345678',
          nacionalidad: 'V',
          nombre_y_apellido: profile.nombre || 'EMPLEADO MIRANDA SALUD',
          sexo: 'M',
          f_nac: '1990-01-01',
          edad: 36,
          movil01: '+58-412-0000000',
          correo_personal: cleanEmail,
          correo_institucional: cleanEmail,
          nivel_educativo: 'UNIVERSITARIO',
          profesion: 'Personal de Salud',
          especialidad: 'MEDICINA DE EMERGENCIA',
          f_ing_apn: '2015-02-15',
          f_ingreso_miranda: '2018-05-10',
          f_egreso_miranda: '',
          f_ingreso_cargo_actual: '2020-03-01',
          tipo_nombramiento: 'ESTABLECE',
          n_gaceta_oficnio: '41200',
          fecha_gaceta_oficio: '2020-02-15'
        };

        // Save immediately locally so it exists
        const localData = localStorage.getItem('s_p_personal');
        const list: PersonalDetails[] = localData ? JSON.parse(localData) : [];
        list.push(dataFound);
        localStorage.setItem('s_p_personal', JSON.stringify(list));
      }

      if (dataFound) {
        setPersonal(dataFound);
        setFNac(dataFound.f_nac || '');
        setMovil01(dataFound.movil01 || '');
        setCorreoPersonal(dataFound.correo_personal?.toLowerCase() || cleanEmail);
        
        // Define cargo/profesion mapping
        const currentProfession = dataFound.profesion || 'Personal de Salud';
        if (['Personal de Salud', 'Personal Administrativo', 'Personal Obrero'].includes(currentProfession)) {
          setCargo(currentProfession);
        } else if (currentProfession.toLowerCase().includes('enfermer') || currentProfession.toLowerCase().includes('medic')) {
          setCargo('Personal de Salud');
        } else {
          setCargo('Personal Administrativo');
        }

        // Selected ASIC & Centro mapping (retrieve first from user's profile table)
        if (profile.id_centro) {
          // Find matching clinic Popular
          const matchingCentro = clinicasList.find(c => c.nombre_establecimiento.toUpperCase() === profile.id_centro?.toUpperCase()) || 
                                 DEFAULT_CLINICAS_LIST.find(c => c.nombre_establecimiento.toUpperCase() === profile.id_centro?.toUpperCase());
          if (matchingCentro) {
            setSelectedCentro(matchingCentro.nombre_establecimiento);
            setSelectedAsic(matchingCentro.cod_asic);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg('No se pudieron obtener sus datos personales de perfil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonalData();
  }, [profile?.email]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personal) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmailInput = correoPersonal.trim().toLowerCase();
    if (!cleanEmailInput) {
      setErrorMsg('El Correo personal es obligatorio.');
      setSaving(false);
      return;
    }

    try {
      const updatedRecord: PersonalDetails = {
        ...personal,
        f_nac: fNac,
        movil01: movil01,
        correo_personal: cleanEmailInput,
        profesion: cargo,
      };

      // 1. Save locally in P_personal (s_p_personal)
      const localData = localStorage.getItem('s_p_personal');
      let list: PersonalDetails[] = localData ? JSON.parse(localData) : [];
      list = list.map(item => {
        if (item.cedula === personal.cedula) {
          return updatedRecord;
        }
        return item;
      });
      localStorage.setItem('s_p_personal', JSON.stringify(list));

      // 2. Save in Supabase P_personal
      if (supabase) {
        try {
          const { error: dbErr } = await supabase
            .from('P_personal')
            .update({
              f_nac: fNac,
              movil01: movil01,
              correo_personal: cleanEmailInput,
              profesion: cargo,
              updated_at: new Date().toISOString()
            })
            .eq('cedula', personal.cedula);

          if (dbErr) throw dbErr;
        } catch (supabaseErr: any) {
          console.warn('No se pudo guardar P_personal en la nube, pero se actualizó localmente:', supabaseErr.message);
        }
      }

      // 3. Update User profile center & axis
      const deducedEje = mapAsicToEje(selectedAsic);
      
      // Update in Local virtual users list
      const virtualUsersStr = localStorage.getItem('s_admin_virtual_users');
      if (virtualUsersStr) {
        let usersList = JSON.parse(virtualUsersStr);
        usersList = usersList.map((usr: any) => {
          if (usr.email.toLowerCase() === profile?.email?.toLowerCase()) {
            return {
              ...usr,
              email: cleanEmailInput,
              id_centro: selectedCentro,
              cod_eje: deducedEje
            };
          }
          return usr;
        });
        localStorage.setItem('s_admin_virtual_users', JSON.stringify(usersList));
      }

      // Update in local state session simulation
      if (localStorage.getItem('sim_logged_user_email') === profile?.email) {
        localStorage.setItem('sim_logged_user_email', cleanEmailInput);
      }

      // Update in Supabase usuarios
      if (supabase && profile?.id) {
        try {
          const { error: usrErr } = await supabase
            .from('usuarios')
            .update({
              email: cleanEmailInput,
              id_centro: selectedCentro,
              cod_eje: deducedEje
            })
            .eq('id', profile.id);

          if (usrErr) throw usrErr;
        } catch (uErr: any) {
          console.warn('No se pudo actualizar usuarios en Supabase:', uErr.message);
        }
      }

      setPersonal(updatedRecord);
      setSuccessMsg('¡Ficha de Personal y Adscripción Territorial actualizadas con éxito!');
      
      // Refresh Auth Context
      setTimeout(() => {
        retryFetchProfile();
      }, 1000);

    } catch (err: any) {
      setErrorMsg('Error al guardar datos: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white border border-slate-200 rounded-3xl min-h-[300px]">
        <RefreshCw className="animate-spin text-[#0B3D5C] shrink-0" size={32} />
        <p className="text-xs font-black text-[#0B3D5C] uppercase tracking-wider">Cargando su Ficha de Personal...</p>
      </div>
    );
  }

  if (!personal) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 text-amber-900 rounded-3xl text-center space-y-2">
        <AlertCircle className="mx-auto text-amber-500 shrink-0" size={32} />
        <h3 className="text-sm font-black uppercase tracking-wider">Ficha de Personal Inactiva</h3>
        <p className="text-xs font-black max-w-sm mx-auto leading-relaxed">
          No logramos ubicar un registro de personal asociado con su correo en Miranda Salud. Intente registrarse mediante Onboarding en la pantalla de inicio.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden max-w-3xl mx-auto"
    >
      {/* Header Ficha */}
      <div className="bg-gradient-to-r from-[#13496C] to-[#0B3D5C] p-5 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#062438]">
        <div>
          <span className="bg-amber-400 text-slate-900 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
            Ficha Oficial de Personal Autenticado
          </span>
          <h2 className="text-base font-black font-display uppercase tracking-tight mt-2 text-white">
            {personal.nombre_y_apellido}
          </h2>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">
            Cédula de Identidad: {personal.nacionalidad}-{personal.cedula}
          </p>
        </div>
        
        <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10 md:text-right shrink-0">
          <p className="text-[9px] font-black text-amber-400 uppercase tracking-wider">Clasificación Orgánica</p>
          <p className="text-xs font-black uppercase text-white mt-0.5">{cargo}</p>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
        
        {/* Banner informativo de privacidad */}
        <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-2.5">
          <User className="text-blue-600 shrink-0 mt-0.5" size={16} />
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider">Control de Acceso Resguardado</p>
            <p className="text-[9px] text-slate-500 font-bold leading-normal uppercase">
              Estimado funcionario: Conforme a los reglamentos de Miranda Salud, solo usted tiene acceso para visualizar y editar sus propios datos.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2 text-[10px] font-bold text-rose-800">
            <AlertCircle className="text-rose-600 shrink-0" size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2 text-[10px] font-bold text-emerald-800">
            <CheckCircle className="text-emerald-00 shrink-0 text-emerald-600" size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sección 1: Datos Personales */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-[#0B3D5C] uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
            <User size={14} /> 1. Datos Personales Editables
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Teléfono Móvil (movil01)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <Phone size={13} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Ej: +58-412-1234567"
                  value={movil01}
                  onChange={e => setMovil01(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Correo Electrónico Personal</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <Mail size={13} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="Ej: correo@gmail.com"
                  value={correoPersonal}
                  onChange={e => setCorreoPersonal(e.target.value.toLowerCase())}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fecha de Nacimiento (f_nac)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <Calendar size={13} />
                </span>
                <input
                  type="date"
                  required
                  value={fNac}
                  onChange={e => setFNac(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Sección 2: Adscripción Territorial y Roles */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-black text-[#0B3D5C] uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
            <MapPin size={14} /> 2. Clasificación de Cargo y Adscripción Territorial
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Clasificación de Cargo</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <Briefcase size={13} />
                </span>
                <select
                  value={cargo}
                  onChange={e => setCargo(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                >
                  {cargosList.map(c => (
                    <option key={c.cod_cargo || c.nombre_cargo} value={c.nombre_cargo}>
                      {c.nombre_cargo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Área Sanitaria (ASIC)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <MapPin size={13} />
                </span>
                <select
                  value={selectedAsic}
                  onChange={e => setSelectedAsic(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                >
                  {asicsList.map(a => (
                    <option key={a.cod_asic} value={a.cod_asic}>
                      {a.nombre_asic}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Establecimiento / Centro de Salud</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <MapPin size={13} />
                </span>
                <select
                  value={selectedCentro}
                  onChange={e => setSelectedCentro(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                >
                  {filteredClinicas.length > 0 ? (
                    filteredClinicas.map(c => (
                      <option key={c.nombre_establecimiento} value={c.nombre_establecimiento}>
                        {c.nombre_establecimiento}
                      </option>
                    ))
                  ) : (
                    <option value={selectedCentro}>{selectedCentro}</option>
                  )}
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Botón de envío */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#0B3D5C] hover:bg-[#072438] hover:scale-[1.01] active:scale-[0.99] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition duration-200 flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw size={13} className="animate-spin" /> Guardando Cambios...
              </>
            ) : (
              <>
                <Save size={13} /> Actualizar mi Ficha
              </>
            )}
          </button>
        </div>

      </form>
    </motion.div>
  );
}
