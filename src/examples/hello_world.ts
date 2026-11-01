import type { Example } from '../types';

export const helloWorldExample: Example = {
  id: 'hello_world',
  category: 'basics',
  difficulty: 'basic',
  title: {
    es: 'Hola Mundo',
    en: 'Hello World',
  },
  description: {
    es: 'Estructura canónica de un programa ejecutable en Ada utilizando el paquete estándar Ada.Text_IO para salida por terminal.',
    en: 'Canonical structure of an executable Ada program using the standard Ada.Text_IO package for terminal output.',
  },
  whatToObserve: {
    es: [
      "La cláusula 'with Ada.Text_IO;' importa el paquete estándar de entrada/salida.",
      "'use Ada.Text_IO;' permite llamar a Put_Line directamente sin prefijo.",
      "Todo programa principal en Ada se estructura como un procedimiento ('procedure').",
    ],
    en: [
      "The 'with Ada.Text_IO;' clause imports the standard I/O package.",
      "'use Ada.Text_IO;' allows calling Put_Line directly without namespace prefix.",
      "Every executable Ada main program is structured as a 'procedure'.",
    ],
  },
  code: `-- ============================================
-- EJEMPLO: Hola Mundo en Ada
-- ============================================
-- Primer programa en Ada. Muestra la estructura
-- básica de un procedimiento principal y el uso
-- del paquete estándar Ada.Text_IO para imprimir
-- en la consola.
--
-- Qué observar:
--   * La cláusula "with Ada.Text_IO;" importa el paquete de E/S
--   * "use Ada.Text_IO;" permite invocar Put_Line directamente
--   * Todo programa Ada ejecutable comienza con un "procedure"
-- ============================================

with Ada.Text_IO; use Ada.Text_IO;

procedure Hello_World is
begin
   Put_Line ("¡Hola, AdaPT!");
   Put_Line ("Bienvenido al entorno educativo de Ada Concurrente.");
end Hello_World;`,
  expectedOutput: `¡Hola, AdaPT!
Bienvenido al entorno educativo de Ada Concurrente.`,
  taskEvents: [
    { timestamp: 0, taskId: 'task_main', taskName: 'Main', event: 'created', detail: 'Procedure Hello_World initialized' },
    { timestamp: 50, taskId: 'task_main', taskName: 'Main', event: 'running', detail: 'Executing Put_Line statements' },
    { timestamp: 200, taskId: 'task_main', taskName: 'Main', event: 'terminated', detail: 'Procedure Hello_World completed' },
  ],
};

export default helloWorldExample;
