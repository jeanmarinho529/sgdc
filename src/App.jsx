import { useEffect, useRef } from 'react';
import { useHashRoute } from './lib/useHashRoute.js';
import Home from './pages/Home.jsx';
import NewRequest from './pages/NewRequest.jsx';
import Track from './pages/Track.jsx';
import Admin from './pages/Admin.jsx';

const NAV = [
  { to: '/', name: '', label: 'Início' },
  { to: '/nova', name: 'nova', label: 'Nova solicitação' },
  { to: '/acompanhar', name: 'acompanhar', label: 'Acompanhar' },
  { to: '/admin', name: 'admin', label: 'Equipe' },
];

const TITLES = { '': 'Início', nova: 'Nova solicitação', acompanhar: 'Acompanhar', admin: 'Painel da equipe' };

export default function App() {
  const route = useHashRoute();
  const mainRef = useRef(null);
  const first = useRef(true);

  // A cada troca de página: atualiza o título e leva o foco ao conteúdo (navegação por teclado e leitores de tela).
  useEffect(() => {
    document.title = `${TITLES[route.name] ?? 'Página não encontrada'} · SGDC`;
    if (first.current) {
      first.current = false;
      return;
    }
    mainRef.current?.focus();
    window.scrollTo(0, 0);
  }, [route.name]);

  let page;
  switch (route.name) {
    case '':
      page = <Home />;
      break;
    case 'nova':
      page = <NewRequest />;
      break;
    case 'acompanhar':
      page = <Track initial={route.param} />;
      break;
    case 'admin':
      page = <Admin />;
      break;
    default:
      page = (
        <section>
          <h1>Página não encontrada</h1>
          <p>
            <a href="#/">Voltar ao início</a>
          </p>
        </section>
      );
  }

  return (
    <>
      <a className="skip-link" href="#conteudo" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <div className="container bar">
          <a href="#/" className="brand">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span>
              SGDC
              <small>Gestão de Demandas Comunitárias</small>
            </span>
          </a>
          <nav aria-label="Principal">
            <ul className="nav">
              {NAV.map((item) => (
                <li key={item.to}>
                  <a href={`#${item.to}`} aria-current={route.name === item.name ? 'page' : undefined}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} ref={mainRef} className="container main">
        {page}
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>
            SGDC · Projeto Integrador de Tecnologia da Informação II · Programa de Extensão UFMS Digital. Os dados exibidos
            são fictícios e ficam apenas neste navegador.
          </p>
        </div>
      </footer>
    </>
  );
}
