import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Mail, Key, User, ArrowRight, Loader2, Users, AlertTriangle, Calendar, Building, CheckCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PersonalRecord {
  cedula: string;
  nombre: string;
  fecha_nacimiento: string;
  correo: string;
  telefono: string;
  es_nuevo?: boolean;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [cedula, setCedula] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  
  // Para nuevos usuarios que no existen en p_personal
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');

  // Para el correo y OTP
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [simulatedEmailSent, setSimulatedEmailSent] = useState(false);
  const [isRealEmailSent, setIsRealEmailSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [matchedRecord, setMatchedRecord] = useState<PersonalRecord | null>(null);

  // Estados de depuración y diagnóstico de conexión
  const [edgeFunctionError, setEdgeFunctionError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'failed';
    dbStatus?: string;
    funcStatus?: string;
    errorMessage?: string;
  }>({ status: 'idle' });

  // Inicializar base de datos de p_personal en el localStorage si no existe
  useEffect(() => {
    const list = localStorage.getItem('s_p_personal');
    if (!list) {
      const initialPersonal: PersonalRecord[] = [
        { cedula: 'V-12345678', nombre: 'JUAN CARLOS PÉREZ', fecha_nacimiento: '1980-05-15', correo: 'juanperez@oldmail.com', telefono: '04141112233' },
        { cedula: 'V-23456789', nombre: 'ELIZABETH JOSEFINA TORRES', fecha_nacimiento: '1988-10-22', correo: 'elizabethtorres@oldmail.com', telefono: '04125556677' },
        { cedula: 'V-11223344', nombre: 'MANUEL GIMÉNEZ', fecha_nacimiento: '1975-01-30', correo: 'mgimenez@oldmail.com', telefono: '04169998822' }
      ];
      localStorage.setItem('s_p_personal', JSON.stringify(initialPersonal));
    }
  }, []);

  if (!isOpen) return null;

  const handleVerifyCedula = async () => {
    if (!cedula || !fechaNacimiento) {
      setErrorText('Por favor ingrese tanto la Cédula como la Fecha de Nacimiento.');
      return;
    }

    setLoading(true);
    setErrorText(null);

    try {
      const cleanCedula = cedula.trim().toUpperCase();
      let matchedRec: PersonalRecord | null = null;
      let databaseFound = false;

      // Intentar buscar en Supabase en la tabla "P_personal"
      if (supabase) {
        const { data, error } = await supabase
          .from('P_personal')
          .select('*')
          .eq('cedula', cleanCedula);

        if (!error && data && data.length > 0) {
          databaseFound = true;
          // Buscar coincidencia flexible de fecha de nacimiento
          const dbMatch = data.find(p => {
            const tableBirth = p.f_nac ? p.f_nac.trim() : '';
            return tableBirth === fechaNacimiento || 
                   tableBirth.replace(/\//g, '-') === fechaNacimiento ||
                   fechaNacimiento.split('-').reverse().join('/') === tableBirth;
          });

          if (dbMatch) {
            matchedRec = {
              cedula: dbMatch.cedula,
              nombre: dbMatch.nombre_y_apellido || 'SIN NOMBRE DECLARADO',
              fecha_nacimiento: dbMatch.f_nac || fechaNacimiento,
              correo: dbMatch.correo_personal || '',
              telefono: dbMatch.movil01 || ''
            };
          } else {
            // Cédula existe pero la de nacimiento no coincide
            setErrorText('La Fecha de Nacimiento no coincide con nuestros registros de personal para esta Cédula.');
            setLoading(false);
            return;
          }
        }
      }

      // Si no hay Supabase o no se encontró en la base de datos nacional, buscar en el respaldo local
      if (!databaseFound) {
        const savedPersonal = localStorage.getItem('s_p_personal');
        const personalList: PersonalRecord[] = savedPersonal ? JSON.parse(savedPersonal) : [];
        const localMatch = personalList.find(
          p => p.cedula.toUpperCase() === cleanCedula && p.fecha_nacimiento === fechaNacimiento
        );

        if (localMatch) {
          matchedRec = localMatch;
        }
      }

      setLoading(false);

      if (matchedRec) {
        setMatchedRecord(matchedRec);
        setStep(3); // Ir directamente a pedir nuevo correo
      } else {
        // No existe en "P_personal". Ofrecer crear registro de personal
        setErrorText('No se encontró personal registrado con estas credenciales. Por favor declare sus datos para crear su Ficha de Personal de Miranda Salud.');
        setStep(2); // Ir al paso de crear personal
      }
    } catch (err: any) {
      console.error(err);
      setErrorText('Error de comunicación con el conducto de datos: ' + err.message);
      setLoading(false);
    }
  };

  const handleCreatePersonal = () => {
    if (!nombres || !apellidos || !telefono) {
      setErrorText('Por favor complete todos los campos obligatorios para su nueva ficha.');
      return;
    }

    setLoading(true);
    setErrorText(null);

    setTimeout(() => {
      const cleanCedula = cedula.trim().toUpperCase();
      const compiledName = `${nombres.trim()} ${apellidos.trim()}`.toUpperCase();

      const newRec: PersonalRecord = {
        cedula: cleanCedula,
        nombre: compiledName,
        fecha_nacimiento: fechaNacimiento,
        correo: '',
        telefono: telefono.trim(),
        es_nuevo: true
      };

      // Guardar localmente
      const savedPersonal = localStorage.getItem('s_p_personal');
      const personalList: PersonalRecord[] = savedPersonal ? JSON.parse(savedPersonal) : [];
      personalList.push(newRec);
      localStorage.setItem('s_p_personal', JSON.stringify(personalList));

      setMatchedRecord(newRec);
      setLoading(false);
      setStep(3); // Avanzar a pedir nuevo correo
    }, 800);
  };

  const runSupabaseTest = async () => {
    setTestResult({ status: 'testing' });
    try {
      if (!supabase) {
        setTestResult({
          status: 'failed',
          errorMessage: 'El cliente de Supabase no se encuentra inicializado o no tiene URL definida.',
        });
        return;
      }
      
      const startTime = Date.now();
      const { data, error, status } = await supabase.from('P_personal').select('cedula').limit(1);
      const elapsed = Date.now() - startTime;

      if (error) {
        setTestResult({
          status: 'failed',
          errorMessage: `Error en Base de Datos: ${error.message} (Código ${error.code}, Estatus HTTP ${status})`,
        });
        return;
      }

      const fStartTime = Date.now();
      let funcResMsg = '';
      try {
        console.log('Diagnosticando Edge Function mediante SDK...');
        const { data: fData, error: fError } = await supabase.functions.invoke('send-onboarding-otp', {
          body: { email: 'diagnostic-ping@mirandasalud.gob.ve', code: '0000', nombre: 'Pinger Diagnóstico' }
        });
        const fElapsed = Date.now() - fStartTime;
        if (fError) {
          throw fError;
        } else {
          funcResMsg = `Conexión impecable vía SDK (${fElapsed}ms): ${JSON.stringify(fData)}`;
        }
      } catch (fErr: any) {
        console.warn('Fallo diagnóstico vía SDK, intentando test de contingencia vía fetch directo...', fErr);
        try {
          const targetUrl = 'https://tzmhagwihumwiprsnyid.supabase.co/functions/v1/send-onboarding-otp';
          const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bWhhZ3dpaHVtd2lwcnNueWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjU2NDUsImV4cCI6MjA5NDU0MTY0NX0.ofDFZn5JpOrDktK4YSnUk-Qsd2V5Eil1Nl-xf84rr78';
          
          const fDirectStart = Date.now();
          const rawResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`
            },
            body: JSON.stringify({
              email: 'diagnostic-ping@mirandasalud.gob.ve',
              code: '0000',
              nombre: 'Pinger Diagnóstico'
            })
          });

          const fDirectElapsed = Date.now() - fDirectStart;
          if (rawResponse.ok) {
            const resData = await rawResponse.json();
            funcResMsg = `¡Conexión impecable vía Fetch Directo! (${fDirectElapsed}ms): ${JSON.stringify(resData)}`;
          } else {
            const resText = await rawResponse.text();
            funcResMsg = `La Edge Function falló en ambos métodos. Código Error HTTP: ${rawResponse.status} - ${resText}`;
          }
        } catch (fetchErr: any) {
          funcResMsg = `Error de Red/CORS en ambos intentos: SDK [${fErr?.message || String(fErr)}] | Fetch Directo [${fetchErr?.message || String(fetchErr)}]`;
        }
      }

      setTestResult({
        status: 'success',
        dbStatus: `¡Conexión DB Exitosa! Tabla 'P_personal' leída exitosamente en ${elapsed}ms.`,
        funcStatus: funcResMsg
      });
    } catch (e: any) {
      setTestResult({
        status: 'failed',
        errorMessage: e?.message || String(e)
      });
    }
  };

  const handleSendOTP = async () => {
    if (!nuevoCorreo || !nuevoCorreo.includes('@')) {
      setErrorText('Por favor ingrese un correo electrónico válido.');
      return;
    }

    setLoading(true);
    setErrorText(null);
    setEdgeFunctionError(null);

    // Generar código OTP aleatorio de 4 dígitos
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const finalEmail = nuevoCorreo.trim().toLowerCase();
    const nombreUsuario = matchedRecord ? matchedRecord.nombre : `${nombres} ${apellidos}`.toUpperCase();

    try {
      let functionInvokedSuccessfully = false;

      // Intentar disparar el Edge Function de Supabase para envío real
      if (supabase) {
        try {
          console.log('Intentando envío de otp vía Supabase SDK...');
          const { data, error } = await supabase.functions.invoke('send-onboarding-otp', {
            body: { 
              email: finalEmail, 
              code: code, 
              nombre: nombreUsuario 
            }
          });

          if (!error) {
            console.log('Edge Function ejecutado exitosamente vía SDK:', data);
            functionInvokedSuccessfully = true;
          } else {
            console.warn('Fallo el Edge Function vía SDK, intentando contingencia fetch directo...', error);
            throw error;
          }
        } catch (callErr: any) {
          console.warn('Invocación de Edge Function vía SDK falló, activando contingencia fetch directo...', callErr);
          
          try {
            const targetUrl = 'https://tzmhagwihumwiprsnyid.supabase.co/functions/v1/send-onboarding-otp';
            const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bWhhZ3dpaHVtd2lwcnNueWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjU2NDUsImV4cCI6MjA5NDU0MTY0NX0.ofDFZn5JpOrDktK4YSnUk-Qsd2V5Eil1Nl-xf84rr78';
            
            console.log('Enviando petición fetch directa a:', targetUrl);
            const rawResponse = await fetch(targetUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`
              },
              body: JSON.stringify({
                email: finalEmail,
                code: code,
                nombre: nombreUsuario
              })
            });

            if (rawResponse.ok) {
              const resJson = await rawResponse.json();
              console.log('Edge Function ejecutado exitosamente vía Fetch directo:', resJson);
              functionInvokedSuccessfully = true;
            } else {
              const errorContent = await rawResponse.text();
              console.error('La contingencia fetch directo también falló:', rawResponse.status, errorContent);
              setEdgeFunctionError(`Error del servidor (HTTP ${rawResponse.status}): ${errorContent || rawResponse.statusText}`);
            }
          } catch (fetchErr: any) {
            console.error('Error crítico en fetch de contingencia:', fetchErr);
            setEdgeFunctionError(`Error de Red/CORS extendido en contingencia: ${fetchErr?.message || String(fetchErr)}`);
          }
        }
      }

      setCodigoGenerated(code);
      setLoading(false);
      setIsRealEmailSent(functionInvokedSuccessfully);
      setSimulatedEmailSent(true);
      setStep(4); // Ir a ingresar código
    } catch (err: any) {
      console.error(err);
      setErrorText('Error al procesar la solicitud de despacho: ' + err.message);
      setLoading(false);
    }
  };

  const setCodigoGenerated = (code: string) => {
    setCodigoGenerado(code);
    // Guardar OTP temporal en localStorage para fácil consulta si es necesario
    localStorage.setItem('onboarding_temp_otp', code);
  };

  const handleVerifyOTP = async () => {
    if (codigoIngresado !== codigoGenerado) {
      setErrorText('Código de verificación incorrecto. Por favor revise el simulador de bandeja de correo e intente de nuevo.');
      return;
    }

    setLoading(true);
    setErrorText(null);

    try {
      const cleanEmail = nuevoCorreo.trim().toLowerCase();
      const cleanCedula = cedula.trim().toUpperCase();
      const finalName = matchedRecord ? matchedRecord.nombre : `${nombres} ${apellidos}`.toUpperCase();
      const cleanPhone = telefono.trim() || (matchedRecord ? matchedRecord.telefono : '');

      // 1. Sincronizar en Supabase "P_personal"
      if (supabase) {
        try {
          // Primero revisar si ya existe la cédula en P_personal
          const { data: existRecs, error: checkErr } = await supabase
            .from('P_personal')
            .select('*')
            .eq('cedula', cleanCedula);

          if (!checkErr && existRecs && existRecs.length > 0) {
            // Ya existe, actualizamos correo y teléfono
            await supabase
              .from('P_personal')
              .update({
                correo_personal: cleanEmail,
                movil01: cleanPhone || null,
                updated_at: new Date().toISOString()
              })
              .eq('cedula', cleanCedula);
          } else {
            // No existe, crear el nuevo registro de personal en P_personal
            const newPRecord = {
              cedula: cleanCedula,
              nombre_y_apellido: finalName,
              f_nac: fechaNacimiento,
              movil01: cleanPhone || null,
              correo_personal: cleanEmail,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            await supabase
              .from('P_personal')
              .insert(newPRecord);
          }
        } catch (dbErr) {
          console.warn('Omitido o fallido el guardado en P_personal en Supabase:', dbErr);
        }
      }

      // Actualizar el registro local en s_p_personal del localStorage
      const savedPersonal = localStorage.getItem('s_p_personal');
      let personalList: PersonalRecord[] = savedPersonal ? JSON.parse(savedPersonal) : [];
      personalList = personalList.map(p => {
        if (p.cedula.toUpperCase() === cleanCedula) {
          return { ...p, correo: cleanEmail, telefono: cleanPhone || p.telefono };
        }
        return p;
      });
      localStorage.setItem('s_p_personal', JSON.stringify(personalList));

      // 2. Crear u Obtener registro del operador virtual
      const virtualUsersStr = localStorage.getItem('s_admin_virtual_users');
      const virtualUsers = virtualUsersStr ? JSON.parse(virtualUsersStr) : [];
      
      const filteredUsers = virtualUsers.filter((u: any) => u.email.toLowerCase() !== cleanEmail);

      const newVirtualUser = {
        id: `virtual-${Date.now()}`,
        nombre: finalName,
        email: cleanEmail,
        rol: 'nominal', // rol general predeterminado
        estado: 'pendiente', // acceso restringido a nada (alertas de nuevo registro)
        id_centro: null,
        cod_eje: null,
        created_at: new Date().toISOString()
      };

      filteredUsers.push(newVirtualUser);
      localStorage.setItem('s_admin_virtual_users', JSON.stringify(filteredUsers));

      // Guardar también en la tabla usuarios de Supabase en estado pendiente
      if (supabase) {
        try {
          await supabase.from('usuarios').insert({
            id: newVirtualUser.id,
            nombre: newVirtualUser.nombre,
            email: newVirtualUser.email,
            rol: 'nominal',
            estado: 'pendiente',
            id_centro: null,
            cod_eje: null
          });
        } catch (dbUserErr) {
          console.warn('Omitido insert en tabla usuarios de Supabase:', dbUserErr);
        }
      }

      // Clave es la cédula!!! "correo es usuario y cedula la clave"
      localStorage.setItem(`sim_pass_${cleanEmail}`, cleanCedula);

      // 3. Guardar una alerta en el sistema para el administrador
      const onboardingAlertsStr = localStorage.getItem('s_admin_onboarding_alerts') || '[]';
      const onboardingAlerts = JSON.parse(onboardingAlertsStr);
      onboardingAlerts.push({
        id: `alert-${Date.now()}`,
        nombre: newVirtualUser.nombre,
        cedula: cleanCedula,
        email: cleanEmail,
        fecha: new Date().toISOString(),
        atendida: false
      });
      localStorage.setItem('s_admin_onboarding_alerts', JSON.stringify(onboardingAlerts));

      setLoading(false);
      setStep(5); // Éxito completo!
    } catch (err: any) {
      console.error(err);
      setErrorText('Ocurrió un error guardando las credenciales: ' + err.message);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setCedula('');
    setFechaNacimiento('');
    setNombres('');
    setApellidos('');
    setTelefono('');
    setNuevoCorreo('');
    setCodigoGenerado('');
    setCodigoIngresado('');
    setSimulatedEmailSent(false);
    setIsRealEmailSent(false);
    setErrorText(null);
    setMatchedRecord(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col relative max-h-[90vh]"
      >
        {/* Cabecera institucional del Modal */}
        <div className="bg-[#0B3D5C] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/10 rounded-xl text-yellow-400">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider font-display text-white">Actualización de Personal</h2>
              <p className="text-[8.5px] text-slate-300 font-bold uppercase tracking-widest mt-0.5">Miranda Salud • Onboarding 2026</p>
            </div>
          </div>
          <button 
            onClick={handleReset}
            className="text-white/70 hover:text-white transition-colors font-bold text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg cursor-pointer text-center"
          >
            Cerrar ×
          </button>
        </div>

        {/* Simulador flotante de correo/SMS para testing de OTP/Correo Real */}
        {simulatedEmailSent && step === 4 && (
          isRealEmailSent ? (
            <div className="bg-emerald-50 border-b border-emerald-200 p-4 text-center space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-800 rounded shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                📨 Envío Real Activo • Supabase & Resend
              </span>
              <p className="text-[10.5px] text-emerald-950 font-black leading-normal uppercase">
                ¡Se ha despachado un código de seguridad real a su bandeja <span className="underline font-mono text-emerald-950 font-black">{nuevoCorreo}</span>!
              </p>
              <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">
                Revise su bandeja de entrada (y la sección de Correo no deseado / Spam si es necesario) para ingresar el código de 4 dígitos.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border-b border-amber-205 p-3 text-center space-y-1">
              <span className="inline-block px-1.5 py-0.5 text-[8.5px] font-black uppercase bg-amber-200 text-amber-850 rounded">⚠️ Alerta de Envío de Correo Real</span>
              <p className="text-[10px] text-amber-900 font-bold leading-normal">
                El envío real falló y se requirió el Simulador de Correo <span className="font-mono underline">{nuevoCorreo}</span>:
              </p>
              <p className="text-xs font-black text-amber-950 uppercase tracking-widest font-mono">
                Código de Seguridad: <span className="bg-amber-100 px-2 py-0.5 rounded text-base border border-amber-300 shadow-sm font-black">{codigoGenerado}</span>
              </p>
              {edgeFunctionError && (
                <div className="mt-1.5 text-[8.5px] text-rose-800 bg-rose-50 border border-rose-150 p-2 rounded-xl text-left font-mono">
                  <span className="font-black uppercase block text-[7.5px] text-rose-700 mb-0.5">Motivo del fallo técnico de la Edge Function:</span>
                  <div className="break-all">{edgeFunctionError}</div>
                  <p className="text-[7px] text-slate-500 font-sans mt-1 uppercase font-semibold leading-normal">
                    * Verifique sus secrets en Supabase: Asegure que ha corrido <code className="bg-slate-100 px-0.5 text-slate-800 rounded font-mono">supabase secrets set bakend_RESEND_API_KEY=su_clave</code> y recargado la función.
                  </p>
                </div>
              )}
            </div>
          )
        )}

        <div className="p-6 overflow-y-auto space-y-4">

          {errorText && (
            <div className="bg-rose-50 border border-rose-150 border-rose-200 text-rose-800 p-3 rounded-2xl text-[10px] font-bold flex items-start gap-2">
              <AlertTriangle size={15} className="text-rose-500 shrink-0 mt-0.5" />
              <span>{errorText}</span>
            </div>
          )}

          {/* PASO 1: Ingreso de Cédula y Fecha de Nacimiento */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <Users size={28} className="text-[#0B3D5C] mx-auto mb-1" />
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 font-display">Ingreso al Registro de Personal</h3>
                <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wide">
                  Provea su Cédula y Fecha de Nacimiento para validar sus datos de filiación.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Cédula de Identidad</label>
                  <input
                    type="text"
                    placeholder="Ej: V-12345678"
                    value={cedula}
                    onChange={e => setCedula(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C] uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Fecha de Nacimiento</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={fechaNacimiento}
                      onChange={e => setFechaNacimiento(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>
                </div>

                <button
                  onClick={handleVerifyCedula}
                  disabled={loading}
                  className="w-full bg-[#0B3D5C] hover:bg-[#072B41] font-black text-[10px] tracking-wider uppercase text-white py-2.5 rounded-xl mt-4 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Buscando en Base de Datos de Personal...
                    </>
                  ) : (
                    <>
                      Comprobar Datos <ArrowRight size={12} />
                    </>
                  )}
                </button>
              </div>

              <div className="border-t border-slate-100 pt-3 text-center">
                <p className="text-[9px] text-slate-400 font-bold uppercase leading-normal">
                  💡 <span className="text-slate-500">¿Desea probar la demostración?</span> Use cédula <code className="font-mono font-black text-slate-700 bg-slate-100 px-1 py-0.5 rounded">V-12345678</code> y fecha <code className="font-mono font-black text-slate-700 bg-slate-100 px-1 py-0.5 rounded">1980-05-15</code>.
                </p>
              </div>
            </div>
          )}

          {/* PASO 2: Persona No Existe - Creación en p_personal */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl space-y-1">
                <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-wider">📁 Nueva Ficha de Personal Requerida</h4>
                <p className="text-[9px] text-amber-700 font-bold uppercase leading-normal">
                  Su cédula {cedula} no está registrada en el censo. Complete este formulario para integrarse a la base de datos de personal de Miranda Salud.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Nombres</label>
                  <input
                    type="text" placeholder="Declare nombres completos"
                    value={nombres} onChange={e => setNombres(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Apellidos</label>
                  <input
                    type="text" placeholder="Declare apellidos completos"
                    value={apellidos} onChange={e => setApellidos(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Cédula Declarada</label>
                  <input
                    type="text" disabled value={cedula}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3 py-2 text-xs font-black uppercase font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Teléfono de Contacto</label>
                  <input
                    type="text" placeholder="Ej: 0414-0000000"
                    value={telefono} onChange={e => setTelefono(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-750 text-slate-700 font-black uppercase text-[9.5px] tracking-wider py-2.5 rounded-xl transition cursor-pointer text-center"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleCreatePersonal}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9.5px] tracking-wider py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : 'Crear Ficha y Continuar'}
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Poner Nuevo Correo */}
          {step === 3 && matchedRecord && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-155 border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                  <User size={20} />
                </span>
                <div>
                  <h4 className="text-[10.5px] font-black text-emerald-800 uppercase leading-none">Personal de Salud Identificado</h4>
                  <p className="text-slate-850 font-black text-xs uppercase mt-1 leading-none">{matchedRecord.nombre}</p>
                  <p className="text-[8.5px] font-black font-mono text-emerald-700 mt-1 uppercase">Cédula: {matchedRecord.cedula}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-center space-y-1">
                  <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Renovación / Declaración de Correo Electrónico</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase leading-normal">
                    Este correo constituirá su identificador unificado en Miranda Salud. Su clave de acceso por defecto será su Cédula.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Nuevo Correo para Operador</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <Mail size={13} />
                    </span>
                    <input
                      type="email"
                      placeholder="Ej: nuevo.correo@gmail.com"
                      value={nuevoCorreo}
                      onChange={e => setNuevoCorreo(e.target.value.toLowerCase())}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full bg-[#0B3D5C] hover:bg-[#072B41] font-black uppercase text-[10px] tracking-wider py-2.5 rounded-xl text-white transition flex items-center justify-center gap-1 cursor-pointer mt-2"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : 'Generar Código de Onboarding'}
                </button>
              </div>
            </div>
          )}

          {/* PASO 4: Ingreso de OTP */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <Key size={32} className="text-yellow-500 mx-auto mb-1 animate-pulse" />
                <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight font-display">Código de Autenticación Requerido</h3>
                <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider leading-normal">
                  Hemos enviado un token de onboarding de 4 dígitos para autorizar la actualización. Consúltelo en la cabecera e ingréselo a continuación.
                </p>
              </div>

              <div className="space-y-3 max-w-[200px] mx-auto py-2">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="••••"
                  value={codigoIngresado}
                  onChange={e => setCodigoIngresado(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.7em] text-lg font-black bg-slate-55 bg-slate-100 border border-slate-350 border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:outline-none focus:border-[#0B3D5C]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase text-[9.5px] tracking-wider py-2.5 rounded-xl transition cursor-pointer text-center"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="flex-1 bg-[#0B3D5C] hover:bg-[#072B41] text-white font-black uppercase text-[9.5px] tracking-wider py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : 'Actualizar Ahora ⚡'}
                </button>
              </div>
            </div>
          )}

          {/* PASO 5: Éxito total */}
          {step === 5 && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
                <CheckCircle size={36} />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-emerald-800 tracking-tight font-display">¡Actualización Recibida Exitosamente!</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Miranda Salud • Registro Operativo en Cola</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-sm mx-auto text-left space-y-2">
                <h4 className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-250 border-slate-200 pb-1">Credenciales creadas</h4>
                
                <div className="space-y-1.5 text-[10px] font-bold">
                  <p className="flex justify-between">
                    <span className="text-slate-400 uppercase">Usuario Correo:</span>
                    <span className="text-slate-800 font-mono font-black">{nuevoCorreo}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400 uppercase">Cédula Clave:</span>
                    <span className="text-slate-800 font-mono font-black">{cedula}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400 uppercase">Estado Cuenta:</span>
                    <span className="text-yellow-600 bg-yellow-50 border border-yellow-200/50 px-1 py-0.5 rounded text-[8.5px] uppercase font-black">Pendiente (Revisión)</span>
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 font-medium leading-normal max-w-xs mx-auto italic">
                Su cuenta no tendrá acceso a ningún departamento ni planillas hasta que el Administrador evalúe su caso y complete su asignación departamental.
              </p>

              <button
                type="button"
                onClick={handleReset}
                className="w-full bg-[#0B3D5C] hover:bg-[#072B41] text-white font-black uppercase text-[10px] tracking-wider py-2.5 rounded-xl transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          )}

          {/* Panel Universal de Diagnóstico Técnico de Conexión a Supabase */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowDiagnostics(!showDiagnostics);
                if (!showDiagnostics && testResult.status === 'idle') {
                  runSupabaseTest();
                }
              }}
              className="w-full flex items-center justify-between text-slate-400 hover:text-slate-600 transition-colors py-1 px-1"
            >
              <span className="flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider">
                <RefreshCw size={11} className={`text-slate-500 ${testResult.status === 'testing' ? 'animate-spin' : ''}`} />
                ⚡ Diagnóstico Técnico de Conexión Supabase
              </span>
              <span className="text-[9px] font-black text-slate-400 hover:text-slate-600">
                {showDiagnostics ? 'Ocultar ▲' : 'Mostrar ▼'}
              </span>
            </button>

            {showDiagnostics && (
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 text-left animate-pulse-once">
                <div className="flex items-center justify-between">
                  <span className="text-[7.5px] text-slate-400 uppercase font-black tracking-wider">Pruebas en tiempo real:</span>
                  <button
                    type="button"
                    onClick={runSupabaseTest}
                    disabled={testResult.status === 'testing'}
                    className="text-[8px] font-black uppercase text-[#0B3D5C] hover:underline bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-xs cursor-pointer"
                  >
                    Re-testear
                  </button>
                </div>

                {testResult.status === 'testing' && (
                  <div className="flex items-center gap-2 py-2 text-slate-500">
                    <Loader2 size={12} className="animate-spin text-slate-400" />
                    <span className="text-[9px] font-black uppercase tracking-wide">Pingeando nodos y bases de datos de Supabase...</span>
                  </div>
                )}

                {testResult.status === 'success' && (
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-1.5 text-[9.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-150 p-1.5 rounded-lg">
                      <span className="shrink-0 text-emerald-500">●</span>
                      <span>{testResult.dbStatus}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[9px] font-bold text-blue-800 bg-blue-50 border border-blue-150 p-1.5 rounded-lg">
                      <span className="shrink-0 text-blue-500">●</span>
                      <span className="font-mono">{testResult.funcStatus}</span>
                    </div>
                  </div>
                )}

                {testResult.status === 'failed' && (
                  <div className="bg-rose-50 border border-rose-250 text-rose-850 p-2 text-[9px] font-bold rounded-lg space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-700 font-black uppercase">
                      <span>❌ ERROR DE TRÁNSITO</span>
                    </div>
                    <p className="font-mono text-rose-800 text-[8px] leading-relaxed select-all bg-rose-100 p-1 rounded border border-rose-200">{testResult.errorMessage}</p>
                    <p className="text-[8px] text-slate-500 font-sans leading-normal">
                      Por favor verifique que sus secretos de Supabase (como su API Key) no han expirado o rotado, y que la Edge Function <code className="font-mono bg-slate-100 px-0.5 rounded text-slate-800">send-onboarding-otp</code> está debidamente desplegada.
                    </p>
                  </div>
                )}

                <div className="text-[7.5px] text-slate-400 font-mono space-y-0.5 pt-1.5 border-t border-slate-200 uppercase font-semibold">
                  <p>• API URL: <span className="text-slate-600">https://tzmhagwihumwiprsnyid.supabase.co</span></p>
                  <p>• Función: <span className="text-slate-600">/functions/v1/send-onboarding-otp</span></p>
                </div>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}
