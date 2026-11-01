import React from 'react';
import { Bug, Play, StepForward, ArrowDown, Shield, Database, ListFilter } from 'lucide-react';
import type { TranslationSchema } from '../../i18n/translations';

export interface DebugPanelProps {
  translations: TranslationSchema;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ translations: t }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-console-bg text-txt-primary overflow-y-auto p-4 space-y-4">
      {/* Educational Roadmap Card */}
      <div className="p-4 rounded-xl border border-border-theme bg-panel space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <Bug className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-txt-primary">
              {t.previews.debuggerTitle}
            </h3>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
            {t.previews.debuggerSubtitle}
          </span>
        </div>
        <p className="text-xs text-txt-secondary leading-relaxed">
          {t.previews.debuggerDescription}
        </p>
      </div>

      {/* Interactive Controls Mockup */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-txt-muted uppercase tracking-wider px-1">
          Barra de Controles de Depuración (Próximamente)
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border-theme bg-panel opacity-60 pointer-events-none">
          <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-panel-subtle border border-border-theme text-txt-primary">
            <Play className="w-3.5 h-3.5 text-emerald-500" />
            <span>Continuar (F5)</span>
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-panel-subtle border border-border-theme text-txt-primary">
            <StepForward className="w-3.5 h-3.5 text-sky-500" />
            <span>Step Over (F10)</span>
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-panel-subtle border border-border-theme text-txt-primary">
            <ArrowDown className="w-3.5 h-3.5 text-amber-500" />
            <span>Step Into (F11)</span>
          </button>
        </div>
      </div>

      {/* Planned Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border border-border-theme bg-panel space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-txt-primary">
            <Shield className="w-3.5 h-3.5 text-sky-500" />
            <span>Puntos de Interrupción Concurrente</span>
          </div>
          <p className="text-xs text-txt-secondary leading-relaxed">
            Pausa la ejecución en sentencias <code className="font-mono text-txt-primary">entry</code>, <code className="font-mono text-txt-primary">accept</code> y objetos protegidos para inspeccionar el estado antes del rendez-vous.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-border-theme bg-panel space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-txt-primary">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span>Inspector de Variables y Tipos Ada</span>
          </div>
          <p className="text-xs text-txt-secondary leading-relaxed">
            Visualización en vivo de variables escalares, arreglos, registros y variables privadas de objetos protegidos.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-border-theme bg-panel space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-txt-primary">
            <ListFilter className="w-3.5 h-3.5 text-purple-500" />
            <span>Monitor de Colas de Tareas</span>
          </div>
          <p className="text-xs text-txt-secondary leading-relaxed">
            Inspección de tareas encoladas en cada entrada (<code className="font-mono text-txt-primary">'Count</code>) y detección de condiciones de inanición o bloqueo mutuo.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-border-theme bg-panel space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-txt-primary">
            <Bug className="w-3.5 h-3.5 text-amber-500" />
            <span>Pila de Llamadas y Árbol de Tareas</span>
          </div>
          <p className="text-xs text-txt-secondary leading-relaxed">
            Navegación por los marcos de llamada de la tarea activa y árbol de jerarquía de tareas secundarias.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
