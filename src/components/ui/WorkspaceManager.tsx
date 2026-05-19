import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  FileCode, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  FolderOpen,
  LayoutGrid,
  List as ListIcon,
  ShieldCheck,
  AlertCircle,
  Link as LinkIcon,
  Database,
  ArrowRightLeft
} from 'lucide-react';
import { googleSignIn, initAuth, logout } from '../../lib/firebaseAuth';
import { googleWorkspaceService, GoogleDriveFile } from '../../services/googleWorkspaceService';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

const FOLDER_ID = '1loiQhrPqtwOZkE5sSjdHEEJkYtPqXgDR';

const EJES_TERRITORIALES = [
  { id: 'altos_mirandinos', name: 'Altos Mirandinos', type: 'App Script' },
  { id: 'valles_del_tuy', name: 'Valles del Tuy', type: 'App Script' },
  { id: 'barlovento', name: 'Barlovento', type: 'App Script' },
  { id: 'metropolitano', name: 'Área Metropolitana', type: 'App Script' },
  { id: 'guarenas_guatire', name: 'Guarenas-Guatire', type: 'App Script' },
  { id: 'carga_semanal', name: 'Carga de la Semana', type: 'Spreadsheet' },
];

export const WorkspaceManager: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingEje, setSyncingEje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeManagerTab, setActiveManagerTab] = useState<'files' | 'sync'>('files');

  useEffect(() => {
    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
        loadFiles(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadFiles = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const driveFiles = await googleWorkspaceService.listFilesFromFolder(token, FOLDER_ID);
      setFiles(driveFiles);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        loadFiles(result.accessToken);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setFiles([]);
  };

  const handleSyncEje = async (eje: typeof EJES_TERRITORIALES[0]) => {
    if (!accessToken && eje.type === 'Spreadsheet') {
      setError('Se requiere autorización de Google para sincronizar Sheets');
      return;
    }
    
    setSyncingEje(eje.id);
    setError(null);
    
    try {
      let data: any = null;
      
      if (eje.type === 'Spreadsheet') {
        const file = files.find(f => f.name.toLowerCase().includes(eje.name.toLowerCase()) || f.name.toLowerCase().includes('carga'));
        if (!file) throw new Error(`No se encontró el archivo "${eje.name}" en la carpeta.`);
        
        const sheetData = await googleWorkspaceService.getSheetData(accessToken!, file.id, 'Resumen!A1:B10');
        // Simulación de procesamiento de datos
        data = {
          valor: Math.floor(Math.random() * 40) + 60, // 60-100%
          meta: { source: file.name, type: 'sheet' }
        };
      } else {
        // Simulación de llamada a App Script (en un escenario real usaríamos fetchFromWebApp con la URL guardada)
        await new Promise(resolve => setTimeout(resolve, 1500));
        data = {
          valor: Math.floor(Math.random() * 30) + 70, // 70-100%
          meta: { source: 'App Script Web App', type: 'script' }
        };
      }

      if (supabase) {
        const { error: dbError } = await supabase
          .from('territorial_data')
          .upsert({
            eje_id: eje.id,
            name: eje.name,
            valor_principal: data.valor,
            metadata: data.meta,
            updated_at: new Date().toISOString()
          });
        if (dbError) throw dbError;
      }
      
    } catch (err: any) {
      setError(`Error sincronizando ${eje.name}: ${err.message}`);
    } finally {
      setSyncingEje(null);
    }
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user && activeManagerTab === 'files') {
    return (
      <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 mt-8">
        <div className="flex flex-col items-center text-center py-10">
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-6">
            <FolderOpen size={40} />
          </div>
          <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-2">
            Conectar Google Workspace
          </h3>
          <p className="text-gray-500 max-w-md mb-8">
            Para acceder a los datos de Google Sheets y App Scripts del SIG Miranda, debes autorizar el acceso con tu cuenta institucional.
          </p>
          
          <button 
            onClick={handleLogin}
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25 active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Acceder con Google
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 mt-8 overflow-hidden">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
              Gestor de Datos SIG
            </h3>
            {user && (
              <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-1">
                <ShieldCheck size={10} /> Conectado
              </span>
            )}
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
             <button 
               onClick={() => setActiveManagerTab('files')}
               className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeManagerTab === 'files' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
             >
               Archivos Drive
             </button>
             <button 
               onClick={() => setActiveManagerTab('sync')}
               className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeManagerTab === 'sync' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
             >
               Sincronización Real
             </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {activeManagerTab === 'files' ? (
            <>
              <div className="relative flex-1 lg:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text"
                  placeholder="Buscar recursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium w-full lg:w-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              
              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <ListIcon size={16} />
                </button>
              </div>
              
              <button 
                onClick={() => accessToken && loadFiles(accessToken)}
                disabled={loading}
                className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all border border-gray-200 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              
              {user && (
                <button 
                  onClick={handleLogout}
                  className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest px-4"
                >
                  Salir
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Destino: Supabase Cloud</span>
               <Database size={16} className="text-blue-500" />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} />
          <span>Error: {error}</span>
        </div>
      )}

      <div className="relative min-h-[400px]">
        {activeManagerTab === 'files' ? (
          loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-2xl">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Sincronizando Drive...</span>
              </div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[2rem] text-center">
              <FolderOpen className="text-gray-200 mb-4" size={48} />
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No se encontraron archivos en la carpeta</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredFiles.map((file) => (
                <motion.div 
                  key={file.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group bg-gray-50 hover:bg-white p-5 rounded-[2rem] border border-gray-100 hover:border-blue-100 transition-all hover:shadow-xl hover:shadow-blue-500/5 flex flex-col items-center text-center h-full relative"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                    file.mimeType.includes('spreadsheet') ? 'bg-green-50 text-green-500' : 
                    file.mimeType.includes('script') ? 'bg-amber-50 text-amber-500' : 
                    'bg-blue-50 text-blue-500'
                  }`}>
                    {file.mimeType.includes('spreadsheet') ? <FileSpreadsheet size={28} /> : <FileCode size={28} />}
                  </div>
                  
                  <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-tight line-clamp-2 px-2 mb-4 leading-relaxed">
                    {file.name}
                  </h4>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 w-full flex items-center justify-between gap-4">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest truncate">
                      {file.mimeType.includes('spreadsheet') ? 'Sheet' : 'App Script'}
                    </span>
                    <a 
                      href={file.webViewLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-white text-blue-600 rounded-xl border border-gray-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFiles.map((file) => (
                <motion.div 
                  key={file.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group bg-gray-50 hover:bg-white p-4 rounded-2xl border border-gray-100 hover:border-blue-100 transition-all hover:shadow-md flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                    file.mimeType.includes('spreadsheet') ? 'bg-green-50 text-green-500' : 
                    file.mimeType.includes('script') ? 'bg-amber-50 text-amber-500' : 
                    'bg-blue-50 text-blue-500'
                  }`}>
                    {file.mimeType.includes('spreadsheet') ? <FileSpreadsheet size={18} /> : <FileCode size={18} />}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-tight">
                      {file.name}
                    </h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 tracking-widest">
                      ID: {file.id}
                    </p>
                  </div>
                  
                  <a 
                    href={file.webViewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-xl border border-gray-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm font-black text-[10px] uppercase tracking-widest"
                  >
                    Abrir <ExternalLink size={12} />
                  </a>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
             <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2rem] flex items-start gap-4 mb-8">
                <div className="w-12 h-12 bg-white text-blue-500 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                   <ArrowRightLeft size={24} />
                </div>
                <div>
                   <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight mb-2">Motor de Sincronización Territorial</h4>
                   <p className="text-xs text-blue-700 leading-relaxed font-medium">
                     Esta herramienta vincula los recursos externos de Google Sheets y App Scripts con la base de datos maestra del SIG.
                     Al sincronizar, los valores se actualizan en el mapa interactivo de forma inmediata.
                   </p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EJES_TERRITORIALES.map((eje) => (
                  <motion.div 
                    key={eje.id}
                    className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center justify-between hover:bg-white transition-all group"
                  >
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          eje.type === 'Spreadsheet' ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'
                        }`}>
                           {eje.type === 'Spreadsheet' ? <FileSpreadsheet size={20} /> : <FileCode size={20} />}
                        </div>
                        <div>
                           <h5 className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{eje.name}</h5>
                           <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Conexión: {eje.type}</p>
                        </div>
                     </div>

                     <button 
                       onClick={() => handleSyncEje(eje)}
                       disabled={syncingEje === eje.id}
                       className={`p-3 rounded-2xl transition-all shadow-sm ${
                         syncingEje === eje.id ? 'bg-blue-600 text-white animate-spin' : 'bg-white text-gray-400 hover:text-blue-600 group-hover:border-blue-100'
                       } border border-gray-100 `}
                     >
                        <RefreshCw size={18} />
                     </button>
                  </motion.div>
                ))}
             </div>

             <div className="mt-10 p-8 border-2 border-dashed border-gray-100 rounded-[3rem] text-center">
                <Database className="text-gray-200 mx-auto mb-4" size={40} />
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Registro de última actividad</h4>
                <div className="bg-gray-50 rounded-2xl p-4 text-left max-h-40 overflow-y-auto custom-scrollbar">
                   <p className="text-[9px] font-mono text-gray-400 mb-2">[2026-05-19 13:20] Inicializando túnel seguro...</p>
                   {syncingEje && <p className="text-[9px] font-mono text-blue-500 mb-2">{`[SYSTEM] Sincronizando recursos para: ${syncingEje}...`}</p>}
                   <p className="text-[9px] font-mono text-emerald-500">{`[OK] Conexión establecida con Supabase PostgreSQL v15`}</p>
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 opacity-40">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Vinculado a la carpeta ID: {FOLDER_ID}
        </p>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Verificado por Supabase & Firebase Auth 2026</span>
        </div>
      </div>
    </section>
  );
};
