import type { Example } from '../types';

export const taskSimpleExample: Example = {
  id: 'task_simple',
  category: 'concurrency',
  difficulty: 'basic',
  title: {
    es: 'Tareas Simples',
    en: 'Simple Tasks',
  },
  description: {
    es: 'Introducción a las tareas en Ada: declaración, cuerpo, activación automática y ejecución intercalada concurrente.',
    en: 'Introduction to Ada tasks: specification, body, automatic activation, and concurrent interleaved execution.',
  },
  whatToObserve: {
    es: [
      "Las tareas se declaran con 'task' y su implementación se define en 'task body'.",
      "Se activan automáticamente en paralelo al entrar al 'begin' del procedimiento padre.",
      "La instrucción 'delay' suspende la tarea cediendo el tiempo de procesador.",
    ],
    en: [
      "Tasks are declared with 'task' and implemented in 'task body'.",
      "They are automatically activated in parallel upon entering the parent's 'begin'.",
      "The 'delay' statement suspends the task, yielding CPU execution.",
    ],
  },
  code: `-- ============================================
-- EJEMPLO: Tareas Simples Concurrentes
-- ============================================
-- En Ada, las tareas (tasks) son entidades activas
-- de primera clase. Se activan automáticamente al
-- entrar en el bloque 'begin' del procedimiento padre.
--
-- Qué observar:
--   * Declaración de tipo o especificación 'task Tarea_A;'
--   * Definición del cuerpo 'task body Tarea_A is ...'
--   * Ejecución concurrente e intercalada con retardo 'delay'
-- ============================================

with Ada.Text_IO; use Ada.Text_IO;

procedure Task_Simple is
   task Tarea_A;
   task Tarea_B;

   task body Tarea_A is
   begin
      for I in 1 .. 3 loop
         Put_Line ("[Tarea A] Iteración" & Integer'Image (I));
         delay 0.3;
      end loop;
      Put_Line ("[Tarea A] Finalizada.");
   end Tarea_A;

   task body Tarea_B is
   begin
      for I in 1 .. 3 loop
         Put_Line ("[Tarea B] Iteración" & Integer'Image (I));
         delay 0.2;
      end loop;
      Put_Line ("[Tarea B] Finalizada.");
   end Tarea_B;

begin
   Put_Line ("[Main] Tareas iniciadas concurrentemente...");
end Task_Simple;`,
  expectedOutput: `[Main] Tareas iniciadas concurrentemente...
[Tarea B] Iteración 1
[Tarea A] Iteración 1
[Tarea B] Iteración 2
[Tarea A] Iteración 2
[Tarea B] Iteración 3
[Tarea B] Finalizada.
[Tarea A] Iteración 3
[Tarea A] Finalizada.`,
  taskEvents: [
    { timestamp: 0, taskId: 'task_main', taskName: 'Main', event: 'created' },
    { timestamp: 20, taskId: 'task_a', taskName: 'Tarea_A', event: 'created' },
    { timestamp: 20, taskId: 'task_b', taskName: 'Tarea_B', event: 'created' },
    { timestamp: 50, taskId: 'task_main', taskName: 'Main', event: 'running' },
    { timestamp: 60, taskId: 'task_b', taskName: 'Tarea_B', event: 'running', detail: 'Iteration 1' },
    { timestamp: 70, taskId: 'task_a', taskName: 'Tarea_A', event: 'running', detail: 'Iteration 1' },
    { timestamp: 150, taskId: 'task_b', taskName: 'Tarea_B', event: 'suspended', detail: 'delay 0.2s' },
    { timestamp: 200, taskId: 'task_a', taskName: 'Tarea_A', event: 'suspended', detail: 'delay 0.3s' },
    { timestamp: 350, taskId: 'task_b', taskName: 'Tarea_B', event: 'running', detail: 'Iteration 2' },
    { timestamp: 500, taskId: 'task_a', taskName: 'Tarea_A', event: 'running', detail: 'Iteration 2' },
    { timestamp: 550, taskId: 'task_b', taskName: 'Tarea_B', event: 'running', detail: 'Iteration 3' },
    { timestamp: 750, taskId: 'task_b', taskName: 'Tarea_B', event: 'terminated' },
    { timestamp: 800, taskId: 'task_a', taskName: 'Tarea_A', event: 'running', detail: 'Iteration 3' },
    { timestamp: 1100, taskId: 'task_a', taskName: 'Tarea_A', event: 'terminated' },
    { timestamp: 1150, taskId: 'task_main', taskName: 'Main', event: 'terminated' },
  ],
};

export default taskSimpleExample;
