import { useEffect, useMemo, useState } from 'react';
import {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  filterDemands,
  formatDateTime,
  sortForTriage,
  summarize,
} from '../lib/demands.js';
import { listDemands, resetDemoData, updateDemand } from '../services/api.js';
import { Field, PriorityBadge, StatusBadge } from '../components/ui.jsx';

// ATENÇÃO: autenticação apenas demonstrativa. Sem back-end, qualquer senha no front-end é pública.
// Em produção, o login deve ser feito no servidor (ex.: SSO institucional da UFMS).
const DEMO_PASSWORD = 'extensao2026';
const SESSION_KEY = 'sgdc.admin';

const isLogged = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
};

export default function Admin() {
  const [logged, setLogged] = useState(isLogged);
  if (!logged) return <Login onSuccess={() => setLogged(true)} />;
  return (
    <Dashboard
      onLogout={() => {
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch {
          /* ignore */
        }
        setLogged(false);
      }}
    />
  );
}

function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = (event) => {
    event.preventDefault();
    if (password === DEMO_PASSWORD) {
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* ignore */
      }
      onSuccess();
    } else {
      setError('Senha incorreta.');
    }
  };

  return (
    <section aria-labelledby="login-title" className="narrow">
      <h1 id="login-title" tabIndex={-1}>
        Acesso da equipe
      </h1>
      <p className="lead">Área para coordenadores e bolsistas fazerem a triagem das solicitações.</p>
      <form onSubmit={onSubmit} noValidate className="card form">
        <Field id="admin-password" label="Senha" required error={error}>
          {(p) => <input {...p} type="password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} />}
        </Field>
        <button type="submit" className="btn btn-primary">
          Entrar
        </button>
        <p className="hint demo-note">
          Versão de demonstração: use a senha <code>{DEMO_PASSWORD}</code>. Não há servidor, então esta proteção não é segura.
        </p>
      </form>
    </section>
  );
}

