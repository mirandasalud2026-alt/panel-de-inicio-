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
      </div>

      <div className="py-20 flex flex-col items-center justify-center text-center">
         <Database className="text-gray-100 mb-4" size={48} />
         <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Los datos se cargarán al seleccionar una opción</p>
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
