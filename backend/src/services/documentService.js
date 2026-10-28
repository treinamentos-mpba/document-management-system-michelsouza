const { randomUUID } = require('node:crypto');

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

class DocumentService {
  constructor(documentRepository, owner) {
    this.documentRepository = documentRepository;
    this.owner = owner;
  }

  createDocument(file) {
    const document = {
      id: randomUUID(),
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner: this.owner,
      storageName: file.filename,
    };

    this.documentRepository.save(document);

    return toPublicDocument(document);
  }

  listDocuments() {
    return this.documentRepository
      .list()
      .sort((first, second) => {
        const dateOrder = second.uploadedAt.localeCompare(first.uploadedAt);
        return dateOrder || first.id.localeCompare(second.id);
      })
      .map(toPublicDocument);
  }

  getDownload(id) {
    const document = this.documentRepository.findById(id);

    if (!document) {
      return null;
    }

    return {
      document: toPublicDocument(document),
      filePath: this.documentRepository.getFilePath(document.storageName),
    };
  }

  removeStoredFile(storageName) {
    return this.documentRepository.removeStoredFile(storageName);
  }
}

module.exports = DocumentService;