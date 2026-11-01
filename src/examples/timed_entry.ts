import type { Example } from '../types';

export const timedEntryExample: Example = {
  id: 'timed_entry',
  category: 'advanced',
  difficulty: 'advanced',
  title: {
    es: 'Entry con Timeout',
    en: 'Timed Entry Call',
  },
  description: {
    es: "Llamada condicional a punto de entrada con límite de tiempo máximo ('select ... or delay') para evitar bloqueos permanentes.",
    en: "Conditional entry call with maximum timeout deadline ('select ... or delay') to prevent indefinite blocking.",
  },
  whatToObserve: {
    es: [
      "El cliente intenta llamar al entry 'Servidor.Operacion'.",
      "La rama alternativa 'or delay 0.2' cancela la llamada si el servidor no responde dentro del plazo.",
      'Patrón crítico para la fiabilidad de sistemas empotrados y de tiempo real.',
    ],
    en: [
      "The client attempts to call 'Servidor.Operacion'.",
      "The alternative 'or delay 0.2' branch cancels the call if the server fails to accept in time.",
      'Critical pattern for real-time and fault-tolerant embedded systems.',
    ],
  },
  code: `-- ============================================
-- EJEMPLO: Llamada a Entrada con Timeout (Timed Entry)
-- ============================================
-- En sistemas de tiempo real, un cliente no puede
-- esperar eternamente una respuesta. Ada ofrece la
-- llamada condicional por tiempo usando 'select ... or delay'.
--
-- Qué observar:
--   * El cliente intenta 'Servidor.Operacion_Lenta'
--   * 'or delay 0.2' cancela la llamada si no fue aceptada a tiempo
--   * Previene congelamientos ante servidores ocupados
-- ============================================

with Ada.Text_IO; use Ada.Text_IO;

procedure Timed_Entry_Demo is
   task Servidor is
      entry Operacion (Dato : in String);
   end Servidor;

   task body Servidor is
   begin
      Put_Line ("[Servidor] Ocupado realizando tareas previas...");
      delay 0.5; -- Simula demora
      accept Operacion (Dato : in String) do
         Put_Line ("[Servidor] Finalmente aceptada: " & Dato);
      end Operacion;
   end Servidor;

   task Cliente_Ansioso;

   task body Cliente_Ansioso is
   begin
      Put_Line ("[Cliente] Intentando llamada a entrada con timeout de 0.2s...");
      select
         Servidor.Operacion ("Mensaje Urgente");
         Put_Line ("[Cliente] ¡Éxito en la llamada!");
      or
         delay 0.2;
         Put_Line ("[Cliente] ⚠ TIMEOUT! El servidor tardó demasiado. Cancelando.");
      end select;
   end Cliente_Ansioso;

begin
   null;
end Timed_Entry_Demo;`,
  expectedOutput: `[Servidor] Ocupado realizando tareas previas...
[Cliente] Intentando llamada a entrada con timeout de 0.2s...
[Cliente] ⚠ TIMEOUT! El servidor tardó demasiado. Cancelando.`,
  taskEvents: [
    { timestamp: 0, taskId: 'task_main', taskName: 'Main', event: 'created' },
    { timestamp: 10, taskId: 'task_srv', taskName: 'Servidor', event: 'created' },
    { timestamp: 10, taskId: 'task_cli', taskName: 'Cliente', event: 'created' },
    { timestamp: 30, taskId: 'task_srv', taskName: 'Servidor', event: 'running', detail: 'busy before accept' },
    { timestamp: 40, taskId: 'task_cli', taskName: 'Cliente', event: 'running', detail: 'initiating timed entry call' },
    { timestamp: 50, taskId: 'task_cli', taskName: 'Cliente', event: 'blocked', detail: 'queued on Servidor.Operacion with 0.2s deadline' },
    { timestamp: 250, taskId: 'task_cli', taskName: 'Cliente', event: 'ready', detail: '0.2s deadline expired, entry call cancelled' },
    { timestamp: 260, taskId: 'task_cli', taskName: 'Cliente', event: 'running', detail: 'executing or delay branch' },
    { timestamp: 280, taskId: 'task_cli', taskName: 'Cliente', event: 'terminated' },
    { timestamp: 530, taskId: 'task_srv', taskName: 'Servidor', event: 'running', detail: 'reaches accept Operacion (no callers pending)' },
    { timestamp: 540, taskId: 'task_srv', taskName: 'Servidor', event: 'terminated' },
    { timestamp: 550, taskId: 'task_main', taskName: 'Main', event: 'terminated' },
  ],
};

export default timedEntryExample;
