import { useEffect, useState } from 'react';
import { formatDateTime, normalizeProtocol, STATUSES, statusLabel } from '../lib/demands.js';
import { findByProtocol } from '../services/api.js';
import { Field, PriorityBadge, StatusBadge } from '../components/ui.jsx';

export default function Track({ initial = '' }) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState({ phase: 'idle' }); // idle | loading | found | missing | invalid

  async function search(raw) {
    if (!normalizeProtocol(raw)) {
      setState({ phase: 'invalid' });
      return;
    }
    setState({ phase: 'loading' });
    const demand = await findByProtocol(raw);
    setState(demand ? { phase: 'found', demand } : { phase: 'missing' });
  }

  // Abre direto quando chega por link (#/acompanhar/SGDC-2026-0001).
  useEffect(() => {
    if (initial) {
      setValue(initial);
      search(initial);
    } else {
      setState({ phase: 'idle' });
    }
  }, [initial]);

  const onSubmit = (event) => {
    event.preventDefault();
    search(value);
  };

  return (
    <section aria-labelledby="track-title">
      <h1 id="track-title" tabIndex={-1}>
        Acompanhar solicitação
      </h1>
      <p className="lead">Digite o protocolo recebido ao registrar a solicitação, por exemplo SGDC-2026-0001.</p>

      <form onSubmit={onSubmit} noValidate className="card search-form">
        <Field id="protocol" label="Número de protocolo" required error={state.phase === 'invalid' ? 'Protocolo em formato inválido. Use o padrão SGDC-AAAA-NNNN.' : ''}>
          {(p) => (
            <input
              {...p}
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck="false"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
        </Field>
        <button type="submit" className="btn btn-primary" disabled={state.phase === 'loading'}>
          {state.phase === 'loading' ? 'Consultando…' : 'Consultar'}
        </button>
      </form>

      <div aria-live="polite">
        {state.phase === 'missing' && (
          <div className="alert alert-warning" role="status">
            Nenhuma solicitação encontrada com esse protocolo. Confira os números e tente novamente.
          </div>
        )}
        {state.phase === 'found' && <Result demand={state.demand} />}
      </div>
    </section>
  );
}

function Result({ demand }) {
  const reached = new Set(demand.history.map((h) => h.status));
  const flow = STATUSES.filter((s) => s.id !== 'arquivada' || demand.status === 'arquivada');

  return (
    <article className="card result" aria-labelledby="result-title">
      <header className="result-head">
        <div>
          <p className="muted small">Protocolo</p>
          <h2 id="result-title" className="protocol-sm">
            {demand.protocol}
          </h2>
        </div>
        <StatusBadge status={demand.status} />
      </header>

      <dl className="details">
        <div>
          <dt>Categoria</dt>
          <dd>{demand.category}</dd>
        </div>
        <div>
          <dt>Local</dt>
          <dd>{demand.location}</dd>
        </div>
        <div>
          <dt>Registrada em</dt>
          <dd>{formatDateTime(demand.createdAt)}</dd>
        </div>
        <div>
          <dt>Prioridade</dt>
          <dd>
            <PriorityBadge priority={demand.priority} />
          </dd>
        </div>
      </dl>

      <h3>Etapas</h3>
      <ol className="progress" aria-label="Progresso do atendimento">
        {flow.map((s) => {
          const done = reached.has(s.id);
          const current = s.id === demand.status;
          return (
            <li key={s.id} className={done ? 'done' : ''} aria-current={current ? 'step' : undefined}>
              <span className="dot" aria-hidden="true">{done ? '✓' : ''}</span>
              <span>
                {s.label}
                <span className="sr-only">{done ? ' (concluída)' : ' (pendente)'}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <h3>Histórico</h3>
      <ol className="timeline">
        {[...demand.history].reverse().map((h, i) => (
          <li key={`${h.at}-${i}`}>
            <time dateTime={h.at}>{formatDateTime(h.at)}</time>
            <strong>{statusLabel(h.status)}</strong>
            <span>{h.note}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
