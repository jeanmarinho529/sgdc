-- SGDC · Esquema do banco de dados (SQLite 3)
-- Entidades: solicitante, membro_equipe, categoria, situacao, prioridade, demanda, historico.
-- Normalização: 3FN (dados do solicitante, categoria, situação e prioridade em tabelas próprias).

PRAGMA foreign_keys = ON;

-- Tabelas de domínio (valores controlados) ---------------------------------

CREATE TABLE categoria (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome  TEXT    NOT NULL UNIQUE CHECK (length(trim(nome)) >= 3)
);

CREATE TABLE situacao (
  codigo  TEXT    PRIMARY KEY,                 -- recebida, triagem, atendimento, concluida, arquivada
  rotulo  TEXT    NOT NULL UNIQUE,
  ordem   INTEGER NOT NULL UNIQUE,
  aberta  INTEGER NOT NULL CHECK (aberta IN (0, 1))
);

CREATE TABLE prioridade (
  codigo  TEXT    PRIMARY KEY,                 -- baixa, media, alta
  rotulo  TEXT    NOT NULL UNIQUE,
  peso    INTEGER NOT NULL UNIQUE              -- 0 = mais urgente (usado na ordenação)
);

-- Pessoas ------------------------------------------------------------------

CREATE TABLE solicitante (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nome      TEXT NOT NULL CHECK (length(trim(nome)) >= 3),
  email     TEXT NOT NULL UNIQUE CHECK (email LIKE '%_@_%._%' AND email = lower(email)),
  telefone  TEXT CHECK (telefone IS NULL OR length(telefone) >= 10)
);

CREATE TABLE membro_equipe (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nome   TEXT NOT NULL CHECK (length(trim(nome)) >= 3),
  email  TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
  papel  TEXT NOT NULL CHECK (papel IN ('docente', 'bolsista'))
);

-- Demandas -----------------------------------------------------------------

CREATE TABLE demanda (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  protocolo       TEXT    NOT NULL UNIQUE
                  CHECK (protocolo GLOB 'SGDC-[0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]'),
  solicitante_id  INTEGER NOT NULL REFERENCES solicitante(id)   ON DELETE RESTRICT,
  categoria_id    INTEGER NOT NULL REFERENCES categoria(id)     ON DELETE RESTRICT,
  responsavel_id  INTEGER          REFERENCES membro_equipe(id) ON DELETE SET NULL,
  local           TEXT    NOT NULL CHECK (length(trim(local)) >= 2),
  descricao       TEXT    NOT NULL CHECK (length(trim(descricao)) >= 20),
  situacao        TEXT    NOT NULL DEFAULT 'recebida' REFERENCES situacao(codigo),
  prioridade      TEXT    NOT NULL DEFAULT 'media'    REFERENCES prioridade(codigo),
  consentimento   INTEGER NOT NULL CHECK (consentimento = 1),   -- LGPD: sem consentimento não há registro
  criada_em       TEXT    NOT NULL,                              -- ISO 8601 (UTC)
  atualizada_em   TEXT    NOT NULL,
  CHECK (atualizada_em >= criada_em)
);

CREATE INDEX idx_demanda_situacao   ON demanda(situacao);
CREATE INDEX idx_demanda_categoria  ON demanda(categoria_id);
CREATE INDEX idx_demanda_solicit    ON demanda(solicitante_id);

CREATE TABLE historico (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  demanda_id     INTEGER NOT NULL REFERENCES demanda(id) ON DELETE CASCADE,
  situacao       TEXT    NOT NULL REFERENCES situacao(codigo),
  observacao     TEXT    NOT NULL,
  membro_id      INTEGER REFERENCES membro_equipe(id) ON DELETE SET NULL,  -- NULL = ação do solicitante
  registrado_em  TEXT    NOT NULL
);

CREATE INDEX idx_historico_demanda ON historico(demanda_id, registrado_em);

-- Regra de negócio no banco: cada novo registro de histórico atualiza a demanda ------

CREATE TRIGGER trg_historico_atualiza_demanda
AFTER INSERT ON historico
BEGIN
  UPDATE demanda
     SET situacao      = NEW.situacao,
         atualizada_em = NEW.registrado_em
   WHERE id = NEW.demanda_id;
END;

-- Visões usadas pela aplicação --------------------------------------------------------

CREATE VIEW vw_painel_triagem AS
SELECT d.protocolo,
       s.nome        AS solicitante,
       c.nome        AS categoria,
       d.local,
       st.rotulo     AS situacao,
       p.rotulo      AS prioridade,
       d.criada_em,
       d.atualizada_em
  FROM demanda d
  JOIN solicitante s ON s.id = d.solicitante_id
  JOIN categoria   c ON c.id = d.categoria_id
  JOIN situacao   st ON st.codigo = d.situacao
  JOIN prioridade  p ON p.codigo = d.prioridade
 ORDER BY st.aberta DESC, p.peso ASC, d.criada_em ASC;

CREATE VIEW vw_indicadores AS
SELECT COUNT(*)                                                         AS total,
       SUM(situacao IN ('recebida', 'triagem'))                         AS aguardando_triagem,
       SUM(situacao = 'atendimento')                                    AS em_atendimento,
       SUM(situacao = 'concluida')                                      AS concluidas,
       SUM(prioridade = 'alta' AND situacao NOT IN ('concluida','arquivada')) AS alta_prioridade_em_aberto
  FROM demanda;
