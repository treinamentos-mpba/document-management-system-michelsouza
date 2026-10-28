---
description: "Cria e executa testes de integração para um endpoint HTTP do backend Express."
name: testar-endpoint
argument-hint: "método e caminho (ex. POST /upload)"
agent: agent
---

# Testar endpoint do backend

Crie testes de integração para o endpoint `${input:endpoint:método e caminho}`.

Antes de editar, consulte a rota, o controller, a especificação aplicável e os testes existentes para confirmar o contrato e seguir os padrões do projeto.

Requisitos:

- Use `node:test` e `node:assert`; não instale dependências de teste.
- Coloque ou atualize os testes em `backend/test`.
- Teste a resposta de sucesso (status, formato e dados relevantes) e os casos de erro importantes para o endpoint, como entrada ausente/inválida e identificador inexistente.
- Para testes HTTP, inicie o app Express em uma porta efêmera (`listen(0)`) e use `fetch` nativo. Não dependa de servidores externos ou de uma porta fixa.
- Para upload multipart, use `FormData` e `Blob`; não construa o corpo multipart manualmente.
- Isole os dados de cada teste. Se gravar arquivos em `backend/storage`, remova somente os arquivos criados pelo próprio teste, mesmo quando ele falhar; nunca apague arquivos preexistentes.
- Não altere o comportamento de produção nem o contrato da API para fazer os testes passarem. Se encontrar uma divergência ou defeito, relate-o separadamente.
- Execute `npm test --prefix backend` e informe os cenários cobertos e o resultado.
