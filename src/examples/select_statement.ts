import type { Example } from '../types';

export const selectStatementExample: Example = {
  id: 'select_statement',
  category: 'advanced',
  difficulty: 'advanced',
  title: {
    es: 'Select Statement',
    en: 'Select Statement',
  },
  description: {
    es: 'Espera selectiva y multiplexación no determinista entre múltiples canales de entrada en tareas servidoras.',
    en: 'Selective wait and non-deterministic multiplexing across multiple input entries in server tasks.',
  },
  whatToObserve: {
    es: [
      "La estructura 'select ... or accept ... or accept ...' permite atender llamadas entrantes sin ordenar.",
      'Si varias llamadas están pendientes, el runtime selecciona arbitrariamente de forma justa.',
      'Facilita la creación de servicios reactivos y protocolos de parada limpia.',
    ],
    en: [
      "The 'select ... or accept ... or accept ...' construct handles calls without fixed order.",
      'If multiple calls are pending, the runtime fairly chooses non-deterministically.',
      'Enables reactive services and clean shutdown protocols.',
    ],
  },
  code: `-- ============================================
-- EJEMPLO: Espera Selectiva (Select Statement)
-- ============================================
-- La instrucción 'select' permite a una tarea servidora
-- esperar no determinísticamente entre múltiples entradas
-- (entries) alternativas o ejecutar una rama por defecto.
--
-- Qué observar:
--   * Alternancia no determinista con 'or accept'
--   * Cláusula 'terminate': la tarea servidora finaliza
--     automáticamente cuando no quedan clientes activos.
--   * Permite multiplexar eventos sin bloqueo permanente.
-- ============================================

with Ada.Text_IO; use Ada.Text_IO;

procedure Select_Statement_Demo is
   task Servidor is
      entry Pedido_A (Msg : in String);
      entry Pedido_B (Num : in Integer);
      entry Detener;
   end Servidor;

   task body Servidor is
      Continuar : Boolean := True;
   begin
      Put_Line ("[Servidor] En servicio, esperando peticiones...");
      while Continuar loop
         select
            accept Pedido_A (Msg : in String) do
               Put_Line ("[Servidor] Atendiendo Canal A: " & Msg);
            end Pedido_A;
         or
            accept Pedido_B (Num : in Integer) do
               Put_Line ("[Servidor] Atendiendo Canal B, código:" & Integer'Image (Num));
            end Pedido_B;
         or
            accept Detener do
               Put_Line ("[Servidor] Recibida orden de parada.");
               Continuar := False;
            end Detener;
         end select;
      end loop;
      Put_Line ("[Servidor] Cerrado ordenadamente.");
   end Servidor;

   task Cliente;

   task body Cliente is
   begin
      delay 0.1;
      Servidor.Pedido_A ("Consulta de telemetría");
      delay 0.1;
      Servidor.Pedido_B (404);
      delay 0.1;
      Servidor.Detener;
   end Cliente;

begin
   null;
end Select_Statement_Demo;`,
  expectedOutput: `[Servidor] En servicio, esperando peticiones...
[Servidor] Atendiendo Canal A: Consulta de telemetría
[Servidor] Atendiendo Canal B, código: 404
[Servidor] Recibida orden de parada.
[Servidor] Cerrado ordenadamente.`,
  taskEvents: [
    { timestamp: 0, taskId: 'task_main', taskName: 'Main', event: 'created' },
    { timestamp: 10, taskId: 'task_srv', taskName: 'Servidor', event: 'created' },
    { timestamp: 10, taskId: 'task_cli', taskName: 'Cliente', event: 'created' },
    { timestamp: 30, taskId: 'task_srv', taskName: 'Servidor', event: 'running', detail: 'Entering selective wait (select)' },
    { timestamp: 40, taskId: 'task_srv', taskName: 'Servidor', event: 'blocked', detail: 'Awaiting Pedido_A / Pedido_B / Detener' },
    { timestamp: 130, taskId: 'task_cli', taskName: 'Cliente', event: 'running', detail: 'Calling Servidor.Pedido_A' },
    { timestamp: 140, taskId: 'task_srv', taskName: 'Servidor', event: 'running', detail: 'accept Pedido_A' },
    { timestamp: 240, taskId: 'task_cli', taskName: 'Cliente', event: 'running', detail: 'Calling Servidor.Pedido_B' },
    { timestamp: 250, taskId: 'task_srv', taskName: 'Servidor', event: 'running', detail: 'accept Pedido_B' },
    { timestamp: 350, taskId: 'task_cli', taskName: 'Cliente', event: 'running', detail: 'Calling Servidor.Detener' },
    { timestamp: 360, taskId: 'task_srv', taskName: 'Servidor', event: 'running', detail: 'accept Detener' },
    { timestamp: 370, taskId: 'task_cli', taskName: 'Cliente', event: 'terminated' },
    { timestamp: 380, taskId: 'task_srv', taskName: 'Servidor', event: 'terminated' },
    { timestamp: 400, taskId: 'task_main', taskName: 'Main', event: 'terminated' },
  ],
};

export default selectStatementExample;
