import type { Example } from '../types';

export const semaforoExample: Example = {
  id: 'semaforo',
  category: 'concurrency',
  difficulty: 'intermediate',
  title: {
    es: 'Semáforo',
    en: 'Semaphore',
  },
  description: {
    es: 'Construcción de un semáforo contador/binario clásico mediante un objeto protegido con barrera condicional (entry when).',
    en: 'Construction of a classic counting/binary semaphore using an Ada protected object with conditional entry barrier.',
  },
  whatToObserve: {
    es: [
      "La barrera 'entry Wait when Cuenta > 0' suspende a las tareas si no hay permisos.",
      "'procedure Signal' incrementa los permisos y desbloquea automáticamente a la siguiente tarea.",
      'Garantiza exclusión mutua estricta en la sección crítica.',
    ],
    en: [
      "The barrier 'entry Wait when Cuenta > 0' suspends tasks if no permits remain.",
      "'procedure Signal' increments permits and automatically wakes up queued tasks.",
      'Guarantees strict mutual exclusion inside the critical section.',
    ],
  },
  code: `-- ============================================
-- EJEMPLO: Semáforo con Objeto Protegido
-- ============================================
-- En Ada, un semáforo clásico de Dijkstra se modela
-- elegantemente mediante un objeto protegido con un
-- 'entry' bloqueado por una barrera condicional (Wait/P)
-- y un 'procedure' de liberación (Signal/V).
--
-- Qué observar:
--   * 'entry Wait when Cuenta > 0' suspende si no hay permisos
--   * 'procedure Signal' incrementa y reactiva tareas encoladas
--   * Garantía de acceso exclusivo a la sección crítica
-- ============================================

with Ada.Text_IO; use Ada.Text_IO;

procedure Semaforo_Demo is
   protected Semaforo is
      entry Wait;
      procedure Signal;
   private
      Cuenta : Natural := 1; -- Semáforo binario (mutex)
   end Semaforo;

   protected body Semaforo is
      entry Wait when Cuenta > 0 is
      begin
         Cuenta := Cuenta - 1;
      end Wait;

      procedure Signal is
      begin
         Cuenta := Cuenta + 1;
      end Signal;
   end Semaforo;

   task type Tarea_Critica (Id : Integer);

   task body Tarea_Critica is
   begin
      Put_Line ("[Tarea" & Integer'Image (Id) & "] Solicitando semáforo (Wait)...");
      Semaforo.Wait;
      Put_Line ("[Tarea" & Integer'Image (Id) & "] >>> EN SECCIÓN CRÍTICA <<<");
      delay 0.2;
      Put_Line ("[Tarea" & Integer'Image (Id) & "] <<< Saliendo y liberando (Signal)");
      Semaforo.Signal;
   end Tarea_Critica;

   T1 : Tarea_Critica (1);
   T2 : Tarea_Critica (2);

begin
   null;
end Semaforo_Demo;`,
  expectedOutput: `[Tarea 1] Solicitando semáforo (Wait)...
[Tarea 1] >>> EN SECCIÓN CRÍTICA <<<
[Tarea 2] Solicitando semáforo (Wait)...
[Tarea 1] <<< Saliendo y liberando (Signal)
[Tarea 2] >>> EN SECCIÓN CRÍTICA <<<
[Tarea 2] <<< Saliendo y liberando (Signal)`,
  taskEvents: [
    { timestamp: 0, taskId: 'task_main', taskName: 'Main', event: 'created' },
    { timestamp: 10, taskId: 'task_t1', taskName: 'Tarea 1', event: 'created' },
    { timestamp: 10, taskId: 'task_t2', taskName: 'Tarea 2', event: 'created' },
    { timestamp: 30, taskId: 'task_t1', taskName: 'Tarea 1', event: 'running', detail: 'Calling Semaforo.Wait' },
    { timestamp: 40, taskId: 'task_t1', taskName: 'Tarea 1', event: 'running', detail: 'Acquired permit (Cuenta=0)' },
    { timestamp: 50, taskId: 'task_t2', taskName: 'Tarea 2', event: 'running', detail: 'Calling Semaforo.Wait' },
    { timestamp: 60, taskId: 'task_t2', taskName: 'Tarea 2', event: 'blocked', detail: 'Blocked on barrier (Cuenta=0)' },
    { timestamp: 240, taskId: 'task_t1', taskName: 'Tarea 1', event: 'running', detail: 'Calling Semaforo.Signal' },
    { timestamp: 245, taskId: 'task_t1', taskName: 'Tarea 1', event: 'terminated' },
    { timestamp: 250, taskId: 'task_t2', taskName: 'Tarea 2', event: 'ready', detail: 'Unblocked by Signal' },
    { timestamp: 260, taskId: 'task_t2', taskName: 'Tarea 2', event: 'running', detail: 'Acquired permit (Cuenta=0)' },
    { timestamp: 460, taskId: 'task_t2', taskName: 'Tarea 2', event: 'running', detail: 'Calling Semaforo.Signal' },
    { timestamp: 470, taskId: 'task_t2', taskName: 'Tarea 2', event: 'terminated' },
    { timestamp: 500, taskId: 'task_main', taskName: 'Main', event: 'terminated' },
  ],
};

export default semaforoExample;
