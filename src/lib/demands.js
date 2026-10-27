// Regras de negócio do SGDC. Funções puras (sem acesso a DOM ou storage),
// o que permite testá-las com o test runner nativo do Node.

export const CATEGORIES = [
  'Saúde e bem-estar',
  'Educação e reforço escolar',
  'Tecnologia e inclusão digital',
  'Meio ambiente',
  'Infraestrutura comunitária',
  'Cultura, esporte e lazer',
  'Assistência social',
  'Outros',
];

export const STATUSES = [
  { id: 'recebida', label: 'Recebida', tone: 'info' },
  { id: 'triagem', label: 'Em triagem', tone: 'warning' },
  { id: 'atendimento', label: 'Em atendimento', tone: 'primary' },
  { id: 'concluida', label: 'Concluída', tone: 'success' },
  { id: 'arquivada', label: 'Arquivada', tone: 'muted' },
];

export const PRIORITIES = [
  { id: 'baixa', label: 'Baixa' },
  { id: 'media', label: 'Média' },
  { id: 'alta', label: 'Alta' },
];

export const statusLabel = (id) => STATUSES.find((s) => s.id === id)?.label ?? id;
export const statusTone = (id) => STATUSES.find((s) => s.id === id)?.tone ?? 'muted';
export const priorityLabel = (id) => PRIORITIES.find((p) => p.id === id)?.label ?? id;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PROTOCOL_RE = /^SGDC-(\d{4})-(\d{1,4})$/;

/** Gera o próximo protocolo do ano: SGDC-AAAA-NNNN. */
export function nextProtocol(demands, now = new Date()) {
  const prefix = `SGDC-${now.getFullYear()}-`;
  const max = demands
    .filter((d) => d.protocol.startsWith(prefix))
    .reduce((m, d) => Math.max(m, parseInt(d.protocol.slice(prefix.length), 10) || 0), 0);
  return prefix + String(max + 1).padStart(4, '0');
}

/** Aceita "sgdc-2026-1", " SGDC-2026-0001 " etc. e devolve o formato canônico (ou null). */
export function normalizeProtocol(input) {
  const match = PROTOCOL_RE.exec(String(input ?? '').trim().toUpperCase().replace(/\s+/g, ''));
  if (!match) return null;
  return `SGDC-${match[1]}-${match[2].padStart(4, '0')}`;
}

/** Valida o formulário público. Retorna { campo: mensagem } (objeto vazio = válido). */
export function validateRequest(data) {
  const errors = {};
  if (!data.name || data.name.trim().length < 3) errors.name = 'Informe seu nome completo (mínimo de 3 caracteres).';
  if (!data.email || !EMAIL_RE.test(data.email.trim())) errors.email = 'Informe um e-mail válido, por exemplo nome@dominio.com.';
  if (data.phone && data.phone.replace(/\D/g, '').length < 10)
    errors.phone = 'Telefone inválido. Use DDD + número, ou deixe o campo em branco.';
  if (!CATEGORIES.includes(data.category)) errors.category = 'Escolha uma categoria.';
  if (!data.location || data.location.trim().length < 2) errors.location = 'Informe o bairro ou local da demanda.';
  if (!data.description || data.description.trim().length < 20)
    errors.description = 'Descreva a demanda com pelo menos 20 caracteres.';
  if (!data.consent) errors.consent = 'É necessário concordar com o uso dos dados para registrar a solicitação.';
  return errors;
}

/** Cria o registro de uma nova demanda já com protocolo e primeiro item do histórico. */
export function buildDemand(data, existing, now = new Date()) {
  const at = now.toISOString();
  return {
    protocol: nextProtocol(existing, now),
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: (data.phone ?? '').trim(),
    category: data.category,
    location: data.location.trim(),
    description: data.description.trim(),
    status: 'recebida',
    priority: 'media',
    createdAt: at,
    updatedAt: at,
    history: [{ status: 'recebida', at, note: 'Solicitação registrada pelo solicitante.' }],
  };
}

/** Aplica uma atualização feita pela equipe, preservando o histórico. */
export function applyUpdate(demand, { status, priority, note }, now = new Date()) {
  const at = now.toISOString();
  const statusChanged = status && status !== demand.status;
  const history = statusChanged || note?.trim()
    ? [...demand.history, { status: status ?? demand.status, at, note: note?.trim() || `Status alterado para ${statusLabel(status)}.` }]
    : demand.history;
  return { ...demand, status: status ?? demand.status, priority: priority ?? demand.priority, updatedAt: at, history };
}

export function filterDemands(demands, { status = '', category = '', query = '' } = {}) {
  const q = query.trim().toLowerCase();
  return demands.filter((d) => {
    if (status && d.status !== status) return false;
    if (category && d.category !== category) return false;
    if (!q) return true;
    return [d.protocol, d.name, d.location, d.description].some((v) => v.toLowerCase().includes(q));
  });
}

const PRIORITY_ORDER = { alta: 0, media: 1, baixa: 2 };

/** Ordena: abertas primeiro, depois por prioridade e por data (mais antigas primeiro entre as abertas). */
export function sortForTriage(demands) {
  const isClosed = (d) => d.status === 'concluida' || d.status === 'arquivada';
  return [...demands].sort((a, b) => {
    if (isClosed(a) !== isClosed(b)) return isClosed(a) ? 1 : -1;
    if (!isClosed(a) && PRIORITY_ORDER[a.priority] !== PRIORITY_ORDER[b.priority])
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    return isClosed(a) ? b.updatedAt.localeCompare(a.updatedAt) : a.createdAt.localeCompare(b.createdAt);
  });
}

export function summarize(demands) {
  const count = (...ids) => demands.filter((d) => ids.includes(d.status)).length;
  return {
    total: demands.length,
    pending: count('recebida', 'triagem'),
    inProgress: count('atendimento'),
    done: count('concluida'),
    highPriorityOpen: demands.filter((d) => d.priority === 'alta' && !['concluida', 'arquivada'].includes(d.status)).length,
  };
}

export function formatDateTime(iso) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
}
