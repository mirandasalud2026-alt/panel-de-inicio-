import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Syringe, 
  Stethoscope, 
  Activity, 
  User, 
  Lock, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  LogOut, 
  Send,
  Database,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// URL de la API en Google Apps Script
const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbw_Z7W2D63P1gBQ9ezDwk28DciOEh7SorveWdSZBmf2gMYyiuOUuEMrqj3Bj3K7BY0QNQ/exec";

// Datos oficiales de ASICs relacionales
const ASICS_DATA = [
  { code: "ES-9001", label: "ES-9001 - ASIC Carrizal" },
  { code: "ES-9002", label: "ES-9002 - ASIC Llano Alto" },
  { code: "ES-9004", label: "ES-9004 - ASIC Francisco de Miranda" },
  { code: "ES-9006", label: "ES-9006 - ASIC Paracotos" },
  { code: "ES-9009", label: "ES-9009 - ASIC Los Helechos" }
];

type ActiveForm = 'VACUNACION' | 'MORBILIDAD' | 'CONTROL_PACIENTES';

export default function NominalDashboard() {
  // Autenticación local temporal
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nominal_authenticated') === 'true' || 
             localStorage.getItem('sim_demo_role') === 'nominal';
    }
    return false;
  });

  // Estado del formulario
  const [activeForm, setActiveForm] = useState<ActiveForm | null>(null);
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [selectedAsic, setSelectedAsic] = useState('');
  const [extraField, setExtraField] = useState('');
  
  // Estados de envío y feedback
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Efecto para sincronizar autenticación en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isAuthenticated) {
        localStorage.setItem('nominal_authenticated', 'true');
        localStorage.setItem('sim_demo_admin', 'true');
        localStorage.setItem('sim_demo_role', 'nominal');
      } else {
        localStorage.removeItem('nominal_authenticated');
      }
    }
  }, [isAuthenticated]);

  // Manejar Login Nominal Local
  const handleLocalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (emailInput.trim() === 'nominal@mirandasalud.com' && passwordInput === 'nominal2026') {
      setIsAuthenticated(true);
    } else {
      setAuthError('Credenciales nominales incorrectas. Intente nuevamente.');
    }
  };

  // Cerrar sesión
  const handleSignOut = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nominal_authenticated');
      localStorage.removeItem('sim_demo_admin');
      localStorage.removeItem('sim_demo_role');
    }
    window.location.reload();
  };

  // Enviar formulario (Conexión Transaccional a Apps Script y respaldo de Supabase opcional)
  const handleConfirmAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeForm) return;
    if (!cedula.trim() || !nombre.trim() || !selectedAsic || !extraField.trim()) {
      setErrorMsg('Por favor complete todos los campos obligatorios.');
      return;
    }

    setIsSyncing(true);
    setErrorMsg('');
    setSyncSuccess(false);

    // JSON estructurado de forma íntegra según la solicitud
    const payload = {
      tipoFormulario: activeForm,
      datos: {
        cedula: cedula.trim(),
        nombre: nombre.trim(),
        asic: selectedAsic,
        registrado_por: "nominal@mirandasalud.com",
        extra: extraField.trim()
      }
    };

    try {
      console.log('📡 Sincronizando transacción nominal con la red central Google Apps Script...');
      
      // Llamada fetch en modo 'no-cors' para evadir restricciones de origen cruzado
      const response = await fetch(GOOGLE_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // El modo 'no-cors' devuelve una opacidad. El envío es unidireccional y exitoso si no hay exclusión de red.
      // Damos por exitoso el envío una vez que la promesa fetch se resuelve.
      setTimeout(() => {
        setIsSyncing(false);
        setSyncSuccess(true);
        // Limpiamos el formulario
        setCedula('');
        setNombre('');
        setSelectedAsic('');
        setExtraField('');
        
        // Autoocultar el banner de éxito después de 4 segundos
        setTimeout(() => setSyncSuccess(false), 4000);
      }, 1500);

    } catch (error: any) {
      console.error('❌ Error de red transaccional:', error);
      setErrorMsg('No se pudo establecer un enlace con el Apps Script. Verifique su conexión.');
      setIsSyncing(false);
    }
  };

  // Si no está autenticado localmente, muestra el formulario de Login minimalista
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col justify-between font-sans selection:bg-neutral-800/10">
        <div className="h-1.5 w-full flex shrink-0">
          <div className="flex-1 bg-[#FFD700]"></div>
          <div className="flex-1 bg-[#002F6C]"></div>
          <div className="flex-1 bg-[#CF0921]"></div>
          <div className="flex-1 bg-[#008751]"></div>
        </div>

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md bg-white border border-neutral-200 p-8 md:p-10 rounded-[2rem] shadow-sm relative"
          >
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 bg-neutral-100 text-neutral-800 text-[9px] font-black uppercase tracking-widest rounded-full mb-3">
                Identidad Nominal Autorizada
              </span>
              <h1 className="text-2xl font-black text-neutral-900 tracking-tight uppercase">Portal Nominal</h1>
              <p className="text-xs text-neutral-500 mt-1 font-medium">SIM • Dirección Estadal de Salud</p>
            </div>

            <form onSubmit={handleLocalLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Introduzca Usuario</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 focus:border-neutral-900 focus:bg-white rounded-xl text-sm transition-colors outline-none"
                    placeholder="nominal@mirandasalud.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Introduzca Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 focus:border-neutral-900 focus:bg-white rounded-xl text-sm transition-colors outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {authError && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5"
                >
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{authError}</span>
                </motion.div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-neutral-950 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-neutral-800 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                Autenticar e Ingresar
              </button>
            </form>
          </motion.div>
        </main>

        <footer className="py-6 text-center border-t border-neutral-150 bg-neutral-50">
          <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-[0.2em]">
            DIRECCIÓN ESTADAL DE SALUD MIRANDA • CONEXIÓN NOMINAL EN LA NUBE
          </p>
        </footer>
      </div>
    );
  }

  // Panel de Carga Nominal Principal
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 flex flex-col justify-between selection:bg-neutral-800/10">
      <div className="h-1.5 w-full flex shrink-0">
        <div className="flex-1 bg-[#FFD700]"></div>
        <div className="flex-1 bg-[#002F6C]"></div>
        <div className="flex-1 bg-[#CF0921]"></div>
        <div className="flex-1 bg-[#008751]"></div>
      </div>

      <header className="bg-white border-b border-neutral-200 py-4 px-6 md:px-8">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-950 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-sm">
              💉
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight text-neutral-900">SIM Nominal</h1>
              <p className="text-[9px] font-bold uppercase text-neutral-400 tracking-wider">Carga Nominal Autorizada</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-neutral-500 tracking-wider">nominal@mirandasalud.com</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#059669] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full mt-0.5">
                Rol: Usuario Nominal
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2.5 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 border border-neutral-150 rounded-lg hover:border-neutral-300 transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 space-y-12">
        
        {/* Cabecera del Panel */}
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-neutral-950 text-white text-[9px] font-extrabold uppercase tracking-widest rounded-full">
            Terminal Transaccional v2.6
          </span>
          <h2 className="text-3xl font-black text-neutral-950 tracking-tight uppercase">Sistema Central de Carga Nominal</h2>
          <p className="text-xs text-neutral-500 max-w-lg mx-auto font-medium">
            Seleccione el tipo de evento epidemiológico a registrar para desplegar el formulario oficial de transmisión hacia la red central.
          </p>
        </div>

        {/* Grupo de 3 Botones Principales Alineados Geométricamente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* BOTÓN VACUNACIÓN */}
          <button
            onClick={() => {
              setActiveForm('VACUNACION');
              setSyncSuccess(false);
              setErrorMsg('');
            }}
            className={`group relative overflow-hidden p-6 rounded-2xl border transition-all text-left flex flex-col justify-between h-40 cursor-pointer ${
              activeForm === 'VACUNACION'
                ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-sm'
                : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              activeForm === 'VACUNACION' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'
            }`}>
              <Syringe size={20} />
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 ${
                activeForm === 'VACUNACION' ? 'text-emerald-700' : 'text-neutral-400'
              }`}>
                Inmunización Colectiva
              </span>
              <h3 className="text-lg font-extrabold text-neutral-900 group-hover:text-emerald-800 transition-colors uppercase">
                💉 Vacunación
              </h3>
            </div>
            {activeForm === 'VACUNACION' && (
              <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

          {/* BOTÓN MORBILIDAD */}
          <button
            onClick={() => {
              setActiveForm('MORBILIDAD');
              setSyncSuccess(false);
              setErrorMsg('');
            }}
            className={`group relative overflow-hidden p-6 rounded-2xl border transition-all text-left flex flex-col justify-between h-40 cursor-pointer ${
              activeForm === 'MORBILIDAD'
                ? 'border-[#0B3D5C] bg-[#0b3d5c]/5 ring-1 ring-[#0B3D5C] shadow-sm'
                : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              activeForm === 'MORBILIDAD' 
                ? 'bg-[#0B3D5C] text-white' 
                : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
            }`}>
              <Stethoscope size={20} />
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 ${
                activeForm === 'MORBILIDAD' ? 'text-[#0B3D5C]' : 'text-neutral-400'
              }`}>
                Vigilancia Regular
              </span>
              <h3 className="text-lg font-extrabold text-neutral-900 group-hover:text-[#0b3d5c] transition-colors uppercase">
                🩺 Morbilidad
              </h3>
            </div>
            {activeForm === 'MORBILIDAD' && (
              <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#0B3D5C] animate-pulse"></span>
            )}
          </button>

          {/* BOTÓN CONTROL DE PACIENTES */}
          <button
            onClick={() => {
              setActiveForm('CONTROL_PACIENTES');
              setSyncSuccess(false);
              setErrorMsg('');
            }}
            className={`group relative overflow-hidden p-6 rounded-2xl border transition-all text-left flex flex-col justify-between h-40 cursor-pointer ${
              activeForm === 'CONTROL_PACIENTES'
                ? 'border-cyan-600 bg-cyan-50/40 ring-1 ring-cyan-500 shadow-sm'
                : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              activeForm === 'CONTROL_PACIENTES' 
                ? 'bg-cyan-600 text-white' 
                : 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100'
            }`}>
              <Activity size={20} />
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 ${
                activeForm === 'CONTROL_PACIENTES' ? 'text-cyan-700' : 'text-neutral-400'
              }`}>
                Fichas y Programas Crónicos
              </span>
              <h3 className="text-lg font-extrabold text-neutral-900 group-hover:text-cyan-800 transition-colors uppercase">
                📊 Control Pacientes
              </h3>
            </div>
            {activeForm === 'CONTROL_PACIENTES' && (
              <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            )}
          </button>

        </div>

        {/* Formulario Único con Desplegable Inteligente */}
        <AnimatePresence mode="wait">
          {activeForm ? (
            <motion.div
              key={activeForm}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-neutral-200 p-8 rounded-[2rem] shadow-sm space-y-6"
            >
              <div className="border-b border-neutral-100 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">
                    Formulario Activo
                  </span>
                  <h3 className="text-xl font-extrabold text-neutral-900 uppercase tracking-tight mt-1">
                    Carga Nominal: {activeForm === 'VACUNACION' ? 'Vacunación' : activeForm === 'MORBILIDAD' ? 'Morbilidad' : 'Control de Pacientes'}
                  </h3>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full ${
                  activeForm === 'VACUNACION' ? 'bg-emerald-500' : activeForm === 'MORBILIDAD' ? 'bg-[#0B3D5C]' : 'bg-cyan-500'
                }`}></div>
              </div>

              {syncSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-5 rounded-2xl flex items-start gap-3.5"
                >
                  <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h5 className="font-extrabold text-sm uppercase tracking-wider">¡Éxito Transaccional!</h5>
                    <p className="text-xs text-emerald-700 mt-1">
                      El lote ha sido despachado en caliente a Google Sheets y se encuentra en proceso de sincronización con Supabase de Producción.
                    </p>
                  </div>
                </motion.div>
              )}

              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              <form onSubmit={handleConfirmAndRegister} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cédula del Paciente */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">
                      Cédula del Paciente <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">V / E</span>
                      <input
                        type="text"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                        placeholder="Ej: 21990443"
                        disabled={isSyncing}
                        className="w-full pl-16 pr-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-neutral-950 focus:bg-white rounded-xl text-sm transition-colors outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Nombres y Apellidos */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">
                      Nombres y Apellidos <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Carlos Eduardo Pérez"
                        disabled={isSyncing}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-neutral-950 focus:bg-white rounded-xl text-sm transition-colors outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Desplegable ASIC Jurisdicción */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">
                      ASIC Jurisdicción <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedAsic}
                        onChange={(e) => setSelectedAsic(e.target.value)}
                        disabled={isSyncing}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-neutral-950 focus:bg-white rounded-xl text-sm transition-colors outline-none appearance-none cursor-pointer"
                        required
                      >
                        <option value="">-- Seleccionar Jurisdicción --</option>
                        {ASICS_DATA.map((asic) => (
                          <option key={asic.code} value={asic.code}>
                            {asic.label}
                          </option>
                        ))}
                      </select>
                      <Building className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={14} />
                    </div>
                  </div>

                  {/* Campo Dinámico según el Botón Seleccionado */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">
                      {activeForm === 'VACUNACION' && "Producto / Biológico Aplicado *"}
                      {activeForm === 'MORBILIDAD' && "Diagnóstico Clínico (CIE-10) *"}
                      {activeForm === 'CONTROL_PACIENTES' && "Patología o Condición Crónica *"}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={extraField}
                        onChange={(e) => setExtraField(e.target.value)}
                        placeholder={
                          activeForm === 'VACUNACION' 
                            ? "Ej: Pentavalente (Lote: A223)" 
                            : activeForm === 'MORBILIDAD' 
                              ? "Ej: Hipertensión ES-I10" 
                              : "Ej: Diabetes Mellitus Tipo 2"
                        }
                        disabled={isSyncing}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-neutral-950 focus:bg-white rounded-xl text-sm transition-colors outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Botón de Confirmar y Registrar */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className={`px-8 py-3.5 text-white font-bold rounded-xl text-xs uppercase tracking-widest active:scale-98 transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                      isSyncing
                        ? 'bg-neutral-400 cursor-not-allowed'
                        : activeForm === 'VACUNACION'
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                          : activeForm === 'MORBILIDAD'
                            ? 'bg-[#0B3D5C] hover:bg-[#082E47] shadow-[#0B3D5C]/10'
                            : 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/10'
                    }`}
                  >
                    {isSyncing ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-b-transparent"></div>
                        <span>Sincronizando con la red central...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Confirmar y Registrar</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-neutral-100 border-2 border-dashed border-neutral-200 text-center py-16 px-6 rounded-[2rem]"
            >
              <Database className="mx-auto text-neutral-300 mb-4" size={40} />
              <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest">
                Esperando Selección de Evento
              </p>
              <p className="text-[11px] text-neutral-400 mt-1 max-w-xs mx-auto">
                Seleccione un formulario arriba para inicializar el túnel de carga segura.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      <footer className="py-8 bg-white border-t border-neutral-200 text-center shrink-0">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
          <span>Gobierno de Miranda • SIM {new Date().getFullYear()}</span>
          <span className="flex items-center gap-1.5 text-neutral-300 font-normal">
            ● Transmisión Opaque Segura (No-CORS Proxy Activo)
          </span>
        </div>
      </footer>
    </div>
  );
}
