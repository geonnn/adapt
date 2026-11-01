import type { Example } from '../types';

export const rendezvousExample: Example = {
  id: 'rendezvous',
  category: 'concurrency',
  difficulty: 'intermediate',
  title: {
    es: 'Rendez-vous',
    en: 'Rendezvous',
  },
  description: {
    es: "Comunicación y sincronización síncrona directa entre tareas mediante puntos de entrada ('entry') y bloques de aceptación ('accept').",
    en: 'Direct synchronous communication and synchronization between tasks using entries and accept blocks.',
  },
  whatToObserve: {
    es: [
      "La tarea Servidor expone un 'entry' que actúa como interfaz de llamada.",
      "La tarea Cliente se bloquea al llamar al entry hasta que el Servidor llega a su 'accept'.",
      'El paso de parámetros en el rendez-vous permite comunicación bidireccional (in, out).',
    ],
    en: [
      "The Server task exposes an 'entry' serving as a call interface.",
      "The Client task blocks upon calling the entry until the Server reaches its 'accept'.",
      'Parameter passing during rendezvous enables bidirectional communication (in, out).',
    ],
  },
  code: `-- ============================================
-- EJEMPLO: Rendez-vous en Ada
-- ============================================
-- El rendez-vous es el mecanismo fundamental de
-- comunicación síncrona en Ada. La tarea cliente llama
-- a un 'entry' y se bloquea hasta que el servidor
-- ejecuta el correspondiente bloque 'accept'.
--
-- Qué observar:
--   * El Servidor declara 'entry Saludar (Nombre : in String; Id_Cliente : out Integer);'
--   * El Cliente llama 'Servidor.Saludar ("Ada_Lovelace", ID);' y se bloquea
--   * El Servidor entra en 'accept', transfiere datos, y ambas tareas continúan
-- ============================================

with Ada.Text_IO; use Ada.Text_IO;

procedure Rendezvous_Demo is
   task Servidor is
      entry Saludar (Nombre : in String; Id_Cliente : out Integer);
   end Servidor;

   task Cliente;

   task body Servidor is
      Contador : Integer := 100;
   begin
      Put_Line ("[Servidor] Esperando cliente en entry Saludar...");
      accept Saludar (Nombre : in String; Id_Cliente : out Integer) do
         Put_Line ("[Servidor] Rendez-vous iniciado con: " & Nombre);
         Contador := Contador + 1;
         Id_Cliente := Contador;
         delay 0.2;
         Put_Line ("[Servidor] Completando atención y liberando cliente.");
      end Saludar;
      Put_Line ("[Servidor] Cita finalizada con éxito.");
   end Servidor;

   task body Cliente is
      Mi_Id : Integer := 0;
   begin
      delay 0.1;
      Put_Line ("[Cliente] Llamando a Servidor.Saludar...");
      Servidor.Saludar ("Ada_Lovelace", Mi_Id);
      Put_Line ("[Cliente] Desbloqueado! Recibí Id asignado:" & Integer'Image (Mi_Id));
   end Cliente;

begin
   null;
end Rendezvous_Demo;`,
  expectedOutput: `[Servidor] Esperando cliente en entry Saludar...
[Cliente] Llamando a Servidor.Saludar...
[Servidor] Rendez-vous iniciado con: Ada_Lovelace
[Servidor] Completando atención y liberando cliente.
[Servidor] Cita finalizada con éxito.
[Cliente] Desbloqueado! Recibí Id asignado: 101`,
  taskEvents: [
    { timestamp: 0, taskId: 'task_main', taskName: 'Main', event: 'created' },
    { timestamp: 10, taskId: 'task_server', taskName: 'Servidor', event: 'created' },
    { timestamp: 10, taskId: 'task_client', taskName: 'Cliente', event: 'created' },
    { timestamp: 50, taskId: 'task_server', taskName: 'Servidor', event: 'running' },
    { timestamp: 60, taskId: 'task_server', taskName: 'Servidor', event: 'blocked', detail: 'waiting in accept Saludar' },
    { timestamp: 100, taskId: 'task_client', taskName: 'Cliente', event: 'running' },
    { timestamp: 120, taskId: 'task_client', taskName: 'Cliente', event: 'blocked', detail: 'calling Servidor.Saludar' },
    { timestamp: 130, taskId: 'task_server', taskName: 'Servidor', event: 'running', detail: 'executing accept Saludar block' },
    { timestamp: 330, taskId: 'task_client', taskName: 'Cliente', event: 'ready', detail: 'unblocked from rendezvous' },
    { timestamp: 340, taskId: 'task_server', taskName: 'Servidor', event: 'running', detail: 'post-rendezvous logic' },
    { timestamp: 380, taskId: 'task_server', taskName: 'Servidor', event: 'terminated' },
    { timestamp: 400, taskId: 'task_client', taskName: 'Cliente', event: 'running', detail: 'received output parameters' },
    { timestamp: 450, taskId: 'task_client', taskName: 'Cliente', event: 'terminated' },
    { timestamp: 500, taskId: 'task_main', taskName: 'Main', event: 'terminated' },
  ],
};

export default rendezvousExample;
