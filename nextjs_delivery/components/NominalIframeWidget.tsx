'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, Layers, ShieldCheck, AlertCircle } from 'lucide-react';

export type FormType = 'quirurgica' | 'obstetrica' | 'defuncion';

interface NominalIframeWidgetProps {
  formType: FormType;
  height?: string; // Default to '800px'
  title?: string;
  key?: string;
}

export default function NominalIframeWidget({
  formType,
  height = '800px',
  title,
}: NominalIframeWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState('');

  // Generar la URL basada en variable de entorno con fallback robusto
  useEffect(() => {
    // Al utilizar Next.js, process.env.NEXT_PUBLIC_... se reemplaza tanto del lado del servidor como del cliente.
    const baseUrl =
      process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL ||
      'https://script.google.com/macros/s/AKfycbzRrIfzDiE0EcP0HZhxIr2VA5FfX0tl_5HpxyAcCZ4O1z1Tl90gSTyJ6gN3nD8NJON3/exec';

    const hasQuery = baseUrl.includes('?');
    const separator = hasQuery ? '&' : '?';
    const finalUrl = `${baseUrl}${separator}form=${formType}`;
    
    setIframeUrl(finalUrl);
    setLoading(true);
  }, [formType]);

  // Nombres descriptivos para la UI
  const getFriendlyName = (type: FormType) => {
    switch (type) {
      case 'quirurgica':
        return 'Ficha Nominal Quirúrgica';
      case 'obstetrica':
        return 'Nómina Obstétrica';
      case 'defuncion':
        return 'Nómina de Defunción (Necropsias)';
      default:
        return 'Formulario Médico';
    }
  };

  const currentTitle = title || getFriendlyName(formType);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col w-full">
      {/* Cabecera del Widget */}
      <div className="bg-[#0B3D5C] text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
            <Layers size={16} />
          </div>
          <div>
            <span className="text-[8px] font-black uppercase text-amber-300 tracking-widest block">
              Formularios en Vivo de Google Apps Script
            </span>
            <h4 className="text-xs font-black uppercase tracking-wide mt-0.5">
              {currentTitle}
            </h4>
          </div>
        </div>

        {/* Acciones del Widget */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {loading && (
            <span className="text-[9px] font-bold text-slate-350 animate-pulse bg-white/10 px-2 py-1 rounded-md flex items-center gap-1.5 shrink-0">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
              Sincronizando formulario...
            </span>
          )}
          
          <a
            href={iframeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9.5px] font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
            title="Abrir formulario en pestaña dedicada"
          >
            <ExternalLink size={12} />
            <span>Pantalla Completa</span>
          </a>
        </div>
      </div>

      {/* Cuerpo con iFrame y Carga Fluida */}
      <div className="relative w-full bg-slate-50" style={{ height }}>
        {/* Skeleton Shimmer de Carga */}
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/95 p-6 text-center animate-pulse">
            <div className="relative mb-5">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-[#0B3D5C]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="text-[#0B3D5C]/15" size={16} />
              </div>
            </div>
            <h5 className="text-[11px] font-black text-[#0B3D5C] uppercase tracking-widest mb-1.5">
              Cargando Formulario Seguro
            </h5>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-sm leading-relaxed">
              Estableciendo túnel cifrado con el microservicio de Google y Supabase...
            </p>
            <div className="mt-6 flex flex-col items-center gap-1 bg-amber-50 rounded-xl p-3 border border-amber-250 border-dashed text-[9.5px] text-amber-800 font-bold uppercase tracking-wide">
              <span>Evitando banner de "Denunciar abuso" clásico usando renderizado directo</span>
              <button 
                onClick={() => setLoading(false)}
                className="mt-2 text-[8.5px] text-[#0B3D5C] hover:underline"
              >
                ¿Demasiado lento? Forzar visualización de iframe
              </button>
            </div>
          </div>
        )}

        {/* El iFrame definitivo */}
        {iframeUrl && (
          <iframe
            id={`iframe-${formType}`}
            src={iframeUrl}
            className="w-full h-full border-none"
            sandbox="allow-same-origin allow-scripts allow-forms"
            onLoad={() => setLoading(false)}
          />
        )}
      </div>

      {/* Pie de Página del Widget */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
        <span className="flex items-center gap-1">
          <ShieldCheck size={12} className="text-emerald-500" />
          Conexión Encriptada
        </span>
        <span className="text-right">
          Miranda Salud v14+
        </span>
      </div>
    </div>
  );
}
