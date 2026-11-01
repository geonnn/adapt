import type { Language } from '../types';

export interface TranslationSchema {
  navbar: {
    title: string;
    subtitle: string;
    examples: string;
    run: string;
    stop: string;
    copy: string;
    copied: string;
    import: string;
    export: string;
    language: string;
    theme: string;
    resetTooltip: string;
  };
  categories: {
    basics: string;
    concurrency: string;
    advanced: string;
  };
  difficulties: {
    basic: string;
    intermediate: string;
    advanced: string;
  };
  infoPanel: {
    title: string;
    concept: string;
    whatToObserve: string;
    collapse: string;
    expand: string;
    customCodeTitle: string;
    customCodeDesc: string;
  };
  statusBar: {
    line: string;
    col: string;
    lines: string;
    chars: string;
    simulationMode: string;
    untitled: string;
    encoding: string;
    indent: string;
  };
  console: {
    title: string;
    linesCount: string;
    clear: string;
    clearShortcut: string;
    autoScroll: string;
    tabs: {
      output: string;
      tasks: string;
      debugger: string;
    };
    banners: {
      compiling: string;
      compiledSuccess: string;
      compiledError: string;
      stopped: string;
      timeout: string;
      simulationNotice: string;
      customNotice: string;
    };
    emptyState: string;
  };
  modal: {
    unsavedTitle: string;
    unsavedMessage: string;
    cancel: string;
    discardAndLoad: string;
  };
  previews: {
    tasksTitle: string;
    tasksSubtitle: string;
    tasksDescription: string;
    tasksLegend: string;
    debuggerTitle: string;
    debuggerSubtitle: string;
    debuggerDescription: string;
  };
}

