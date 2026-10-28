import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criarBanco } from '../db.mjs';

const novo = () => criarBanco();
const lanca = (fn) => assert.throws(fn, /constraint|CHECK|UNIQUE|FOREIGN|NOT NULL/i);

const demandaValida = {
  protocolo: 'SGDC-2026-0007', sol: 1, cat: 1,
  local: 'Centro', desc: 'Descrição com mais de vinte caracteres.', cons: 1,
  t: '2026-10-20T10:00:00Z',
};
const inserir = (db, o = {}) => {
  const d = { ...demandaValida, ...o };
  return db.prepare(`INSERT INTO demanda (protocolo, solicitante_id, categoria_id, local, descricao, consentimento, criada_em, atualizada_em)
                     VALUES (?,?,?,?,?,?,?,?)`).run(d.protocolo, d.sol, d.cat, d.local, d.desc, d.cons, d.t, d.t);
};

test('o seed carrega 6 demandas, 8 categorias e histórico completo', () => {
  const db = novo();
  const n = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  assert.equal(n('demanda'), 6);
  assert.equal(n('categoria'), 8);
  assert.equal(n('historico'), 11);
});

test('chaves estrangeiras estão ativas e o banco é íntegro', () => {
  const db = novo();
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('INSERT válido funciona; protocolo duplicado é recusado', () => {
  const db = novo();
  assert.equal(inserir(db).changes, 1);
  lanca(() => inserir(db));
});

test('restrições CHECK: protocolo, descrição curta e falta de consentimento', () => {
  const db = novo();
  lanca(() => inserir(db, { protocolo: 'ABC-1' }));
  lanca(() => inserir(db, { protocolo: 'SGDC-2026-0008', desc: 'curta' }));
  lanca(() => inserir(db, { protocolo: 'SGDC-2026-0009', cons: 0 }));
});

test('chave estrangeira: solicitante, categoria e situação inexistentes são recusados', () => {
  const db = novo();
  lanca(() => inserir(db, { sol: 999 }));
  lanca(() => inserir(db, { protocolo: 'SGDC-2026-0010', cat: 999 }));
  lanca(() => db.prepare("UPDATE demanda SET situacao = 'inexistente' WHERE id = 1").run());
});

test('e-mail do solicitante: único, minúsculo e com formato válido', () => {
  const db = novo();
  const ins = (e) => db.prepare('INSERT INTO solicitante (nome, email) VALUES (?, ?)').run('Fulano de Tal', e);
  lanca(() => ins('ana.souza@exemplo.com'));
  lanca(() => ins('SEM-ARROBA'));
  lanca(() => ins('Maiuscula@Exemplo.com'));
  assert.equal(ins('novo@exemplo.com').changes, 1);
});

test('o gatilho atualiza situação e data da demanda ao registrar histórico', () => {
  const db = novo();
  db.prepare(`INSERT INTO historico (demanda_id, situacao, observacao, membro_id, registrado_em)
              VALUES (4, 'triagem', 'Palestra aceita.', 1, '2026-10-12T08:00:00Z')`).run();
  const d = db.prepare('SELECT situacao, atualizada_em FROM demanda WHERE id = 4').get();
  assert.equal(d.situacao, 'triagem');
  assert.equal(d.atualizada_em, '2026-10-12T08:00:00Z');
});

test('UPDATE de prioridade e responsável', () => {
  const db = novo();
  const r = db.prepare("UPDATE demanda SET prioridade = 'alta', responsavel_id = 2 WHERE protocolo = 'SGDC-2026-0004'").run();
  assert.equal(r.changes, 1);
  assert.equal(db.prepare('SELECT * FROM vw_indicadores').get().alta_prioridade_em_aberto, 3);
});

test('DELETE: apagar a demanda remove o histórico em cascata; solicitante com demandas não é apagado', () => {
  const db = novo();
  lanca(() => db.prepare('DELETE FROM solicitante WHERE id = 1').run());          // RESTRICT
  db.prepare("DELETE FROM demanda WHERE protocolo = 'SGDC-2026-0003'").run();
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM historico WHERE demanda_id = 3').get().n, 0);
  assert.equal(db.prepare('DELETE FROM solicitante WHERE id = 3').run().changes, 1);
});

test('views reproduzem os indicadores e a ordenação do painel da aplicação', () => {
  const db = novo();
  assert.deepEqual({ ...db.prepare('SELECT * FROM vw_indicadores').get() },
    { total: 6, aguardando_triagem: 4, em_atendimento: 1, concluidas: 1, alta_prioridade_em_aberto: 2 });
  const ordem = db.prepare('SELECT protocolo FROM vw_painel_triagem').all().map((r) => r.protocolo);
  assert.deepEqual(ordem, ['SGDC-2026-0002', 'SGDC-2026-0006', 'SGDC-2026-0001', 'SGDC-2026-0004', 'SGDC-2026-0005', 'SGDC-2026-0003']);
});

test('as consultas parametrizadas de dml.sql são sintaticamente válidas', () => {
  const db = novo();
  const texto = readFileSync(new URL('../dml.sql', import.meta.url), 'utf8');
  const comandos = texto.replace(/^--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
  assert.equal(comandos.length, 7);
  for (const c of comandos) assert.doesNotThrow(() => db.prepare(c));
});
