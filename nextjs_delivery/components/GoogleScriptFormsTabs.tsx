'use client';

import React, { useState } from 'react';
import NominalIframeWidget, { FormType } from './NominalIframeWidget';
import { Activity, Baby, Skull, Settings, HelpCircle } from 'lucide-react';

interface GoogleScriptFormsTabsProps {
  defaultTab?: FormType;
  iframeHeight?: string;
}

export default function GoogleScriptFormsTabs({
  defaultTab = 'quirurgica',
  iframeHeight = '800px',
}: GoogleScriptFormsTabsProps) {
  const [activeTab, setActiveTab] = useState<FormType>(defaultTab);

  const tabs: { id: FormType; label: string; icon: React.ReactNode; color: string; hoverBg: string; activeRing: string }[] = [
    {
      id: 'quirurgica',
      label: 'Quirúrgica',
      icon: <Activity size={14} />,
      color: 'text-indigo-600',
      hoverBg: 'hover:bg-indigo-50/50',
      activeRing: 'ring-indigo-600/10 bg-indigo-50/50 text-[#0B3D5C] border-indigo-200'
    },
    {
      id: 'obstetrica',
      label: 'Obstétrica',
      icon: <Baby size={14} />,
      color: 'text-pink-500',
      hoverBg: 'hover:bg-pink-50/50',
      activeRing: 'ring-pink-600/10 bg-pink-50/50 text-pink-700 border-pink-200'
    },
    {
      id: 'defuncion',
      label: 'Defunción',
      icon: <Skull size={14} />,
      color: 'text-rose-500',
      hoverBg: 'hover:bg-rose-50/50',
      activeRing: 'ring-rose-600/10 bg-rose-50/50 text-rose-700 border-rose-200'
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Botonera de Pestañas con Diseño Modular */}
      <div className="bg-white rounded-3xl p-2.5 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-2xl text-[10.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border border-transparent ${
                  isActive
                    ? `${tab.activeRing} font-black shadow-inner`
                    : `text-slate-500 bg-transparent ${tab.hoverBg} hover:text-slate-800`
                }`}
              >
                <span className={isActive ? '' : tab.color}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Leyenda Técnica Corta */}
        <div className="hidden lg:flex items-center gap-2 text-[9px] text-[#0B3D5C] font-semibold bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl uppercase tracking-widest leading-relaxed">
          <Settings size={11} className="text-slate-400 shrink-0" />
          <span>Sincronización Transaccional en Caliente (Google / Supabase)</span>
        </div>
      </div>

      {/* Widget Interactivo Seleccionado */}
      <div className="w-full">
        <NominalIframeWidget
          key={`iframe-tab-${activeTab}`}
          formType={activeTab}
          height={iframeHeight}
        />
      </div>

      {/* Panel Informativo de Buenas Prácticas */}
      <div className="bg-blue-50/40 border border-blue-105 rounded-2xl p-5 text-blue-900 flex gap-3 text-xs leading-relaxed uppercase font-bold tracking-wide">
        <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[10px] text-blue-950">Indicaciones administrativas del portal:</p>
          <ul className="text-[9px] text-blue-800 font-medium list-disc pl-4 space-y-1">
            <li>Cada carga realizada persistirá directamente sobre las hojas de cálculo de su Google Drive Institucional.</li>
            <li>Si el iframe no termina de cargar por restricciones de cookies de terceros en su navegador, use el botón "Pantalla Completa" para llenarlo en otra ventana de forma segura.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
