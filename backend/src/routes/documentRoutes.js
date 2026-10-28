const crypto = require('node:crypto');
const fs = require('node:fs');
const express = require('express');
const multer = require('multer');

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function createDocumentRoutes(documentController, storageDirectory) {
  const router = express.Router();
  const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      fs.mkdir(storageDirectory, { recursive: true }, (error) => {
        callback(error, storageDirectory);
      });
    },
    filename: (req, file, callback) => {
      callback(null, crypto.randomUUID());
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  });

  router.post('/upload', upload.single('file'), documentController.upload);
  router.get('/documents', documentController.list);
  router.get('/documents/:id/download', documentController.download);

  return router;
}

module.exports = createDocumentRoutes;