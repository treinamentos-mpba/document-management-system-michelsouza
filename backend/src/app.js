// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const multer = require('multer');
const DocumentRepository = require('./repositories/documentRepository');
const DocumentService = require('./services/documentService');
const createDocumentController = require('./controllers/documentController');
const createDocumentRoutes = require('./routes/documentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const documentRepository = new DocumentRepository();
const documentService = new DocumentService(
  documentRepository,
  process.env.DMS_OWNER || 'default',
);
const documentController = createDocumentController(documentService);

app.use(express.json());
app.use(createDocumentRoutes(documentController, documentRepository.storageDirectory));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    const fileTooLarge = error.code === 'LIMIT_FILE_SIZE';

    return res.status(fileTooLarge ? 413 : 400).json({
      error: {
        code: fileTooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
        message: fileTooLarge
          ? 'O arquivo excede o limite de 10 MiB.'
          : 'O arquivo enviado é inválido.',
      },
    });
  }

  return res.status(500).json({
    error: {
      code: 'STORAGE_ERROR',
      message: 'Não foi possível processar a operação do documento.',
    },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
