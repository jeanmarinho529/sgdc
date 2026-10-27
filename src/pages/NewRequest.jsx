import { useRef, useState } from 'react';
import { CATEGORIES, validateRequest } from '../lib/demands.js';
import { createDemand } from '../services/api.js';
import { Field } from '../components/ui.jsx';

const EMPTY = { name: '', email: '', phone: '', category: '', location: '', description: '', consent: false };

export default function NewRequest() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [created, setCreated] = useState(null);
  const [failure, setFailure] = useState('');
  const summaryRef = useRef(null);
  const doneRef = useRef(null);

  const set = (name) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((f) => ({ ...f, [name]: value }));
  };

  async function onSubmit(event) {
    event.preventDefault();
    setFailure('');
    const found = validateRequest(form);
    setErrors(found);
    if (Object.keys(found).length) {
      // Move o foco para o resumo de erros: leitores de tela anunciam o problema.
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setSending(true);
    try {
      const demand = await createDemand(form);
      setCreated(demand);
      requestAnimationFrame(() => doneRef.current?.focus());
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setFailure('Não foi possível registrar agora. Tente novamente em instantes.');
    } finally {
      setSending(false);
    }
  }

  if (created) {
    return (
      <section className="card success-card" aria-labelledby="done-title">
        <h1 id="done-title" ref={doneRef} tabIndex={-1}>
          Solicitação registrada
        </h1>
        <p>Guarde o número de protocolo abaixo. Ele é a única forma de acompanhar o andamento.</p>
        <p className="protocol" aria-label={`Protocolo ${created.protocol}`}>
          {created.protocol}
        </p>
        <div className="actions">
          <a className="btn btn-primary" href={`#/acompanhar/${created.protocol}`}>
            Acompanhar esta solicitação
          </a>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setForm(EMPTY);
              setErrors({});
              setCreated(null);
            }}
          >
            Registrar outra
          </button>
        </div>
      </section>
    );
  }

  const errorList = Object.entries(errors);

  return (
    <section aria-labelledby="form-title">
      <h1 id="form-title" tabIndex={-1}>
        Registrar solicitação
      </h1>
      <p className="lead">Campos marcados com * são obrigatórios.</p>

      {errorList.length > 0 && (
        <div className="alert alert-danger" role="alert" tabIndex={-1} ref={summaryRef}>
          <p>
            <strong>Corrija {errorList.length === 1 ? 'o campo abaixo' : `os ${errorList.length} campos abaixo`} para continuar:</strong>
          </p>
          <ul>
            {errorList.map(([field, message]) => (
              <li key={field}>
                <a href={`#${field}`} onClick={(e) => { e.preventDefault(); document.getElementById(field)?.focus(); }}>
                  {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {failure && (
        <div className="alert alert-danger" role="alert">
          {failure}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="card form">
        <div className="grid grid-2">
          <Field id="name" label="Nome completo" required error={errors.name}>
            {(p) => <input {...p} type="text" autoComplete="name" value={form.name} onChange={set('name')} />}
          </Field>
          <Field id="email" label="E-mail" required error={errors.email}>
            {(p) => <input {...p} type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set('email')} />}
          </Field>
          <Field id="phone" label="Telefone / WhatsApp" hint="DDD + número." error={errors.phone}>
            {(p) => <input {...p} type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set('phone')} />}
          </Field>
          <Field id="location" label="Bairro ou local da demanda" required error={errors.location}>
            {(p) => <input {...p} type="text" value={form.location} onChange={set('location')} />}
          </Field>
        </div>

        <Field id="category" label="Categoria" required error={errors.category}>
          {(p) => (
            <select {...p} value={form.category} onChange={set('category')}>
              <option value="">Selecione…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          id="description"
          label="Descreva a necessidade"
          required
          hint="Conte o que acontece, quem é afetado e o que seria uma boa solução. Mínimo de 20 caracteres."
          error={errors.description}
        >
          {(p) => <textarea {...p} rows={5} value={form.description} onChange={set('description')} />}
        </Field>
        <p className="counter" aria-live="polite">
          {form.description.trim().length} caracteres
        </p>

        <div className="field">
          <label className="check">
            <input
              id="consent"
              type="checkbox"
              checked={form.consent}
              onChange={set('consent')}
              aria-required="true"
              aria-invalid={errors.consent ? 'true' : undefined}
              aria-describedby={errors.consent ? 'consent-error' : undefined}
            />
            <span>
              Concordo que meus dados sejam usados apenas para o atendimento desta solicitação pelos projetos de extensão da UFMS
              (LGPD). <span className="req" aria-hidden="true">*</span>
            </span>
          </label>
          {errors.consent && (
            <p id="consent-error" className="error-text">
              <span aria-hidden="true">⚠ </span>
              {errors.consent}
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={sending}>
          {sending ? 'Enviando…' : 'Enviar solicitação'}
        </button>
      </form>
    </section>
  );
}