export const translations: Record<Language, TranslationSchema> = {
  es: {
    navbar: {
      title: 'AdaPT',
      subtitle: 'Ada Programming Tool',
      examples: 'Ejemplos',
      run: 'Ejecutar',
      stop: 'Detener',
      copy: 'Copiar',
      copied: '¡Copiado!',
      import: 'Importar',
      export: 'Exportar',
      language: 'Idioma',
      theme: 'Tema',
      resetTooltip: 'Restablecer al ejemplo inicial',
    },
    categories: {
      basics: 'Básicos',
      concurrency: 'Concurrencia',
      advanced: 'Avanzado',
    },
    difficulties: {
      basic: 'Básico',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
    },
    infoPanel: {
      title: 'Información del Ejemplo',
      concept: 'Concepto Ada',
      whatToObserve: 'Qué observar',
      collapse: 'Colapsar panel',
      expand: 'Expandir panel',
      customCodeTitle: 'Código Personalizado',
      customCodeDesc:
        'Estás editando código propio. Selecciona un ejemplo de la biblioteca para consultar su explicación teórica y notas pedagógicas.',
    },
    statusBar: {
      line: 'Lín',
      col: 'Col',
      lines: 'líneas',
      chars: 'caracteres',
      simulationMode: 'Modo Simulación',
      untitled: 'Personalizado',
      encoding: 'UTF-8',
      indent: 'Espacios: 3',
    },
    console: {
      title: 'Consola de Ejecución',
      linesCount: 'líneas',
      clear: 'Limpiar',
      clearShortcut: 'Limpiar consola (Ctrl+L)',
      autoScroll: 'Auto-desplazamiento',
      tabs: {
        output: 'Salida',
        tasks: 'Tareas (Fase 2)',
        debugger: 'Depurador (Fase 3)',
      },
      banners: {
        compiling: 'Compilando programa Ada...',
        compiledSuccess: '✓ Compilado con éxito',
        compiledError: '✗ Error de compilación',
        stopped: '⏹ Ejecución detenida por el usuario',
        timeout: '⏱ Tiempo de ejecución agotado tras 10s',
        simulationNotice: '[Modo Simulación] Ejecución de simulación concurrente',
        customNotice:
          '⚠ Salida de ejecución no disponible para código arbitrario en modo simulación.',
      },
      emptyState:
        'Haz clic en "Ejecutar" o presiona Ctrl+Enter para compilar y ejecutar el código.',
    },
    modal: {
      unsavedTitle: '¿Descartar cambios no guardados?',
      unsavedMessage:
        'Has modificado el código en el editor. Si cargas este ejemplo o archivo, perderás las modificaciones realizadas.',
      cancel: 'Cancelar',
      discardAndLoad: 'Descartar y cargar',
    },
    previews: {
      tasksTitle: 'Visualizador de Ciclo de Vida de Tareas',
      tasksSubtitle: 'Planificado para Fase 2',
      tasksDescription:
        'Esta pestaña mostrará los estados concurrentes de las tareas Ada (Created, Ready, Running, Blocked, Suspended, Terminated) y la línea temporal de sincronización en tiempo real.',
      tasksLegend: 'Estados de Tarea',
      debuggerTitle: 'Depurador Interactivo Ada',
      debuggerSubtitle: 'Planificado para Fase 3',
      debuggerDescription:
        'Próximamente: puntos de interrupción interactivos, ejecución paso a paso (step-into, step-over) e inspección de variables locales y tareas.',
    },
  },
  en: {
    navbar: {
      title: 'AdaPT',
      subtitle: 'Ada Programming Tool',
      examples: 'Examples',
      run: 'Run',
      stop: 'Stop',
      copy: 'Copy',
      copied: 'Copied!',
      import: 'Import',
      export: 'Export',
      language: 'Language',
      theme: 'Theme',
      resetTooltip: 'Reset to initial example',
    },
    categories: {
      basics: 'Basics',
      concurrency: 'Concurrency',
      advanced: 'Advanced',
    },
    difficulties: {
      basic: 'Basic',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    },
    infoPanel: {
      title: 'Example Information',
      concept: 'Ada Concept',
      whatToObserve: 'What to observe',
      collapse: 'Collapse panel',
      expand: 'Expand panel',
      customCodeTitle: 'Custom Code',
      customCodeDesc:
        'You are editing custom code. Select an example from the library to view its theoretical explanation and pedagogical notes.',
    },
    statusBar: {
      line: 'Ln',
      col: 'Col',
      lines: 'lines',
      chars: 'characters',
      simulationMode: 'Simulation Mode',
      untitled: 'Custom',
      encoding: 'UTF-8',
      indent: 'Spaces: 3',
    },
    console: {
      title: 'Execution Console',
      linesCount: 'lines',
      clear: 'Clear',
      clearShortcut: 'Clear console (Ctrl+L)',
      autoScroll: 'Auto-scroll',
      tabs: {
        output: 'Output',
        tasks: 'Tasks (Phase 2)',
        debugger: 'Debugger (Phase 3)',
      },
      banners: {
        compiling: 'Compiling Ada program...',
        compiledSuccess: '✓ Compiled successfully',
        compiledError: '✗ Compilation error',
        stopped: '⏹ Execution stopped by user',
        timeout: '⏱ Execution timed out after 10s',
        simulationNotice: '[Simulation Mode] Concurrent simulation execution',
        customNotice:
          '⚠ Execution output not available for custom code in simulation mode.',
      },
      emptyState: 'Click "Run" or press Ctrl+Enter to compile and run code.',
    },
    modal: {
      unsavedTitle: 'Discard unsaved changes?',
      unsavedMessage:
        'You have modified the code in the editor. Loading this example or file will discard your changes.',
      cancel: 'Cancel',
      discardAndLoad: 'Discard and load',
    },
    previews: {
      tasksTitle: 'Task Lifecycle Visualizer',
      tasksSubtitle: 'Planned for Phase 2',
      tasksDescription:
        'This tab will display concurrent Ada task states (Created, Ready, Running, Blocked, Suspended, Terminated) and the real-time synchronization timeline.',
      tasksLegend: 'Task States',
      debuggerTitle: 'Interactive Ada Debugger',
      debuggerSubtitle: 'Planned for Phase 3',
      debuggerDescription:
        'Coming soon: interactive breakpoints, step-by-step execution (step-into, step-over), and inspection of local variables and tasks.',
    },
  },
};

/**
 * Helper to resolve nested translation keys using dot notation (e.g. 'navbar.run')
 */
export function getTranslation(lang: Language, keyPath: string): string {
  const keys = keyPath.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = translations[lang];

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return keyPath; // fallback to key path if missing
    }
  }

  return typeof current === 'string' ? current : keyPath;
}
