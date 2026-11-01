import test from 'node:test';
import assert from 'node:assert/strict';
import {
  examples,
  examplesById,
  getDefaultExample,
  getExampleById,
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
} from './index';
import type { TaskLifecycleState } from '../types';

const VALID_LIFECYCLE_STATES: TaskLifecycleState[] = [
  'created',
  'ready',
  'running',
  'blocked',
  'suspended',
  'terminated',
];

const EXPECTED_IDS = [
  'hello_world',
  'tipos_basicos',
  'task_simple',
  'rendezvous',
  'protected_object',
  'semaforo',
  'productor_consumidor',
  'filosofos',
  'select_statement',
  'timed_entry',
];

test('Library exports exactly 10 examples in ordered sequence', () => {
  assert.equal(examples.length, 10);
  const ids = examples.map((e) => e.id);
  assert.deepEqual(ids, EXPECTED_IDS);
});

test('Individual named exports match examples list instances', () => {
  assert.equal(examples[0], helloWorldExample);
  assert.equal(examples[1], tiposBasicosExample);
  assert.equal(examples[2], taskSimpleExample);
  assert.equal(examples[3], rendezvousExample);
  assert.equal(examples[4], protectedObjectExample);
  assert.equal(examples[5], semaforoExample);
  assert.equal(examples[6], productorConsumidorExample);
  assert.equal(examples[7], filosofosExample);
  assert.equal(examples[8], selectStatementExample);
  assert.equal(examples[9], timedEntryExample);
});

test('examplesById maps every ID correctly', () => {
  assert.equal(Object.keys(examplesById).length, 10);
  for (const id of EXPECTED_IDS) {
    assert.ok(examplesById[id], `Missing id in examplesById: ${id}`);
    assert.equal(examplesById[id].id, id);
  }
});

test('getExampleById returns example or undefined', () => {
  for (const id of EXPECTED_IDS) {
    const found = getExampleById(id);
    assert.ok(found, `Expected getExampleById("${id}") to return example`);
    assert.equal(found?.id, id);
  }

  assert.equal(getExampleById('unknown_example'), undefined);
  assert.equal(getExampleById(''), undefined);
});

test('getDefaultExample returns hello_world', () => {
  const def = getDefaultExample();
  assert.equal(def.id, 'hello_world');
  assert.equal(def, helloWorldExample);
});

test('Every example satisfies the Example schema specification', () => {
  for (const example of examples) {
    // Identifier & category
    assert.ok(example.id && typeof example.id === 'string', `${example.id}: id must be non-empty string`);
    assert.ok(
      ['basics', 'concurrency', 'advanced'].includes(example.category),
      `${example.id}: invalid category ${example.category}`
    );
    assert.ok(
      ['basic', 'intermediate', 'advanced'].includes(example.difficulty),
      `${example.id}: invalid difficulty ${example.difficulty}`
    );

    // Title & description bilingual
    assert.ok(example.title.es.trim().length > 0, `${example.id}: title.es required`);
    assert.ok(example.title.en.trim().length > 0, `${example.id}: title.en required`);
    assert.ok(example.description.es.trim().length > 0, `${example.id}: description.es required`);
    assert.ok(example.description.en.trim().length > 0, `${example.id}: description.en required`);

    // What to observe bullets
    assert.ok(Array.isArray(example.whatToObserve.es), `${example.id}: whatToObserve.es must be array`);
    assert.ok(Array.isArray(example.whatToObserve.en), `${example.id}: whatToObserve.en must be array`);
    assert.ok(example.whatToObserve.es.length >= 2, `${example.id}: at least 2 es observation bullets`);
    assert.ok(example.whatToObserve.en.length >= 2, `${example.id}: at least 2 en observation bullets`);

    // Ada code & educational header
    assert.ok(example.code.startsWith('-- ======================'), `${example.id}: must start with educational header`);
    assert.ok(example.code.includes('procedure'), `${example.id}: must contain a procedure`);
    assert.ok(example.code.includes('begin'), `${example.id}: must contain begin`);
    assert.ok(example.code.includes('end'), `${example.id}: must contain end`);

    // Expected Output
    assert.ok(example.expectedOutput.trim().length > 0, `${example.id}: expectedOutput must not be empty`);

    // TaskEvents
    assert.ok(Array.isArray(example.taskEvents), `${example.id}: taskEvents must be array`);
    assert.ok((example.taskEvents?.length ?? 0) >= 3, `${example.id}: taskEvents must have >= 3 events`);

    let prevTimestamp = -1;
    for (const evt of example.taskEvents ?? []) {
      assert.ok(typeof evt.timestamp === 'number' && evt.timestamp >= 0, `${example.id}: valid timestamp`);
      assert.ok(evt.timestamp >= prevTimestamp, `${example.id}: timestamps should be non-decreasing (${evt.timestamp} < ${prevTimestamp})`);
      prevTimestamp = evt.timestamp;

      assert.ok(evt.taskId && typeof evt.taskId === 'string', `${example.id}: valid taskId`);
      assert.ok(evt.taskName && typeof evt.taskName === 'string', `${example.id}: valid taskName`);
      assert.ok(
        VALID_LIFECYCLE_STATES.includes(evt.event),
        `${example.id}: valid event state "${evt.event}"`
      );
    }
  }
});

test('Concurrent examples contain expected task actors', () => {
  const taskSimple = getExampleById('task_simple')!;
  const taskSimpleIds = new Set(taskSimple.taskEvents?.map((e) => e.taskId));
  assert.ok(taskSimpleIds.has('task_main'));
  assert.ok(taskSimpleIds.has('task_a'));
  assert.ok(taskSimpleIds.has('task_b'));

  const rendezvous = getExampleById('rendezvous')!;
  const rendezvousIds = new Set(rendezvous.taskEvents?.map((e) => e.taskId));
  assert.ok(rendezvousIds.has('task_main'));
  assert.ok(rendezvousIds.has('task_server'));
  assert.ok(rendezvousIds.has('task_client'));

  const prodCons = getExampleById('productor_consumidor')!;
  const prodConsIds = new Set(prodCons.taskEvents?.map((e) => e.taskId));
  assert.ok(prodConsIds.has('task_main'));
  assert.ok(prodConsIds.has('task_prod'));
  assert.ok(prodConsIds.has('task_cons'));

  const filosofos = getExampleById('filosofos')!;
  const filosofosIds = new Set(filosofos.taskEvents?.map((e) => e.taskId));
  assert.ok(filosofosIds.has('task_main'));
  assert.ok(filosofosIds.has('task_f1'));
  assert.ok(filosofosIds.has('task_f2'));
  assert.ok(filosofosIds.has('task_f3'));
});
