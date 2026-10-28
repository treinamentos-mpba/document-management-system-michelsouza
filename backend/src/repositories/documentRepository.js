const fs = require('node:fs/promises');
const path = require('node:path');

class DocumentRepository {
  constructor(storageDirectory = path.resolve(__dirname, '../../storage')) {
    this.storageDirectory = storageDirectory;
    this.documents = new Map();
  }

  save(document) {
    this.documents.set(document.id, document);
  }

  list() {
    return Array.from(this.documents.values());
  }

  findById(id) {
    return this.documents.get(id) || null;
  }

  getFilePath(storageName) {
    return path.join(this.storageDirectory, storageName);
  }

  async removeStoredFile(storageName) {
    await fs.unlink(this.getFilePath(storageName));
  }
}

module.exports = DocumentRepository;