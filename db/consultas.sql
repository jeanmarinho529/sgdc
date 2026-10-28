-- SGDC · Consultas SQL (cada bloco começa com "-- Q<n>:" e é executado por db/run.mjs)

-- Q1: Painel de triagem (abertas primeiro, por prioridade e antiguidade)
SELECT * FROM vw_painel_triagem;

-- Q2: Indicadores do painel
SELECT * FROM vw_indicadores;

-- Q3: Acompanhamento por protocolo (histórico em ordem cronológica inversa)
SELECT d.protocolo, h.registrado_em, st.rotulo AS situacao, h.observacao, COALESCE(m.nome, 'Solicitante') AS autor
  FROM historico h
  JOIN demanda  d  ON d.id = h.demanda_id
  JOIN situacao st ON st.codigo = h.situacao
  LEFT JOIN membro_equipe m ON m.id = h.membro_id
 WHERE d.protocolo = 'SGDC-2026-0003'
 ORDER BY h.registrado_em DESC;

-- Q4: Quantidade de demandas por categoria (agregação)
SELECT c.nome AS categoria, COUNT(d.id) AS demandas
  FROM categoria c
  LEFT JOIN demanda d ON d.categoria_id = c.id
 GROUP BY c.id
 ORDER BY demandas DESC, c.nome;

-- Q5: Carga de trabalho por responsável, apenas demandas abertas
SELECT COALESCE(m.nome, '(sem responsável)') AS responsavel, COUNT(*) AS abertas
  FROM demanda d
  JOIN situacao st ON st.codigo = d.situacao AND st.aberta = 1
  LEFT JOIN membro_equipe m ON m.id = d.responsavel_id
 GROUP BY m.id
 ORDER BY abertas DESC;

-- Q6: Busca por texto no local ou na descrição
SELECT protocolo, local FROM demanda
 WHERE lower(local || ' ' || descricao) LIKE '%' || lower('idosos') || '%'
 ORDER BY protocolo;

-- Q7: Tempo, em dias, entre a criação e a conclusão das demandas concluídas
SELECT d.protocolo,
       CAST(julianday(d.atualizada_em) - julianday(d.criada_em) AS INTEGER) AS dias_ate_concluir
  FROM demanda d
 WHERE d.situacao = 'concluida';

-- Q8: Solicitantes que têm mais de uma demanda (HAVING) – nenhum no seed
SELECT s.nome, COUNT(*) AS demandas
  FROM solicitante s JOIN demanda d ON d.solicitante_id = s.id
 GROUP BY s.id HAVING COUNT(*) > 1;
