# AdaPT — Ada Programming Tool

**AdaPT** (*Ada Programming Tool*) es un entorno de desarrollo educativo interactivo (IDE) basado en la web para el aprendizaje de la programación concurrente en **Ada** (Ada 2012 / Ada 2022). Se ejecuta íntegramente en el navegador del cliente sin requerir ningún servidor backend, contenedores remotos ni dependencias externas.

---

## Tabla de Contenidos
- [Características Principales](#características-principales)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Diseño del Runtime de Simulación (Plan B) vs Evaluación WebAssembly (Plan A)](#diseño-del-runtime-de-simulación-plan-b-vs-evaluación-webassembly-plan-a)
- [Biblioteca de Ejemplos Concurrentes](#biblioteca-de-ejemplos-concurrentes)
- [Instalación y Uso](#instalación-y-uso)
- [Atajos de Teclado y UX](#atajos-de-teclado-y-ux)
- [Guía: Cómo Agregar Nuevos Ejemplos Concurrentes](#guía-cómo-agregar-nuevos-ejemplos-concurrentes)
- [Hoja de Ruta (Fases Futuras)](#hoja-de-ruta-fases-futuras)
- [Licencia](#licencia)

---

## Características Principales

- **Editor Monaco con soporte Ada 2012 / 2022**:
  - Tokenizador Monarch personalizado para palabras clave de concurrencia (`task`, `protected`, `entry`, `accept`, `select`, `delay`), tipos estándar, atributos (`'Image`, `'Count`, `'Terminated`), comentarios (`--`) y literales numéricos o basados.
  - Emparejamiento de delimitadores (`begin/end`, `task/end`, `(/)`) e indentación automática por palabras clave.
  - Linter del lado del cliente en TypeScript que valida la sintaxis sin expresiones regulares multilínea frágiles, detectando desbalance de `begin/end`, punto y coma faltantes, comillas no cerradas y tareas declaradas sin cuerpo correspondiente, renderizando marcadores de error interactivos.
- **Runtime de Simulación Concurrente (Plan B)**:
  - Salida asíncrona secuencial en streaming con pausas naturales (100–300 ms).
  - Botón de parada inmediata (*Stop*) soportado por `AbortController`.
  - Temporizador de seguridad automático con *timeout* de 10 segundos.
  - Comparador inteligente que normaliza código (ignorando comentarios, espacios en blanco y mayúsculas/minúsculas).
  - Intérprete de sentencias secuenciales `Put_Line`, constantes, bucles `for` y atributos `'Image`.
  - Emisión de telemetría estructurada `TaskEvent` (`created`, `ready`, `running`, `blocked`, `suspended`, `terminated`).
- **Interfaz Interactiva de Grado Profesional**:
  - Panel superior (*Navbar*) con selector categorizado de ejemplos, botones Ejecutar/Detener, Copiar código, Importar/Exportar archivos `.adb`, selector de idioma y conmutador de tema.
  - Panel lateral izquierdo colapsable con explicación pedagógica del concepto Ada, viñetas de qué observar y etiquetas de dificultad.
  - Divisor redimensionable (*ResizableSplit*) con captura de puntero, cálculo acotado al rango `[20%, 80%]` y redibujado de Monaco sincronizado vía `ResizeObserver`.
  - Barra de estado (*StatusBar*) con posición del cursor (Lín/Col), conteo de líneas y caracteres, badge de modo de simulación y codificación.
  - Consola de ejecución monospace con marcas temporales `[HH:MM:SS]`, líneas coloreadas según el flujo (`stdout`, `stderr`, `warning`, `system`, banners de éxito/error), auto-scroll inteligente y atajo `Ctrl+L`.
  - Diálogo modal accesible ante cambios no guardados al cambiar de ejemplo o importar archivos.
  - Internacionalización integrada (Español e Inglés) con cobertura total y persistencia en `localStorage`.

---

## Arquitectura del Sistema

AdaPT está construido con **React 19**, **TypeScript** en modo estricto y **Tailwind CSS**, estructurado en cuatro capas desacopladas:

```
src/
├── types/              # Contratos de interfaz, tipos compartidos y eventos de telemetría
├── i18n/               # Diccionario bilingüe (ES / EN) sin dependencias externas
├── hooks/              # Hooks reactivos (useTheme, useLanguage, useLocalStorage)
├── runtime/            # Capa de lenguaje y runtime de ejecución
│   ├── adaLanguage.ts  # Tokenizador Monarch, pares de llaves y configuración de lenguaje
│   ├── linter.ts       # Validador sintáctico estático y sincronizador de marcadores Monaco
│   ├── compiler.ts     # Servicio desacoplado CompilerService, motor de streaming e intérprete
│   └── wasm.ts         # Módulo stub desacoplado para futura integración WebAssembly
├── examples/           # Colección de 10 ejemplos con metadatos, código, salidas y eventos
└── components/         # Componentes de presentación UI
    ├── Navbar/         # Barra superior de navegación y controles
    ├── InfoPanel/      # Panel lateral de notas teóricas y observación
    ├── ResizableSplit/ # Divisor de columnas redimensionable con persistencia
    ├── Editor/         # Contenedor de Monaco Editor y StatusBar
    ├── Console/        # Consola con pestañas de Salida, Tareas y Depurador
    ├── TaskPanel/      # Visualizador de estados de tareas (Fase 2)
    ├── DebugPanel/     # Visualizador de depuración interactiva (Fase 3)
    └── Modal/          # Diálogo accesible para descartar cambios no guardados
```

---

## Diseño del Runtime de Simulación (Plan B) vs Evaluación WebAssembly (Plan A)

### Justificación de Plan B

Durante la fase de diseño inicial de AdaPT se evaluaron dos alternativas para ejecutar Ada en el cliente:

1. **Plan A (Compilador GNAT / GCC compilado a WebAssembly)**:
   - **Limitaciones de Peso**: Un toolchain completo de GCC/GNAT cruzado a WebAssembly requiere entre 50 MB y 150 MB de binarios Wasm y tablas de runtime (GNAT RTS). Esto penaliza severamente el tiempo de carga inicial en entornos web educativos y móviles.
   - **Limitaciones de Hilos Web**: El modelo de concurrencia de Ada (basado en el tasking de POSIX / GNAT) requiere soporte multihilo real con `SharedArrayBuffer` y cabeceras HTTP de aislamiento de origen cruzado (`Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Embedder-Policy: require-corp`), lo que impide hospedar la herramienta en plataformas estáticas estándar como GitHub Pages o servidores sin configuración personalizada de headers.
   - **Latencia de Compilación**: Invocar un compilador completo en Wasm dentro del hilo principal introduce pausas notables en cada ejecución.

2. **Plan B (Runtime Simulado en TypeScript — Implementado en AdaPT)**:
   - **Cero Dependencias y Peso Mínimo**: El bundle completo de producción ocupa menos de 400 KB gzippeados, cargándose al instante incluso en conexiones lentas.
   - **Ejecución Determinista y Educativa**: Permite reproducir escenarios concurrentes complejos (condiciones de carrera, exclusión mutua en objetos protegidos, sincronización en barrera, interbloqueo en filósofos y temporizaciones de entrada) de manera predecible y didáctica.
   - **Generación de Telemetría Rica**: El simulador emite directamente objetos `TaskEvent` tipados con marcas de tiempo y transiciones de estado, permitiendo alimentar interfaces gráficas de ciclo de vida sin necesidad de instrumentar binarios nativos.
   - **Arquitectura Desacoplada**: A través de la interfaz abstracta `CompilerService` (`compile(code)` y `run(code, options)`), el runtime de simulación puede reemplazarse o complementarse con un backend nativo Wasm en el futuro (`src/runtime/wasm.ts`) sin alterar ningún componente de la interfaz de usuario.

---

## Biblioteca de Ejemplos Concurrentes

AdaPT incluye 10 ejemplos didácticos completos con comentarios bilingües, salidas realistas y secuencias de eventos de tareas:

| # | Identificador | Categoría | Dificultad | Concepto Demostrado |
|---|---------------|-----------|------------|---------------------|
| 1 | `hello_world` | Básicos | Básico | Estructura básica de un procedimiento Ada y uso de `Ada.Text_IO.Put_Line`. |
| 2 | `tipos_basicos` | Básicos | Básico | Tipado estático fuerte, subtipos con rango, booleanos y atributo `'Image`. |
| 3 | `task_simple` | Concurrencia | Básico | Declaración y cuerpo de tareas independientes ejecutándose en paralelo. |
| 4 | `rendezvous` | Concurrencia | Intermedio | Sincronización bilateral cliente-servidor mediante sentencias `entry` y `accept`. |
| 5 | `protected_object` | Concurrencia | Intermedio | Exclusión mutua pasiva sin hilos activos mediante objetos protegidos y barreras `when`. |
| 6 | `semaforo` | Concurrencia | Intermedio | Implementación de un semáforo de conteo mediante objeto protegido y barrera booleana. |
| 7 | `productor_consumidor` | Concurrencia | Intermedio | Buffer circular protegido con sincronización entre tareas productoras y consumidoras. |
| 8 | `filosofos` | Concurrencia | Intermedio | Clásico problema de sincronización con 5 filósofos y prevención de inanición. |
| 9 | `select_statement` | Avanzado | Avanzado | Aceptación selectiva no bloqueante con cláusulas alternativas y guardia condicional. |
| 10 | `timed_entry` | Avanzado | Avanzado | Llamadas a entradas temporizadas mediante `select ... or delay` para prevenir esperas indefinidas. |

---

## Instalación y Uso

### Prerrequisitos
- **Node.js** v18 o superior (probado y verificado en Node.js `v24.21.0`).
- **npm** v9 o superior (probado en npm `11.19.0`).

### Pasos de Instalación

1. Clonar el repositorio o ingresar al directorio del proyecto:
   ```bash
   cd ada-editor
   ```

2. Instalar las dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador web.

4. Verificar tipos y construir para producción:
   ```bash
   # Comprobación estricta de tipos TypeScript
   npx tsc --noEmit

   # Compilación y empaquetado optimizado con Vite
   npm run build
   ```

---

## Atajos de Teclado y UX

| Atajo | Contexto | Acción |
|---|---|---|
| `Ctrl+Enter` / `Cmd+Enter` | Global / Editor | Compila y ejecuta el código activo (o detiene la ejecución si ya está en curso). |
| `Ctrl+L` / `Cmd+L` | Global / Consola | Limpia todas las entradas de la consola de ejecución. |
| `Escape` | Diálogo Modal | Cancela la acción pendiente y cierra el modal sin alterar el editor. |
| Doble clic en divisor | Divisor de paneles | Restablece instantáneamente el tamaño del editor y consola a la proporción por defecto (60% / 40%). |
| `Flecha Izquierda / Derecha` | Divisor enfocado | Ajusta la anchura de las columnas en pasos del 2% con soporte de accesibilidad por teclado. |

---

## Guía: Cómo Agregar Nuevos Ejemplos Concurrentes

Para incorporar un nuevo ejemplo a la biblioteca de AdaPT:

### 1. Crear el archivo del ejemplo en `src/examples/`
Crea un nuevo archivo TypeScript (por ejemplo `src/examples/mi_ejemplo.ts`) implementando la interfaz `Example`:

```typescript
import type { Example } from '../types';

export const miEjemplo: Example = {
  id: 'mi_ejemplo',
  category: 'concurrency', // 'basics' | 'concurrency' | 'advanced'
  difficulty: 'intermediate', // 'basic' | 'intermediate' | 'advanced'
  title: {
    es: 'Barrera de Sincronización',
    en: 'Synchronization Barrier',
  },
  description: {
    es: 'Demuestra la sincronización de múltiples tareas concurrentes mediante un objeto protegido que retiene las tareas hasta alcanzar un conteo umbral.',
    en: 'Demonstrates synchronization of multiple concurrent tasks through a protected object holding tasks until a threshold count is reached.',
  },
  whatToObserve: {
    es: [
      'Observa cómo las tareas trabajadoras se bloquean en la entrada Esperar_Barrera.',
      'Nota que la barrera libera a todas las tareas de manera simultánea al llegar la última.',
    ],
    en: [
      'Observe how worker tasks block on the Esperar_Barrera entry.',
      'Notice that the barrier releases all tasks simultaneously when the last one arrives.',
    ],
  },
  code: `-- ============================================================================
-- Barrera de Sincronización Concurrente en Ada
-- ============================================================================
with Ada.Text_IO; use Ada.Text_IO;

procedure Barrera_Ejemplo is
   -- Declaración del objeto protegido y tareas
begin
   Put_Line ("[Principal] Iniciando demostración de barrera...");
   -- Lógica concurrente
end Barrera_Ejemplo;`,
  expectedOutput: `[Principal] Iniciando demostración de barrera...
[Trabajador 1] Esperando en la barrera...
[Trabajador 2] Esperando en la barrera...
[Barrera] Umbral alcanzado. Liberando tareas.
[Trabajador 1] Continuando ejecución posterior.
[Trabajador 2] Continuando ejecución posterior.
[Principal] Ejecución finalizada con éxito.`,
  taskEvents: [
    { timestamp: 0, taskId: 'main', taskName: 'Principal', event: 'running', detail: 'Inicio' },
    { timestamp: 120, taskId: 'w1', taskName: 'Trabajador 1', event: 'ready' },
    { timestamp: 200, taskId: 'w1', taskName: 'Trabajador 1', event: 'blocked', detail: 'En barrera' },
    { timestamp: 350, taskId: 'w2', taskName: 'Trabajador 2', event: 'running' },
    { timestamp: 400, taskId: 'w2', taskName: 'Trabajador 2', event: 'blocked', detail: 'En barrera' },
    { timestamp: 500, taskId: 'w1', taskName: 'Trabajador 1', event: 'running', detail: 'Liberado' },
    { timestamp: 550, taskId: 'w2', taskName: 'Trabajador 2', event: 'running', detail: 'Liberado' },
    { timestamp: 650, taskId: 'w1', taskName: 'Trabajador 1', event: 'terminated' },
    { timestamp: 680, taskId: 'w2', taskName: 'Trabajador 2', event: 'terminated' },
    { timestamp: 720, taskId: 'main', taskName: 'Principal', event: 'terminated' },
  ],
};
```

### 2. Registrar el ejemplo en `src/examples/index.ts`
Agrega el nuevo archivo a los imports y a la lista `examples`:

```typescript
import { miEjemplo } from './mi_ejemplo';

export const examples: Example[] = [
  helloWorldExample,
  // ...
  miEjemplo,
];
```

Al reiniciar el servidor o recargar la página, el ejemplo aparecerá automáticamente clasificado en el menú desplegable del Navbar, con sus notas didácticas en el panel informativo y telemetría sincronizada.

---

## Hoja de Ruta (Fases Futuras)

- **Fase 2 — Visualizador de Ciclo de Vida de Tareas**:
  - Diagrama de Gantt interactivo en tiempo real con línea temporal de sincronización.
  - Visualización gráfica de estados de rendez-vous y llamadas `entry`/`accept`.
  - Monitor de contadores de colas de entrada (`'Count`).
- **Fase 3 — Depurador Interactivo Visual**:
  - Puntos de interrupción (*breakpoints*) configurables en sentencias concurrentes.
  - Ejecución paso a paso (*Step Into*, *Step Over*, *Continue*).
  - Inspección del estado interno de objetos protegidos y variables locales.
- **Fase 4 — Backend WebAssembly Opcional**:
  - Conexión opcional a compilador GNAT/Wasm cuando el entorno soporte `SharedArrayBuffer` y cabeceras COOP/COEP.

---

## Licencia

Distribuido bajo la Licencia MIT. Consulta `LICENSE` para más información.
