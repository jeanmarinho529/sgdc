# SGDC · Sistema de Gestão de Demandas Comunitárias

Aplicação web desenvolvida para o **Programa de Extensão UFMS Digital** (Projeto Integrador de Tecnologia da Informação II, Módulo 2: Desenvolvimento Web com frameworks e HTML/CSS).

O SGDC centraliza as solicitações da comunidade externa e acadêmica aos projetos de extensão da UFMS: quem precisa de apoio registra a demanda, recebe um **protocolo** e acompanha o andamento; a equipe faz a **triagem** em um painel.

## Funcionalidades

| Página | Rota | O que faz |
| --- | --- | --- |
| Início | `#/` | Apresenta o sistema e o fluxo de atendimento |
| Nova solicitação | `#/nova` | Formulário com validação, resumo de erros e geração de protocolo (`SGDC-AAAA-NNNN`) |
| Acompanhar | `#/acompanhar/<protocolo>` | Consulta por protocolo, com etapas e histórico |
| Equipe | `#/admin` | Login, indicadores, filtros, busca e atualização de situação/prioridade |

## Tecnologias

- **React 19**: componentes e estado da interface
- **esbuild**: empacotamento (JSX → JavaScript) sem configuração complexa
- **HTML5 semântico + CSS3**: layout responsivo *mobile-first* com Flexbox, Grid e variáveis CSS (sem biblioteca de estilos)
- **Node.js test runner**: testes unitários das regras de negócio

## Como executar

Requisitos: Node.js 20 ou superior.

```bash
npm install        # instala react, react-dom e esbuild
npm test           # roda os testes unitários
npm run dev        # desenvolvimento em http://localhost:5173
npm run build      # gera a pasta dist/ (hospedagem estática)
```

Para publicar no GitHub Pages, envie o conteúdo de `dist/` (os caminhos são relativos e o roteamento usa `#`, então funciona em qualquer subpasta).

**Acesso da equipe (demonstração):** senha `extensao2026`. Como não há servidor, essa proteção **não é segura**; em produção o login deve ser feito no back-end (por exemplo, com o login institucional da UFMS).

## Estrutura

```
src/
  lib/            regras de negócio puras (validação, protocolo, filtros) + testes
  services/       API simulada sobre localStorage (api.js) e dados fictícios (seed.js)
  components/     componentes reutilizáveis (campo de formulário, etiquetas)
  pages/          Home, NewRequest, Track, Admin
  styles.css      estilos responsivos
scripts/build.cjs script de build/servidor de desenvolvimento
public/index.html
```

## Decisões de projeto

1. **Regras fora dos componentes.** `src/lib/demands.js` não depende de React nem do navegador; por isso é testável isoladamente.
2. **API simulada com a mesma forma de uma API REST.** `listDemands`, `findByProtocol`, `createDemand` e `updateDemand` são assíncronas. Trocar `localStorage` por `fetch()` não exige mexer nas páginas.
3. **Validação nos dois lados.** O formulário valida para orientar o usuário; `createDemand` valida de novo.
4. **Acessibilidade desde o início:** link "Pular para o conteúdo", landmarks (`header`, `nav`, `main`, `footer`), `label` em todos os campos, erros ligados por `aria-describedby`, resumo de erros que recebe o foco, `aria-live` nos resultados, foco visível, alvos de toque de 44 px, respeito a `prefers-reduced-motion` e contraste mínimo de 4,5:1 no texto.
5. **Tabela que vira cartões no celular**, com rótulos por `data-label`, evitando rolagem horizontal.
6. **Roteamento por hash** para funcionar em hospedagem estática sem configuração de servidor.
7. **LGPD:** o formulário pede consentimento explícito e coleta só o necessário.

## Limitações conhecidas

- Os dados ficam no navegador de cada pessoa (não há banco de dados nem back-end).
- A autenticação é demonstrativa.
- Não há envio de e-mail/SMS de notificação.

Todos os nomes, e-mails e relatos dos dados de demonstração são fictícios.
