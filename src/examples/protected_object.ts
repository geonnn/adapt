import type { Example } from '../types';

export const protectedObjectExample: Example = {
  id: 'protected_object',
  category: 'concurrency',
  difficulty: 'intermediate',
  title: {
    es: 'Objeto Protegido',
    en: 'Protected Object',
  },
  description: {
    es: 'Encapsulación de datos compartidos con exclusión mutua garantizada automáticamente por el runtime de Ada (monitores).',
    en: 'Shared data encapsulation with automatic mutual exclusion guaranteed by the Ada runtime (monitors).',
  },
  whatToObserve: {
    es: [
      "Las funciones ('function') permiten acceso concurrente de solo lectura.",
      "Los procedimientos ('procedure') garantizan acceso exclusivo de escritura bloqueando a otros accesos.",
      'No requiere primitivas de bajo nivel como mutex manuales.',
    ],
    en: [
      "Protected 'function' members allow concurrent read-only access.",
      "Protected 'procedure' members guarantee exclusive read-write access.",
      'Eliminates low-level manual mutex manipulation.',
    ],
  },
  code: `-- ============================================
-- EJEMPLO: Objeto Protegido (Protected Object)
-- ============================================
-- Los objetos protegidos proporcionan encapsulación
-- con exclusión mutua garantizada por el runtime:
--   * 'function': acceso concurrente de solo lectura.
--   * 'procedure': acceso exclusivo de modificación.
--   * 'entry': acceso protegido condicionado por una barrera booleana.
--
-- Qué observar:
--   * 'protected Contador_Seguro is ...'
--   * Múltiples tareas incrementan sin condiciones de carrera
--   * No requiere semáforos manuales; la exclusión es automática
-- ============================================

with Ada.Text_IO; use Ada.Text_IO;

procedure Protected_Object_Demo is
   protected Contador_Seguro is
      procedure Incrementar (Por : in Integer);
      function Leer return Integer;
   private
      Valor : Integer := 0;
   end Contador_Seguro;

   protected body Contador_Seguro is
      procedure Incrementar (Por : in Integer) is
      begin
         Valor := Valor + Por;
      end Incrementar;

      function Leer return Integer is
      begin
         return Valor;
      end Leer;
   end Contador_Seguro;

   task type Trabajador (Id : Integer; Incremento : Integer);

   task body Trabajador is
   begin
      for I in 1 .. 3 loop
         Contador_Seguro.Incrementar (Incremento);
         delay 0.05;
      end loop;
      Put_Line ("[Trabajador" & Integer'Image (Id) & "] Finalizó sus incrementos.");
   end Trabajador;

   W1 : Trabajador (1, 10);
   W2 : Trabajador (2, 5);

begin
   delay 0.4;
   Put_Line ("[Main] Valor final seguro en Contador: " &
             Integer'Image (Contador_Seguro.Leer));
end Protected_Object_Demo;`,
  expectedOutput: `[Trabajador 2] Finalizó sus incrementos.
[Trabajador 1] Finalizó sus incrementos.
[Main] Valor final seguro en Contador:  45`,
  taskEvents: [
    { timestamp: 0, taskId: 'task_main', taskName: 'Main', event: 'created' },
    { timestamp: 10, taskId: 'task_w1', taskName: 'Trabajador 1', event: 'created' },
    { timestamp: 10, taskId: 'task_w2', taskName: 'Trabajador 2', event: 'created' },
    { timestamp: 40, taskId: 'task_w1', taskName: 'Trabajador 1', event: 'running', detail: 'Incrementar (+10)' },
    { timestamp: 50, taskId: 'task_w2', taskName: 'Trabajador 2', event: 'running', detail: 'Incrementar (+5)' },
    { timestamp: 250, taskId: 'task_w2', taskName: 'Trabajador 2', event: 'terminated' },
    { timestamp: 260, taskId: 'task_w1', taskName: 'Trabajador 1', event: 'terminated' },
    { timestamp: 400, taskId: 'task_main', taskName: 'Main', event: 'running', detail: 'Leer contador protegido' },
    { timestamp: 420, taskId: 'task_main', taskName: 'Main', event: 'terminated' },
  ],
};

export default protectedObjectExample;
