import React from 'react';
import { Activity, Clock, Layers, Sparkles } from 'lucide-react';
import type { TaskEvent, TaskLifecycleState } from '../../types';
import type { TranslationSchema } from '../../i18n/translations';

export interface TaskPanelProps {
  taskEvents: TaskEvent[];
  translations: TranslationSchema;
}

const LIFECYCLE_STATES: { state: TaskLifecycleState; label: string; color: string }[] = [
  { state: 'created', label: 'Created', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  { state: 'ready', label: 'Ready', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  { state: 'running', label: 'Running', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { state: 'blocked', label: 'Blocked', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { state: 'suspended', label: 'Suspended', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { state: 'terminated', label: 'Terminated', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
];

export const TaskPanel: React.FC<TaskPanelProps> = ({
  taskEvents,
  translations: t,
}) => {
  const getStateBadge = (state: TaskLifecycleState) => {
    const item = LIFECYCLE_STATES.find((s) => s.state === state);
    const colorClasses = item ? item.color : 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    return (
      <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold uppercase rounded border ${colorClasses}`}>
        {state}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-console-bg text-txt-primary overflow-y-auto p-4 space-y-4">
      {/* Educational Roadmap Card */}
      <div className="p-4 rounded-xl border border-border-theme bg-panel space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-txt-primary">
              {t.previews.tasksTitle}
            </h3>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20">
            {t.previews.tasksSubtitle}
          </span>
        </div>
        <p className="text-xs text-txt-secondary leading-relaxed">
          {t.previews.tasksDescription}
        </p>

        {/* Lifecycle States Diagram / Legend */}
        <div className="pt-2 border-t border-border-theme">
          <div className="text-[11px] font-semibold text-txt-muted uppercase tracking-wider mb-2">
            {t.previews.tasksLegend}
          </div>
          <div className="flex flex-wrap gap-2">
            {LIFECYCLE_STATES.map((s) => (
              <span
                key={s.state}
                className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded border ${s.color}`}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Telemetry Stream Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-txt-muted px-1">
          <div className="flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-sky-500" />
            <span>Telemetría de Concurrencia Ada</span>
          </div>
          <span className="font-mono text-[11px]">
            {taskEvents.length} {taskEvents.length === 1 ? 'evento' : 'eventos'}
          </span>
        </div>

        {taskEvents.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border-theme bg-panel/50 text-center space-y-2">
            <Sparkles className="w-6 h-6 text-txt-muted mx-auto opacity-40" />
            <p className="text-xs text-txt-secondary leading-relaxed max-w-sm mx-auto">
              Ejecuta un ejemplo concurrente (como <em>task_simple</em>, <em>rendezvous</em> o <em>filosofos</em>) para ver los eventos de telemetría emitidos por el runtime.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border-theme bg-panel overflow-hidden">
            <div className="divide-y divide-border-theme font-mono text-xs">
              {taskEvents.map((ev, index) => (
                <div
                  key={`${ev.taskId}-${ev.timestamp}-${index}`}
                  className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-panel-subtle transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center gap-1 text-[11px] text-zinc-500 select-none flex-shrink-0 w-16">
                      <Clock className="w-3 h-3 opacity-60" />
                      <span>+{ev.timestamp}ms</span>
                    </div>
                    <span className="font-semibold text-txt-primary truncate">
                      {ev.taskName}
                    </span>
                    {ev.detail && (
                      <span className="text-txt-muted truncate hidden sm:inline">
                        — {ev.detail}
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {getStateBadge(ev.event)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskPanel;
