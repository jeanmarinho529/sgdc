import { statusLabel, statusTone } from '../lib/demands.js';

/** Campo de formulário acessível: label associado, descrição e erro ligados por aria-describedby. */
export function Field({ id, label, hint, error, required, children }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? <span className="req" aria-hidden="true"> *</span> : <span className="opt"> (opcional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      )}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? 'true' : undefined, 'aria-required': required ? 'true' : undefined })}
      {error && (
        <p id={`${id}-error`} className="error-text">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge badge-${statusTone(status)}`}>{statusLabel(status)}</span>;
}

export function PriorityBadge({ priority }) {
  const label = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }[priority] ?? priority;
  return <span className={`prio prio-${priority}`}>{label}</span>;
}
