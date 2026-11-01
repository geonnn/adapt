import type { Example } from '../types';
import { helloWorldExample } from './hello_world';
import { tiposBasicosExample } from './tipos_basicos';
import { taskSimpleExample } from './task_simple';
import { rendezvousExample } from './rendezvous';
import { protectedObjectExample } from './protected_object';
import { semaforoExample } from './semaforo';
import { productorConsumidorExample } from './productor_consumidor';
import { filosofosExample } from './filosofos';
import { selectStatementExample } from './select_statement';
import { timedEntryExample } from './timed_entry';

export {
  helloWorldExample,
  tiposBasicosExample,
  taskSimpleExample,
  rendezvousExample,
  protectedObjectExample,
  semaforoExample,
  productorConsumidorExample,
  filosofosExample,
  selectStatementExample,
  timedEntryExample,
};

export const examples: Example[] = [
  helloWorldExample,
  tiposBasicosExample,
  taskSimpleExample,
  rendezvousExample,
  protectedObjectExample,
  semaforoExample,
  productorConsumidorExample,
  filosofosExample,
  selectStatementExample,
  timedEntryExample,
];

export const examplesById: Record<string, Example> = examples.reduce(
  (acc, example) => {
    acc[example.id] = example;
    return acc;
  },
  {} as Record<string, Example>
);

export function getExampleById(id: string): Example | undefined {
  return examplesById[id];
}

export function getDefaultExample(): Example {
  return helloWorldExample;
}
