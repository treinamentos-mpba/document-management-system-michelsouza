---
description: "Integra um fluxo da interface React com os endpoints existentes do backend via fetch e o proxy /api."
name: integrar-api-frontend
argument-hint: "fluxo a integrar (ex. upload, listagem e download)"
agent: agent
---

# Integrar API e frontend

Implemente no frontend o fluxo `${input:fluxo:fluxo a integrar}`, consumindo os endpoints existentes do backend.

Antes de editar, consulte `docs/specs/dms-spec.md` quando disponível, as rotas e respostas reais do backend, `frontend/vite.config.js` e os componentes/serviços existentes. Em caso de divergência entre contrato documentado e implementação, não altere o backend: explique a divergência e mantenha a integração compatível com o contrato que está realmente disponível.

Requisitos:

- Faça chamadas com `fetch` pelo prefixo `/api`; o proxy Vite remove esse prefixo. Não use URL absoluta nem adicione outro cliente HTTP.
- Centralize as chamadas no serviço de API existente em `frontend/src/services`; evite duplicar tratamento de erros e construção de URLs.
- Para upload multipart, envie `FormData` com o campo esperado pelo backend e não defina manualmente o cabeçalho `Content-Type`.
- Para download binário, use `Blob` e um link temporário, liberando a URL criada após iniciar o download.
- Use componentes funcionais e Hooks, reutilize os componentes existentes e mantenha mensagens e rótulos da interface em português.
- Trate estados de carregamento, vazio, sucesso e erro; mantenha controles acessíveis por teclado e com rótulos compreensíveis.
- Se o fluxo incluir upload, valide no cliente os limites definidos pela especificação, sem substituir a validação do backend. Atualize a listagem após um envio bem-sucedido sem recarregar a página.
- Não modifique arquivos do backend, contratos da API, dependências ou configurações fora do escopo de integração frontend.
- Execute `npm run build --prefix frontend`. Se os servidores já estiverem disponíveis, valide também o fluxo pelo proxy; não declare validação manual se ela não tiver sido executada.
- Ao concluir, resuma os arquivos alterados, verificações realizadas e eventuais divergências entre a API documentada e a implementada.
