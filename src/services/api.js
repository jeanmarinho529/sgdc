// Camada de serviço: simula uma API REST assíncrona sobre o localStorage.
// Toda a interface depende apenas destas funções. Ao conectar um back-end real,
// basta trocar o corpo de cada uma por uma chamada fetch() mantendo a assinatura.
import { applyUpdate, buildDemand, normalizeProtocol, validateRequest } from '../lib/demands.js';
import { buildSeed } from './seed.js';

const KEY = 'sgdc.demands.v1';
const LATENCY_MS = 250;

const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage indisponível ou corrompido: cai para os dados de demonstração */
  }
  const seed = buildSeed();
  write(seed);
  return seed;
}

function write(demands) {
  try {
    localStorage.setItem(KEY, JSON.stringify(demands));
  } catch {
    /* modo privado: os dados valem apenas enquanto a página estiver aberta */
  }
}

/** GET /demandas */
export async function listDemands() {
  return wait(read());
}

/** GET /demandas/:protocolo. Retorna null se não existir ou se o formato for inválido. */
export async function findByProtocol(input) {
  const protocol = normalizeProtocol(input);
  if (!protocol) return wait(null);
  return wait(read().find((d) => d.protocol === protocol) ?? null);
}

/** POST /demandas. Valida novamente (nunca confie só no front) e devolve a demanda criada. */
export async function createDemand(data) {
  const errors = validateRequest(data);
  if (Object.keys(errors).length) throw Object.assign(new Error('Dados inválidos'), { errors });
  const all = read();
  const demand = buildDemand(data, all);
  write([...all, demand]);
  return wait(demand);
}

/** PATCH /demandas/:protocolo */
export async function updateDemand(protocol, changes) {
  const all = read();
  const index = all.findIndex((d) => d.protocol === protocol);
  if (index === -1) throw new Error('Demanda não encontrada');
  const updated = applyUpdate(all[index], changes);
  const next = [...all];
  next[index] = updated;
  write(next);
  return wait(updated);
}

/** Restaura os dados fictícios de demonstração. */
export async function resetDemoData() {
  const seed = buildSeed();
  write(seed);
  return wait(seed);
}
