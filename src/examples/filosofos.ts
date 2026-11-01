import type { Example } from '../types';

export const filosofosExample: Example = {
  id: 'filosofos',
  category: 'concurrency',
  difficulty: 'advanced',
  title: {
    es: 'Filósofos Comensales',
    en: 'Dining Philosophers',
  },
  description: {
    es: 'Solución al problema de los filósofos comensales evitando interbloqueos (deadlock) mediante un mayordomo protegido.',
    en: 'Solution to the dining philosophers problem preventing deadlocks via a protected butler coordinator.',
  },
  whatToObserve: {
    es: [
      'El Mayordomo limita el número de filósofos sentados simultáneamente a N-1.',
      'Se rompe la condición de retención y espera circular que causa el interbloqueo.',
      'Todos los filósofos progresan alternando entre pensar y comer.',
    ],
    en: [
      'The Butler limits the number of seated philosophers to N-1.',
      'Breaks the circular wait condition that causes deadlock.',
      'All philosophers progress seamlessly between thinking and eating.',
    ],
  },
  code: `-- ============================================
-- EJEMPLO: Filósofos Comensales (Prevención de Deadlock)
-- ============================================
-- Cinco filósofos alternan entre pensar y comer. Para
-- comer requieren dos tenedores contiguos. Si todos
-- toman simultáneamente el tenedor izquierdo, se produce
-- un interbloqueo (deadlock).
--
-- Qué observar:
--   * Un camarero o árbitro protegido (Mayordomo) limita
--     a máximo 4 filósofos sentados simultáneamente.
--   * Se previene la condición de retención y espera circular.
--   * Los filósofos completan sus ciclos sin inanición.
-- ============================================

with Ada.Text_IO; use Ada.Text_IO;

procedure Filosofos is
   Num_Filosofos : constant := 3;

   protected Mayordomo is
      entry Sentarse;
      procedure Levantarse;
   private
      Sillas_Ocupadas : Natural := 0;
   end Mayordomo;

   protected body Mayordomo is
      entry Sentarse when Sillas_Ocupadas < (Num_Filosofos - 1) is
      begin
         Sillas_Ocupadas := Sillas_Ocupadas + 1;
      end Sentarse;

      procedure Levantarse is
      begin
         Sillas_Ocupadas := Sillas_Ocupadas - 1;
      end Levantarse;
   end Mayordomo;

   task type Filosofo (Id : Integer);

   task body Filosofo is
   begin
      Put_Line ("[Filósofo" & Integer'Image (Id) & "] Pensando profundamente...");
      delay 0.1;
      Mayordomo.Sentarse;
      Put_Line ("[Filósofo" & Integer'Image (Id) & "] Se sienta y toma ambos tenedores.");
      Put_Line ("[Filósofo" & Integer'Image (Id) & "] >>> Comiendo sabrosos espaguetis <<<");
      delay 0.2;
      Put_Line ("[Filósofo" & Integer'Image (Id) & "] Deja tenedores y se levanta.");
      Mayordomo.Levantarse;
      Put_Line ("[Filósofo" & Integer'Image (Id) & "] Termina su jornada satisfecho.");
   end Filosofo;

   F1 : Filosofo (1);
   F2 : Filosofo (2);
   F3 : Filosofo (3);

begin
   null;
end Filosofos;`,
  expectedOutput: `[Filósofo 1] Pensando profundamente...
[Filósofo 2] Pensando profundamente...
[Filósofo 3] Pensando profundamente...
[Filósofo 1] Se sienta y toma ambos tenedores.
[Filósofo 1] >>> Comiendo sabrosos espaguetis <<<
[Filósofo 2] Se sienta y toma ambos tenedores.
[Filósofo 2] >>> Comiendo sabrosos espaguetis <<<
[Filósofo 1] Deja tenedores y se levanta.
[Filósofo 1] Termina su jornada satisfecho.
[Filósofo 3] Se sienta y toma ambos tenedores.
[Filósofo 3] >>> Comiendo sabrosos espaguetis <<<
[Filósofo 2] Deja tenedores y se levanta.
[Filósofo 2] Termina su jornada satisfecho.
[Filósofo 3] Deja tenedores y se levanta.
[Filósofo 3] Termina su jornada satisfecho.`,
  taskEvents: [
    { timestamp: 0, taskId: 'task_main', taskName: 'Main', event: 'created' },
    { timestamp: 10, taskId: 'task_f1', taskName: 'Filósofo 1', event: 'created' },
    { timestamp: 10, taskId: 'task_f2', taskName: 'Filósofo 2', event: 'created' },
    { timestamp: 10, taskId: 'task_f3', taskName: 'Filósofo 3', event: 'created' },
    { timestamp: 30, taskId: 'task_f1', taskName: 'Filósofo 1', event: 'suspended', detail: 'thinking (delay 0.1s)' },
    { timestamp: 130, taskId: 'task_f1', taskName: 'Filósofo 1', event: 'running', detail: 'Mayordomo.Sentarse (chair 1/2)' },
    { timestamp: 140, taskId: 'task_f2', taskName: 'Filósofo 2', event: 'running', detail: 'Mayordomo.Sentarse (chair 2/2)' },
    { timestamp: 150, taskId: 'task_f3', taskName: 'Filósofo 3', event: 'blocked', detail: 'blocked on Mayordomo.Sentarse' },
    { timestamp: 340, taskId: 'task_f1', taskName: 'Filósofo 1', event: 'running', detail: 'Mayordomo.Levantarse' },
    { timestamp: 345, taskId: 'task_f1', taskName: 'Filósofo 1', event: 'terminated' },
    { timestamp: 350, taskId: 'task_f3', taskName: 'Filósofo 3', event: 'ready', detail: 'unblocked by chair release' },
    { timestamp: 360, taskId: 'task_f3', taskName: 'Filósofo 3', event: 'running', detail: 'eating' },
    { timestamp: 540, taskId: 'task_f2', taskName: 'Filósofo 2', event: 'terminated' },
    { timestamp: 560, taskId: 'task_f3', taskName: 'Filósofo 3', event: 'terminated' },
    { timestamp: 600, taskId: 'task_main', taskName: 'Main', event: 'terminated' },
  ],
};

export default filosofosExample;
