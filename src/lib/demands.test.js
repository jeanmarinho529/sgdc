import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nextProtocol,
  normalizeProtocol,
  validateRequest,
  buildDemand,
  applyUpdate,
  filterDemands,
  sortForTriage,
  summarize,
} from './demands.js';

const valid = {
  name: 'Maria da Silva',
  email: 'maria@exemplo.com',
  phone: '(67) 99999-1234',
  category: 'Educação e reforço escolar',
  location: 'Bairro Universitário',
  description: 'Precisamos de oficinas de informática para jovens do bairro.',
  consent: true,
};
const NOW = new Date('2026-03-10T12:00:00Z');

test('nextProtocol começa em 0001 e incrementa dentro do ano', () => {
  assert.equal(nextProtocol([], NOW), 'SGDC-2026-0001');
  assert.equal(nextProtocol([{ protocol: 'SGDC-2026-0007' }, { protocol: 'SGDC-2025-0099' }], NOW), 'SGDC-2026-0008');
});

test('normalizeProtocol aceita variações e rejeita lixo', () => {
  assert.equal(normalizeProtocol(' sgdc-2026-1 '), 'SGDC-2026-0001');
  assert.equal(normalizeProtocol('SGDC-2026-0042'), 'SGDC-2026-0042');
  assert.equal(normalizeProtocol('abc'), null);
  assert.equal(normalizeProtocol(''), null);
});

test('validateRequest aprova dados corretos', () => {
  assert.deepEqual(validateRequest(valid), {});
});

test('validateRequest aponta cada campo inválido', () => {
  const errors = validateRequest({ name: 'Al', email: 'x', phone: '123', category: '', location: '', description: 'curto', consent: false });
  assert.deepEqual(Object.keys(errors).sort(), ['category', 'consent', 'description', 'email', 'location', 'name', 'phone']);
});

test('telefone é opcional', () => {
  assert.deepEqual(validateRequest({ ...valid, phone: '' }), {});
});

test('buildDemand cria protocolo, status inicial e histórico', () => {
  const d = buildDemand({ ...valid, email: ' MARIA@Exemplo.com ' }, [], NOW);
  assert.equal(d.protocol, 'SGDC-2026-0001');
  assert.equal(d.status, 'recebida');
  assert.equal(d.email, 'maria@exemplo.com');
  assert.equal(d.history.length, 1);
});

test('applyUpdate registra mudança de status no histórico e não altera o original', () => {
  const d = buildDemand(valid, [], NOW);
  const u = applyUpdate(d, { status: 'triagem', priority: 'alta', note: 'Enviada ao coordenador.' }, new Date('2026-03-11T09:00:00Z'));
  assert.equal(u.status, 'triagem');
  assert.equal(u.priority, 'alta');
  assert.equal(u.history.length, 2);
  assert.equal(d.history.length, 1);
});

test('applyUpdate sem mudança nem nota não polui o histórico', () => {
  const d = buildDemand(valid, [], NOW);
  const u = applyUpdate(d, { status: 'recebida', priority: 'baixa', note: '  ' }, NOW);
  assert.equal(u.history.length, 1);
  assert.equal(u.priority, 'baixa');
});

test('filterDemands combina status, categoria e busca textual', () => {
  const a = buildDemand(valid, [], NOW);
  const b = applyUpdate(buildDemand({ ...valid, category: 'Meio ambiente', location: 'Centro' }, [a], NOW), { status: 'concluida' }, NOW);
  const all = [a, b];
  assert.equal(filterDemands(all, { status: 'concluida' }).length, 1);
  assert.equal(filterDemands(all, { category: 'Meio ambiente' })[0].protocol, b.protocol);
  assert.equal(filterDemands(all, { query: 'universitário' }).length, 1);
  assert.equal(filterDemands(all, {}).length, 2);
});

test('sortForTriage põe abertas e de maior prioridade primeiro', () => {
  const a = applyUpdate(buildDemand(valid, [], NOW), { priority: 'baixa' }, NOW);
  const b = applyUpdate(buildDemand(valid, [a], NOW), { priority: 'alta' }, NOW);
  const c = applyUpdate(buildDemand(valid, [a, b], NOW), { status: 'concluida' }, NOW);
  assert.deepEqual(sortForTriage([c, a, b]).map((d) => d.protocol), [b.protocol, a.protocol, c.protocol]);
});

test('summarize conta por situação', () => {
  const a = buildDemand(valid, [], NOW);
  const b = applyUpdate(buildDemand(valid, [a], NOW), { status: 'atendimento', priority: 'alta' }, NOW);
  const c = applyUpdate(buildDemand(valid, [a, b], NOW), { status: 'concluida' }, NOW);
  assert.deepEqual(summarize([a, b, c]), { total: 3, pending: 1, inProgress: 1, done: 1, highPriorityOpen: 1 });
});
