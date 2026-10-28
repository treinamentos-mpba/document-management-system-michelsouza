const API_PREFIX = '/api';
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

async function request(path, options = {}) {
  const response = await fetch(`${API_PREFIX}${path}`, options);

  if (!response.ok) {
    let message = 'Não foi possível concluir a operação.';

    try {
      const body = await response.json();
      message = body.error?.message || message;
    } catch {
      // A resposta pode não conter JSON, por exemplo em uma falha de rede do proxy.
    }

    throw new Error(message);
  }

  return response;
}

export async function listDocuments({ signal } = {}) {
  const response = await request('/documents', { signal });
  const body = await response.json();
  return body.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });
  const body = await response.json();
  return body.document;
}

export async function downloadDocument(id, originalName) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  const file = await response.blob();
  const objectUrl = URL.createObjectURL(file);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = originalName.split(/[\\/]/).pop() || 'documento';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}