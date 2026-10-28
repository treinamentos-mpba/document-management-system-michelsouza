# Especificação - Document Management System

## 1. Objetivo

Permitir que um usuário envie, liste e baixe documentos armazenados no filesystem local da aplicação, com metadados mantidos em memória nesta fase.

> **Status do projeto:** esta especificação descreve o comportamento desejado. No seed atual, somente `GET /health` está implementado; os endpoints de documentos e a interface ainda serão construídos.

## 2. Escopo

### Dentro do escopo

- Enviar um documento por requisição.
- Listar os metadados dos documentos enviados durante a execução atual do backend.
- Baixar um documento pelo identificador.
- Manter arquivos no filesystem local em `backend/storage`, usando Multer com `diskStorage`.
- Manter os metadados em memória.
- Interface React para upload, listagem e download, consumindo a API via `fetch`.

### Fora do escopo

- Armazenamento em nuvem ou qualquer provedor externo.
- Versionamento, exclusão, pesquisa e paginação de documentos.
- Autenticação, cadastro de usuários e isolamento de acesso por usuário.
- Persistência dos metadados em banco de dados ou recuperação automática após reiniciar o backend.
- Validação por lista de tipos MIME permitidos.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um arquivo por requisição de upload, no campo multipart `file`. |
| RF-02 | O sistema deve rejeitar requisições sem arquivo, com arquivo vazio ou acima do limite de 10 MiB (10 × 1024 × 1024 bytes). |
| RF-03 | O sistema deve gravar o conteúdo recebido em `backend/storage` usando Multer com `diskStorage`; não deve usar serviços externos. |
| RF-04 | O sistema deve gerar um identificador único para cada documento e manter seus metadados em memória. |
| RF-05 | O sistema deve registrar `owner` com o identificador configurado para a instância. Na primeira fase, há um único usuário lógico e não há autenticação nem garantia de isolamento. |
| RF-06 | O sistema deve listar todos os documentos conhecidos na execução atual, do mais recente para o mais antigo. Empates devem ter ordenação determinística pelo identificador. |
| RF-07 | O sistema deve permitir baixar o arquivo correspondente a um identificador existente, preservando o nome original no nome sugerido para download. |
| RF-08 | O sistema deve retornar erro compreensível e um código HTTP apropriado para entrada inválida, documento inexistente, limite excedido e falha de filesystem. |
| RF-09 | A interface deve permitir selecionar e enviar um arquivo, apresentar o estado da listagem e iniciar o download de um documento. |
| RF-10 | A interface deve apresentar mensagens em português para estados de carregamento, sucesso e erro, sem expor detalhes internos do servidor. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend deve usar Node.js, Express e JavaScript CommonJS; o frontend deve usar React, Vite e JavaScript ESM. |
| RNF-02 | O backend deve seguir Clean Architecture simples, com dependências direcionadas de `routes` para `controllers`, `services` e `repositories`. |
| RNF-03 | Arquivos devem permanecer no filesystem local em `backend/storage`, gravados por Multer `diskStorage`; não é permitido armazenamento externo. |
| RNF-04 | Metadados devem permanecer em memória nesta fase. Reiniciar o processo perde os metadados, mesmo que os arquivos continuem no disco. |
| RNF-05 | Configurações operacionais devem vir de variáveis de ambiente. `PORT` define a porta do servidor; `DMS_OWNER` define o usuário lógico e assume `default` quando ausente. O diretório permanece fixo em `backend/storage`, conforme a restrição do projeto. |
| RNF-06 | O limite de upload deve ser aplicado no backend, independentemente das validações da interface. |
| RNF-07 | O nome recebido do cliente não deve ser usado como caminho de gravação. O arquivo deve receber um nome interno gerado pelo servidor; o nome original é apenas metadado e deve ser tratado com segurança ao compor o cabeçalho de download. |
| RNF-08 | O código deve tratar erros de entrada e de filesystem nos limites da aplicação, sem retornar stack traces ou caminhos locais ao cliente. |
| RNF-09 | Testes de backend devem usar o runner nativo `node:test`. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único, gerado pelo servidor (UUID). |
| `originalName` | string | Nome original informado para o arquivo, sem ser usado como caminho local. |
| `size` | number | Tamanho do arquivo em bytes; deve ser maior que zero e não exceder 10 MiB. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601 UTC, por exemplo `2026-10-28T12:30:00.000Z`. |
| `owner` | string | Identificador do usuário lógico configurado por `DMS_OWNER`; padrão `default`. |

A resposta da API não deve expor caminhos locais nem o nome interno de armazenamento.

### Dados internos de armazenamento

O repositório mantém, além dos metadados públicos, um nome interno gerado pelo servidor que associa o `id` ao arquivo em `backend/storage`. Esse valor não é aceito do cliente nem retornado pela API. A associação entre metadados e arquivo existe somente em memória nesta fase.

## 6. Contratos de API

Os caminhos abaixo são os caminhos registrados no backend. Durante o desenvolvimento, o frontend usa o prefixo `/api`; o proxy do Vite remove esse prefixo antes de encaminhar a chamada ao backend. Portanto, por exemplo, `/api/documents` no navegador é encaminhado para `/documents` no backend.

Todas as respostas de erro devem usar o formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

`code` deve ser estável para uso pelo frontend. `message` deve ser uma mensagem segura e compreensível em português.

### `POST /upload`

- **Objetivo:** armazenar um documento e registrar seus metadados.
- **Entrada:** `multipart/form-data` com exatamente um arquivo no campo `file`. Limite: 10 MiB. Qualquer tipo MIME é aceito; arquivo vazio não é aceito.
- **Resposta de sucesso:** `201 Created`, `application/json`, com o documento criado:

