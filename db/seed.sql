-- SGDC · Dados FICTÍCIOS de demonstração (nomes, e-mails e relatos inventados).

INSERT INTO categoria (nome) VALUES
  ('Saúde e bem-estar'), ('Educação e reforço escolar'), ('Tecnologia e inclusão digital'),
  ('Meio ambiente'), ('Infraestrutura comunitária'), ('Cultura, esporte e lazer'),
  ('Assistência social'), ('Outros');

INSERT INTO situacao (codigo, rotulo, ordem, aberta) VALUES
  ('recebida',    'Recebida',       1, 1),
  ('triagem',     'Em triagem',     2, 1),
  ('atendimento', 'Em atendimento', 3, 1),
  ('concluida',   'Concluída',      4, 0),
  ('arquivada',   'Arquivada',      5, 0);

INSERT INTO prioridade (codigo, rotulo, peso) VALUES
  ('alta', 'Alta', 0), ('media', 'Média', 1), ('baixa', 'Baixa', 2);

INSERT INTO membro_equipe (nome, email, papel) VALUES
  ('Profa. Helena Duarte', 'helena.duarte@exemplo.com', 'docente'),
  ('Rafael Almeida',       'rafael.almeida@exemplo.com', 'bolsista');

INSERT INTO solicitante (nome, email, telefone) VALUES
  ('Ana Souza',      'ana.souza@exemplo.com',  NULL),
  ('Carlos Pereira', 'carlos.p@exemplo.com',   NULL),
  ('Beatriz Lima',   'bia.lima@exemplo.com',   NULL),
  ('João Ferreira',  'joao.f@exemplo.com',     NULL),
  ('Marta Oliveira', 'marta.o@exemplo.com',    '67999990000'),
  ('Paulo Santos',   'paulo.s@exemplo.com',    NULL);

INSERT INTO demanda (protocolo, solicitante_id, categoria_id, local, descricao, prioridade, consentimento, criada_em, atualizada_em) VALUES
  ('SGDC-2026-0001', 1, 3, 'Vila Nova',            'Moradores idosos pedem oficina básica de uso do celular e de aplicativos de bancos.',               'media', 1, '2026-10-01T13:00:00Z', '2026-10-01T13:00:00Z'),
  ('SGDC-2026-0002', 2, 2, 'Jardim Aurora',        'A associação de moradores solicita reforço de matemática para estudantes do 9º ano.',               'alta',  1, '2026-10-04T14:30:00Z', '2026-10-04T14:30:00Z'),
  ('SGDC-2026-0003', 3, 4, 'Centro',               'Proposta de horta comunitária no terreno ao lado da escola, com apoio técnico.',                    'baixa', 1, '2026-09-23T10:15:00Z', '2026-09-23T10:15:00Z'),
  ('SGDC-2026-0004', 4, 1, 'Bairro Universitário', 'Pedido de palestra sobre prevenção de doenças crônicas para o grupo de idosos.',                    'media', 1, '2026-10-10T09:00:00Z', '2026-10-10T09:00:00Z'),
  ('SGDC-2026-0005', 5, 6, 'Parque das Flores',    'Liderança comunitária pede oficinas de dança e teatro para crianças aos sábados.',                  'media', 1, '2026-10-11T16:45:00Z', '2026-10-11T16:45:00Z'),
  ('SGDC-2026-0006', 6, 5, 'Vila Esperança',       'Solicitação de parecer técnico sobre alagamento recorrente na rua da quadra esportiva.',            'alta',  1, '2026-10-07T11:20:00Z', '2026-10-07T11:20:00Z');

-- Primeiro item do histórico de cada demanda (ação do solicitante: membro_id NULL).
-- O gatilho trg_historico_atualiza_demanda mantém situacao/atualizada_em em dia.
INSERT INTO historico (demanda_id, situacao, observacao, membro_id, registrado_em)
SELECT id, 'recebida', 'Solicitação registrada pelo solicitante.', NULL, criada_em FROM demanda;

-- Ações da equipe
INSERT INTO historico (demanda_id, situacao, observacao, membro_id, registrado_em) VALUES
  (1, 'atendimento', 'Oficina agendada com o projeto de inclusão digital.',        2, '2026-10-03T15:00:00Z'),
  (2, 'triagem',     'Encaminhada ao coordenador do projeto de educação.',          1, '2026-10-06T08:40:00Z'),
  (3, 'atendimento', 'Visita ao terreno realizada.',                                1, '2026-09-25T10:00:00Z'),
  (3, 'concluida',   'Horta implantada em mutirão com estudantes bolsistas.',       2, '2026-10-15T17:30:00Z'),
  (6, 'triagem',     'Aguardando visita técnica.',                                  2, '2026-10-09T09:10:00Z');

UPDATE demanda SET responsavel_id = 1 WHERE id IN (2, 3, 6);
UPDATE demanda SET responsavel_id = 2 WHERE id = 1;
