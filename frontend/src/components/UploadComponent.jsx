import { useRef, useState } from 'react';
import { MAX_FILE_SIZE_BYTES, uploadDocument } from '../services/documentApi.js';
import { formatFileSize } from '../utils/formatFileSize.js';

export default function UploadComponent({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  function selectFile(selectedFile) {
    if (isUploading) {
      return;
    }

    setError('');

    if (!selectedFile) {
      return;
    }

    if (selectedFile.size === 0) {
      setFile(null);
      fileInputRef.current.value = '';
      setError('O arquivo não pode estar vazio.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      fileInputRef.current.value = '';
      setError('O arquivo excede o limite de 10 MiB.');
      return;
    }

    setFile(selectedFile);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file || isUploading) {
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const uploadedDocument = await uploadDocument(file);
      setFile(null);
      fileInputRef.current.value = '';
      onUploadComplete(uploadedDocument);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label
        className={`drop-zone${isDragging ? ' is-dragging' : ''}${file ? ' has-file' : ''}`}
        htmlFor="document-file-input"
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
      >
        <span className="drop-zone-symbol" aria-hidden="true">+</span>
        <span className="drop-zone-title">{file ? 'Trocar arquivo' : 'Escolher arquivo'}</span>
        <span className="drop-zone-caption">ou arraste até aqui</span>
        <input
          ref={fileInputRef}
          id="document-file-input"
          className="visually-hidden"
          type="file"
          onChange={(event) => selectFile(event.target.files[0])}
          disabled={isUploading}
        />
      </label>

      {file ? (
        <div className="selected-file" aria-live="polite">
          <span className="file-type-mark" aria-hidden="true">DOC</span>
          <span className="selected-file-details">
            <span className="selected-file-name" title={file.name}>{file.name}</span>
            <span className="selected-file-size">{formatFileSize(file.size)}</span>
          </span>
          <button
            className="remove-file-button"
            type="button"
            aria-label="Remover arquivo selecionado"
            onClick={() => {
              setFile(null);
              fileInputRef.current.value = '';
              setError('');
            }}
            disabled={isUploading}
          >
            ×
          </button>
        </div>
      ) : (
        <p className="upload-limit">Limite por arquivo: 10 MiB</p>
      )}

      {error && <p className="form-message form-message-error" role="alert">{error}</p>}

      <button className="upload-submit" type="submit" disabled={!file || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
      </button>
    </form>
  );
}