function Dashboard({ onLogout }) {
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', query: '' });
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    listDemands().then((d) => {
      setDemands(d);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => summarize(demands), [demands]);
  const rows = useMemo(() => sortForTriage(filterDemands(demands, filters)), [demands, filters]);
  const current = demands.find((d) => d.protocol === selected) ?? null;

  const setFilter = (name) => (event) => setFilters((f) => ({ ...f, [name]: event.target.value }));

  async function save(protocol, changes) {
    const updated = await updateDemand(protocol, changes);
    setDemands((all) => all.map((d) => (d.protocol === protocol ? updated : d)));
    setMessage(`Demanda ${protocol} atualizada.`);
  }

  async function reset() {
    if (!window.confirm('Restaurar os dados fictícios de demonstração? As solicitações atuais serão apagadas.')) return;
    setDemands(await resetDemoData());
    setSelected(null);
    setMessage('Dados de demonstração restaurados.');
  }

  return (
    <section aria-labelledby="admin-title">
      <div className="page-head">
        <h1 id="admin-title" tabIndex={-1}>
          Painel de triagem
        </h1>
        <div className="actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={reset}>
            Restaurar dados de demonstração
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={onLogout}>
            Sair
          </button>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {message}
      </p>
      {message && (
        <div className="alert alert-success" aria-hidden="true">
          {message}
        </div>
      )}

      <ul className="kpis" aria-label="Indicadores">
        <li className="kpi">
          <span className="kpi-n">{stats.total}</span>
          <span className="kpi-l">Total de demandas</span>
        </li>
        <li className="kpi">
          <span className="kpi-n">{stats.pending}</span>
          <span className="kpi-l">Aguardando triagem</span>
        </li>
        <li className="kpi">
          <span className="kpi-n">{stats.inProgress}</span>
          <span className="kpi-l">Em atendimento</span>
        </li>
        <li className="kpi">
          <span className="kpi-n">{stats.done}</span>
          <span className="kpi-l">Concluídas</span>
        </li>
        <li className="kpi kpi-alert">
          <span className="kpi-n">{stats.highPriorityOpen}</span>
          <span className="kpi-l">Alta prioridade em aberto</span>
        </li>
      </ul>

      <form className="card filters" role="search" aria-label="Filtrar demandas" onSubmit={(e) => e.preventDefault()}>
        <Field id="f-query" label="Buscar" hint="Protocolo, nome, local ou texto.">
          {(p) => <input {...p} type="search" value={filters.query} onChange={setFilter('query')} />}
        </Field>
        <Field id="f-status" label="Situação">
          {(p) => (
            <select {...p} value={filters.status} onChange={setFilter('status')}>
              <option value="">Todas</option>
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field id="f-category" label="Categoria">
          {(p) => (
            <select {...p} value={filters.category} onChange={setFilter('category')}>
              <option value="">Todas</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </Field>
      </form>

      <p className="muted small" aria-live="polite">
        {loading ? 'Carregando…' : `${rows.length} de ${demands.length} demandas`}
      </p>

      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">Demandas ordenadas por situação e prioridade</caption>
          <thead>
            <tr>
              <th scope="col">Protocolo</th>
              <th scope="col">Solicitante</th>
              <th scope="col">Categoria</th>
              <th scope="col">Prioridade</th>
              <th scope="col">Situação</th>
              <th scope="col">Atualizada</th>
              <th scope="col">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.protocol} className={d.protocol === selected ? 'selected' : ''}>
                <th scope="row" data-label="Protocolo">
                  {d.protocol}
                </th>
                <td data-label="Solicitante">
                  {d.name}
                  <span className="muted small block">{d.location}</span>
                </td>
                <td data-label="Categoria">{d.category}</td>
                <td data-label="Prioridade">
                  <PriorityBadge priority={d.priority} />
                </td>
                <td data-label="Situação">
                  <StatusBadge status={d.status} />
                </td>
                <td data-label="Atualizada">{formatDateTime(d.updatedAt)}</td>
                <td data-label="">
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => setSelected(d.protocol)} aria-label={`Gerenciar ${d.protocol}`}>
                    Gerenciar
                  </button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  Nenhuma demanda encontrada com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {current && <ManagePanel key={current.protocol} demand={current} onSave={save} onClose={() => setSelected(null)} />}
    </section>
  );
}

function ManagePanel({ demand, onSave, onClose }) {
  const [status, setStatus] = useState(demand.status);
  const [priority, setPriority] = useState(demand.priority);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    await onSave(demand.protocol, { status, priority, note });
    setNote('');
    setSaving(false);
  }

  return (
    <aside className="card manage" aria-labelledby="manage-title">
      <div className="page-head">
        <h2 id="manage-title" tabIndex={-1} ref={(el) => el?.focus()}>
          {demand.protocol}
        </h2>
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
          Fechar
        </button>
      </div>

      <p>
        <strong>{demand.name}</strong> · {demand.email}
        {demand.phone && <> · {demand.phone}</>}
      </p>
      <p className="muted small">
        {demand.category} · {demand.location}
      </p>
      <blockquote>{demand.description}</blockquote>

      <form onSubmit={submit} noValidate>
        <div className="grid grid-2">
          <Field id="m-status" label="Situação" required>
            {(p) => (
              <select {...p} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="m-priority" label="Prioridade" required>
            {(p) => (
              <select {...p} value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <Field id="m-note" label="Observação para o histórico" hint="Aparece para o solicitante na consulta por protocolo.">
          {(p) => <textarea {...p} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </form>

      <h3>Histórico</h3>
      <ol className="timeline">
        {[...demand.history].reverse().map((h, i) => (
          <li key={`${h.at}-${i}`}>
            <time dateTime={h.at}>{formatDateTime(h.at)}</time>
            <strong>{STATUSES.find((s) => s.id === h.status)?.label}</strong>
            <span>{h.note}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
