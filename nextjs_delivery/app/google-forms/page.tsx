'use client';

import React from 'react';
import GoogleScriptFormsTabs from '../../components/GoogleScriptFormsTabs';
import { ArrowLeft, Landmark, ShieldCheck } from 'lucide-react';

export default function GoogleFormsAdminPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-12">
      {/* SECCIÓN BANNER INSTITUCIONAL DE CABECERA */}
      <div className="bg-[#0B3D5C] text-white p-6 md:p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-[#0B3D5C] text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              Miercoles y Jueves Sanitario 2026
            </span>
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-widest flex items-center gap-1">
              • PANEL MULTI-FORMULARIO EXTERNO
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight mt-2 flex items-center gap-3">
            <Landmark className="text-amber-400 w-7 h-7 shrink-0" />
            Integración Google Apps Script
          </h1>
          <p className="text-xs text-slate-300 font-medium max-w-2xl mt-1">
            Módulo auxiliar para carga directa sobre formularios vinculados a la Base de Hojas de Cálculo de Google. Renderizado seguro sin banners de advertencia de abuso.
          </p>
        </div>

        {/* Botón Volver */}
        <div className="flex items-center w-full xl:w-auto">
          <a
            href="/"
            className="w-full sm:w-auto px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Volver al Dashboard Central</span>
          </a>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-sm font-black text-[#0B3D5C] uppercase tracking-wide">
            Panel de Formulación Remota Google
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Seleccione la categoría médica correspondiente para cargar expedientes nominales directamente sobre las bases unificadas.
          </p>
        </div>

        <GoogleScriptFormsTabs iframeHeight="850px" />
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="max-w-7xl mx-auto px-6 md:px-8 mt-12 text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
        <div className="flex items-center justify-center gap-1.5 mb-1 text-[#0B3D5C]">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Sincronización Totalmente Cifrada SSL</span>
        </div>
        <div>Gobierno Bolivariano de Miranda • Salud Municipal 2026</div>
      </footer>
    </div>
  );
}
