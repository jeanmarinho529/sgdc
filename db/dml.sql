-- SGDC · Operações de manipulação de dados (DML) executadas pela aplicação.
-- Os parâmetros (:nome) são vinculados pelo driver; nunca concatene texto do usuário.

-- INSERT: novo solicitante e nova demanda (fluxo "Registrar solicitação")
INSERT INTO solicitante (nome, email, telefone)
VALUES (:nome, lower(:email), :telefone)
ON CONFLICT(email) DO UPDATE SET nome = excluded.nome;   -- mesmo e-mail reaproveita o cadastro

INSERT INTO demanda (protocolo, solicitante_id, categoria_id, local, descricao, consentimento, criada_em, atualizada_em)
VALUES (:protocolo,
        (SELECT id FROM solicitante WHERE email = lower(:email)),
        (SELECT id FROM categoria   WHERE nome  = :categoria),
        :local, :descricao, 1, :agora, :agora);

INSERT INTO historico (demanda_id, situacao, observacao, membro_id, registrado_em)
VALUES ((SELECT id FROM demanda WHERE protocolo = :protocolo), 'recebida',
        'Solicitação registrada pelo solicitante.', NULL, :agora);

-- UPDATE: triagem pela equipe (muda prioridade/responsável; a situação muda via histórico)
UPDATE demanda SET prioridade = :prioridade, responsavel_id = :membro WHERE protocolo = :protocolo;

INSERT INTO historico (demanda_id, situacao, observacao, membro_id, registrado_em)
VALUES ((SELECT id FROM demanda WHERE protocolo = :protocolo), :situacao, :observacao, :membro, :agora);

-- DELETE: remoção de dados pessoais a pedido do titular (LGPD, art. 18).
-- O histórico é apagado em cascata; o solicitante só é apagado se não tiver mais demandas.
DELETE FROM demanda WHERE protocolo = :protocolo;
DELETE FROM solicitante WHERE id = :solicitante_id
   AND NOT EXISTS (SELECT 1 FROM demanda WHERE solicitante_id = :solicitante_id);
