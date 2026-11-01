import type { Example } from '../types';

export const productorConsumidorExample: Example = {
  id: 'productor_consumidor',
  category: 'concurrency',
  difficulty: 'advanced',
  title: {
    es: 'Productor-Consumidor',
    en: 'Producer-Consumer',
  },
  description: {
    es: 'Búfer circular acotado compartido implementado con objeto protegido, barreras de lleno/vacío y tareas desacopladas.',
    en: 'Bounded circular buffer shared via protected object with full/empty barriers and decoupled tasks.',
  },
  whatToObserve: {
    es: [
      "'when Cuenta < Capacidad' bloquea al Productor si el búfer está lleno.",
      "'when Cuenta > 0' bloquea al Consumidor si el búfer está vacío.",
      'Sin esperas activas (busy waiting): el runtime gestiona las colas de espera eficientemente.',
    ],
    en: [
      "'when Cuenta < Capacidad' blocks the Producer when the buffer is full.",
      "'when Cuenta > 0' blocks the Consumer when the buffer is empty.",
      'Zero busy waiting: the Ada runtime efficiently manages entry queues.',
    ],
  },
  code: `-- ============================================
-- EJEMPLO: Productor - Consumidor con Búfer Acotado
-- ============================================
-- Patrón clásico de concurrencia donde productores y
-- consumidores comparten un búfer circular protegido.
-- Las barreras de Ada evitan el desbordamiento (overflow)
-- y el subdesbordamiento (underflow) sin esperas activas.
--
-- Qué observar:
--   * Búfer protegido con dos 'entry': Depositar y Extraer
--   * 'when Cuenta < Capacidad': el productor se bloquea si el búfer está lleno
--   * 'when Cuenta > 0': el consumidor se bloquea si el búfer está vacío
-- ============================================

with Ada.Text_IO; use Ada.Text_IO;

procedure Productor_Consumidor is
   Capacidad : constant := 3;

   protected Bufer is
      entry Depositar (Elemento : in Integer);
      entry Extraer (Elemento : out Integer);
   private
      Datos     : array (0 .. Capacidad - 1) of Integer;
      Cabeza    : Natural := 0;
      Cola      : Natural := 0;
      Cuenta    : Natural := 0;
   end Bufer;

   protected body Bufer is
      entry Depositar (Elemento : in Integer) when Cuenta < Capacidad is
      begin
         Datos (Cola) := Elemento;
         Cola := (Cola + 1) mod Capacidad;
         Cuenta := Cuenta + 1;
         Put_Line (" [Búfer] Guardado:" & Integer'Image (Elemento) &
                   " (Total en búfer:" & Integer'Image (Cuenta) & ")");
      end Depositar;

      entry Extraer (Elemento : out Integer) when Cuenta > 0 is
      begin
         Elemento := Datos (Cabeza);
         Cabeza := (Cabeza + 1) mod Capacidad;
         Cuenta := Cuenta - 1;
         Put_Line (" [Búfer] Extraído:" & Integer'Image (Elemento) &
                   " (Restantes:" & Integer'Image (Cuenta) & ")");
      end Extraer;
   end Bufer;

   task Productor;
   task Consumidor;

   task body Productor is
   begin
      for I in 1 .. 5 loop
         Put_Line ("[Productor] Generando item" & Integer'Image (I));
         Bufer.Depositar (I);
         delay 0.1;
      end loop;
   end Productor;

   task body Consumidor is
      Val : Integer;
   begin
      for I in 1 .. 5 loop
         delay 0.2;
         Bufer.Extraer (Val);
         Put_Line ("[Consumidor] Procesado item" & Integer'Image (Val));
      end loop;
   end Consumidor;

begin
   null;
end Productor_Consumidor;`,
  expectedOutput: `[Productor] Generando item 1
 [Búfer] Guardado: 1 (Total en búfer: 1)
[Productor] Generando item 2
 [Búfer] Guardado: 2 (Total en búfer: 2)
[Consumidor] Procesado item 1
 [Búfer] Extraído: 1 (Restantes: 1)
[Productor] Generando item 3
 [Búfer] Guardado: 3 (Total en búfer: 2)
[Productor] Generando item 4
 [Búfer] Guardado: 4 (Total en búfer: 3)
[Consumidor] Procesado item 2
 [Búfer] Extraído: 2 (Restantes: 2)
[Productor] Generando item 5
 [Búfer] Guardado: 5 (Total en búfer: 3)
[Consumidor] Procesado item 3
 [Búfer] Extraído: 3 (Restantes: 2)
[Consumidor] Procesado item 4
 [Búfer] Extraído: 4 (Restantes: 1)
[Consumidor] Procesado item 5
 [Búfer] Extraído: 5 (Restantes: 0)`,
  taskEvents: [
    { timestamp: 0, taskId: 'task_main', taskName: 'Main', event: 'created' },
    { timestamp: 10, taskId: 'task_prod', taskName: 'Productor', event: 'created' },
    { timestamp: 10, taskId: 'task_cons', taskName: 'Consumidor', event: 'created' },
    { timestamp: 30, taskId: 'task_prod', taskName: 'Productor', event: 'running', detail: 'Depositar(1)' },
    { timestamp: 140, taskId: 'task_prod', taskName: 'Productor', event: 'running', detail: 'Depositar(2)' },
    { timestamp: 210, taskId: 'task_cons', taskName: 'Consumidor', event: 'running', detail: 'Extraer(1)' },
    { timestamp: 250, taskId: 'task_prod', taskName: 'Productor', event: 'running', detail: 'Depositar(3)' },
    { timestamp: 360, taskId: 'task_prod', taskName: 'Productor', event: 'running', detail: 'Depositar(4)' },
    { timestamp: 420, taskId: 'task_cons', taskName: 'Consumidor', event: 'running', detail: 'Extraer(2)' },
    { timestamp: 470, taskId: 'task_prod', taskName: 'Productor', event: 'running', detail: 'Depositar(5)' },
    { timestamp: 580, taskId: 'task_prod', taskName: 'Productor', event: 'terminated' },
    { timestamp: 630, taskId: 'task_cons', taskName: 'Consumidor', event: 'running', detail: 'Extraer(3)' },
    { timestamp: 840, taskId: 'task_cons', taskName: 'Consumidor', event: 'running', detail: 'Extraer(4)' },
    { timestamp: 1050, taskId: 'task_cons', taskName: 'Consumidor', event: 'running', detail: 'Extraer(5)' },
    { timestamp: 1060, taskId: 'task_cons', taskName: 'Consumidor', event: 'terminated' },
    { timestamp: 1100, taskId: 'task_main', taskName: 'Main', event: 'terminated' },
  ],
};

export default productorConsumidorExample;
