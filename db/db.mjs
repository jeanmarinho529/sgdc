// Utilitário: cria um banco SQLite (em memória ou em arquivo) a partir dos scripts .sql.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
export const sql = (nome) => readFileSync(join(dir, nome), 'utf8');

export function criarBanco(arquivo = ':memory:', { comDados = true } = {}) {
  const db = new DatabaseSync(arquivo);
  db.exec(sql('schema.sql'));
  if (comDados) db.exec(sql('seed.sql'));
  return db;
}

/** Divide consultas.sql em blocos { id, titulo, sql } pelos comentários "-- Qn: título". */
export function lerConsultas() {
  const blocos = [];
  let atual = null;
  for (const linha of sql('consultas.sql').split('\n')) {
    const m = /^-- (Q\d+): (.*)$/.exec(linha);
    if (m) { atual = { id: m[1], titulo: m[2], sql: '' }; blocos.push(atual); }
    else if (atual) atual.sql += linha + '\n';
  }
  return blocos.map((b) => ({ ...b, sql: b.sql.trim() }));
}