```json
{
  "document": {
    "id": "4c3b8c2e-6da2-4c45-b637-6c8c8905fa39",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-10-28T12:30:00.000Z",
    "owner": "default"
  }
}
```

- **Erros:** `400 Bad Request` para campo ausente, arquivo vazio ou campo de arquivo inesperado; `413 Payload Too Large` para arquivo acima do limite; `500 Internal Server Error` para falha ao gravar o arquivo ou registrar os metadados.
- Se o arquivo for gravado, mas o registro dos metadados falhar, a implementação deve tentar remover o arquivo recém-gravado para evitar um órfão criado por uma falha parcial.

### `GET /documents`

- **Objetivo:** listar documentos registrados em memória para a execução atual.
- **Entrada:** sem parâmetros obrigatórios.
- **Resposta de sucesso:** `200 OK`, `application/json`, com a lista (vazia quando não houver documentos):

```json
{
  "documents": [
    {
      "id": "4c3b8c2e-6da2-4c45-b637-6c8c8905fa39",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-10-28T12:30:00.000Z",
      "owner": "default"
    }
  ]
}
```

- A ordenação é descendente por `uploadedAt`; em caso de empate, ascendente por `id`.
- **Erros:** `500 Internal Server Error` se não for possível obter a lista.

### `GET /documents/:id/download`

- **Objetivo:** transmitir o conteúdo do documento identificado por `id`.
- **Resposta de sucesso:** `200 OK`, conteúdo binário (`application/octet-stream`) e `Content-Disposition: attachment` com o nome original devidamente sanitizado/escapado. Quando disponível, enviar também `Content-Length` correspondente ao tamanho registrado.
- **Erros:** `404 Not Found` se o identificador não estiver registrado ou se o arquivo correspondente não existir; `500 Internal Server Error` para outras falhas de leitura do filesystem.
- O endpoint não deve aceitar um caminho de arquivo fornecido pelo cliente: o arquivo é resolvido exclusivamente pela associação interna do identificador.

### Códigos de erro

| HTTP | `code` sugerido | Situação |
| --- | --- | --- |
| 400 | `INVALID_UPLOAD` | Arquivo ausente, vazio ou campo multipart inválido. |
| 404 | `DOCUMENT_NOT_FOUND` | Documento ou arquivo correspondente não encontrado. |
| 413 | `FILE_TOO_LARGE` | Upload excede 10 MiB. |
| 500 | `STORAGE_ERROR` | Falha inesperada de leitura, gravação ou atualização do repositório. |

O endpoint existente `GET /health`, que retorna `{"status":"ok"}`, deve continuar disponível e não faz parte dos endpoints de documentos acima.

## 7. Decisões arquiteturais

### Backend

O fluxo de dependências é `routes -> controllers -> services -> repositories`.

- `routes/`: registra `/upload`, `/documents` e `/documents/:id/download`; aplica o middleware de upload do Multer antes do controller.
- `controllers/`: traduz entrada e saída HTTP, valida parâmetros básicos e converte erros conhecidos em status e respostas HTTP.
- `services/`: coordena as regras de negócio, como criar metadados, listar e solicitar um download.
- `repositories/`: associa metadados em memória aos arquivos locais e oferece operações de gravação, listagem e leitura ao service.
- Multer com `diskStorage` grava exclusivamente em `backend/storage`. O nome de armazenamento é gerado pelo servidor e não depende do nome original.
- Camadas internas não devem depender de Express nem conhecer detalhes de transporte HTTP. Não adicionar abstrações ou dependências sem necessidade para este escopo.

### Frontend

- Componentes funcionais com React Hooks, organizados em `components/`, `pages/` e `services/` conforme necessário.
- Componentes previstos: `UploadComponent`, `DocumentList` e `DownloadButton`.
- Um serviço centraliza chamadas `fetch` usando `/api`; o proxy Vite encaminha ao backend e remove o prefixo.
- A interface atualiza a listagem depois de um upload bem-sucedido e apresenta erros retornados pela API em linguagem adequada ao usuário.

### Persistência e limitações

Os arquivos são locais e podem permanecer no disco após o reinício do processo. Como os metadados ficam somente em memória, os arquivos existentes não podem ser listados ou localizados pela API depois do reinício; não haverá varredura nem remoção automática de arquivos órfãos nesta fase. O sistema é destinado a um usuário lógico por instância e não deve ser considerado um serviço multiusuário autenticado.

## 8. Plano de execução

As etapas abaixo descrevem a implementação futura após a aprovação desta especificação. **Nesta etapa de planejamento, o único artefato a criar é `docs/specs/dms-spec.md`; não executar as etapas de backend ou frontend agora.**

1. **Preparar o backend:** manter `GET /health`, definir configuração por ambiente e estabelecer o tratamento centralizado dos erros previstos.
2. **Implementar o upload local:** criar as camadas `routes`, `controllers`, `services` e `repositories`; configurar Multer `diskStorage` em `backend/storage`; gravar arquivo e metadados em memória conforme os limites e validações desta especificação.
3. **Implementar listagem e download:** expor os contratos definidos, ordenar a lista de forma determinística e resolver downloads apenas pela associação interna do identificador.
4. **Testar o backend:** adicionar testes com `node:test` para upload válido e inválido, limite de tamanho, listagem, download, identificador inexistente e falhas relevantes de armazenamento; executar `npm test` em `backend`.
5. **Implementar a interface:** criar `UploadComponent`, `DocumentList`, `DownloadButton` e o serviço `fetch` em `frontend/src`; montar o fluxo na página principal, usando `/api`.
6. **Validar a integração:** iniciar backend e frontend, enviar um documento, confirmar que aparece na lista e baixá-lo; verificar também estados de erro e mensagens apresentadas pela interface.
