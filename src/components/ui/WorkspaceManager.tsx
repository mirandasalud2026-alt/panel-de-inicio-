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
  AlertCircle
} from 'lucide-react';
import { googleSignIn, initAuth, logout } from '../../lib/firebaseAuth';
import { googleWorkspaceService, GoogleDriveFile } from '../../services/googleWorkspaceService';
import { motion, AnimatePresence } from 'motion/react';

const FOLDER_ID = '1loiQhrPqtwOZkE5sSjdHEEJkYtPqXgDR';

export const WorkspaceManager: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
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
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
              Recursos de Google Workspace
            </h3>
            <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-1">
              <ShieldCheck size={10} /> Conectado
            </span>
          </div>
          <p className="text-xs text-gray-400 font-medium mt-1">Explorando carpeta de datos y scripts de respaldo</p>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
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
          
          <button 
            onClick={handleLogout}
            className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest px-4"
          >
            Desconectar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} />
          <span>Error al conectar con Google: {error}</span>
        </div>
      )}

      <div className="relative min-h-[300px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Sincronizando...</span>
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
