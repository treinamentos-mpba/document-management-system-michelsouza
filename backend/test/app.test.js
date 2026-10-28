const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload, lista e baixa documentos', async (t) => {
  const storageDirectory = path.resolve(__dirname, '../storage');
  const existingFiles = new Set(await fs.readdir(storageDirectory));
  const server = app.listen(0);

  await new Promise((resolve) => server.once('listening', resolve));

  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });

    const currentFiles = await fs.readdir(storageDirectory);
    await Promise.all(
      currentFiles
        .filter((fileName) => !existingFiles.has(fileName))
        .map((fileName) => fs.unlink(path.join(storageDirectory, fileName))),
    );
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const form = new FormData();
  form.append('file', new Blob(['conteudo do documento']), 'relatorio.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });

  assert.strictEqual(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();
  assert.strictEqual(document.originalName, 'relatorio.txt');
  assert.strictEqual(document.size, Buffer.byteLength('conteudo do documento'));
  assert.ok(document.id);
  assert.ok(document.uploadedAt);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(listResponse.status, 200);
  assert.deepStrictEqual((await listResponse.json()).documents, [document]);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(await downloadResponse.text(), 'conteudo do documento');
  assert.match(downloadResponse.headers.get('content-disposition'), /relatorio\.txt/);

  const missingResponse = await fetch(`${baseUrl}/documents/inexistente/download`);
  assert.strictEqual(missingResponse.status, 404);
  assert.strictEqual((await missingResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');

  const emptyForm = new FormData();
  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: emptyForm,
  });
  assert.strictEqual(missingFileResponse.status, 400);

  const emptyFileForm = new FormData();
  emptyFileForm.append('file', new Blob([]), 'vazio.txt');
  const emptyFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: emptyFileForm,
  });
  assert.strictEqual(emptyFileResponse.status, 400);

  const oversizedForm = new FormData();
  oversizedForm.append('file', new Blob([new Uint8Array(10 * 1024 * 1024 + 1)]), 'grande.bin');
  const oversizedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: oversizedForm,
  });
  assert.strictEqual(oversizedResponse.status, 413);
  assert.strictEqual((await oversizedResponse.json()).error.code, 'FILE_TOO_LARGE');
});
