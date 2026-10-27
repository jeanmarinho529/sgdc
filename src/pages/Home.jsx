export default function Home() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title" tabIndex={-1}>
          Uma porta única para as demandas da comunidade
        </h1>
        <p className="lead">
          Registre uma solicitação aos projetos de extensão da UFMS, receba um número de protocolo e acompanhe cada etapa do
          atendimento, sem depender de planilhas ou de trocas de e-mail.
        </p>
        <div className="actions">
          <a className="btn btn-primary btn-lg" href="#/nova">
            Registrar solicitação
          </a>
          <a className="btn btn-outline btn-lg" href="#/acompanhar">
            Acompanhar por protocolo
          </a>
        </div>
      </section>

      <section aria-labelledby="how-title" className="section">
        <h2 id="how-title">Como funciona</h2>
        <ol className="steps">
          <li>
            <span className="step-n" aria-hidden="true">1</span>
            <h3>Você registra</h3>
            <p>Preencha o formulário com a categoria, o local e a descrição da necessidade. Leva cerca de dois minutos.</p>
          </li>
          <li>
            <span className="step-n" aria-hidden="true">2</span>
            <h3>A equipe faz a triagem</h3>
            <p>Coordenadores avaliam, definem a prioridade e encaminham ao projeto de extensão mais adequado.</p>
          </li>
          <li>
            <span className="step-n" aria-hidden="true">3</span>
            <h3>Você acompanha</h3>
            <p>Com o protocolo, consulte a situação e o histórico da sua demanda quando quiser.</p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="who-title" className="section">
        <h2 id="who-title">Para quem é</h2>
        <div className="grid grid-2">
          <article className="card">
            <h3>Comunidade externa</h3>
            <p>Moradores, lideranças e associações que precisam de apoio dos projetos de extensão.</p>
          </article>
          <article className="card">
            <h3>Comunidade acadêmica</h3>
            <p>Docentes coordenadores e estudantes que organizam e executam as ações com mais visibilidade e menos retrabalho.</p>
          </article>
        </div>
      </section>
    </>
  );
}
