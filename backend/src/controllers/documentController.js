function createDocumentController(documentService) {
  return {
    upload: async (req, res, next) => {
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'INVALID_UPLOAD',
            message: 'Envie um arquivo no campo "file".',
          },
        });
      }

      if (req.file.size === 0) {
        await documentService.removeStoredFile(req.file.filename);

        return res.status(400).json({
          error: {
            code: 'INVALID_UPLOAD',
            message: 'O arquivo não pode estar vazio.',
          },
        });
      }

      try {
        const document = documentService.createDocument(req.file);
        return res.status(201).json({ document });
      } catch (error) {
        await documentService.removeStoredFile(req.file.filename).catch(() => {});
        return next(error);
      }
    },

    list: (req, res, next) => {
      try {
        return res.json({ documents: documentService.listDocuments() });
      } catch (error) {
        return next(error);
      }
    },

    download: (req, res, next) => {
      const download = documentService.getDownload(req.params.id);

      if (!download) {
        return res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Documento não encontrado.',
          },
        });
      }

      return res.download(download.filePath, download.document.originalName, (error) => {
        if (!error) {
          return;
        }

        if (error.code === 'ENOENT' && !res.headersSent) {
          return res.status(404).json({
            error: {
              code: 'DOCUMENT_NOT_FOUND',
              message: 'Documento não encontrado.',
            },
          });
        }

        return next(error);
      });
    },
  };
}

module.exports = createDocumentController;