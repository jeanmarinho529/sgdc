// Uso: node db/run.mjs [--json]   → cria o banco, aplica schema+seed e executa as consultas.
import { criarBanco, lerConsultas } from './db.mjs';

const db = criarBanco();
const saida = lerConsultas().map((q) => ({ ...q, linhas: db.prepare(q.sql).all() }));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(saida, null, 2));
} else {
  for (const q of saida) {
    console.log(`\n${q.id}: ${q.titulo}`);
    console.table(q.linhas);
  }
}
