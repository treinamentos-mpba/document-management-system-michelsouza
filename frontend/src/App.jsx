import { useEffect, useState } from 'react';
import { listDocuments } from './services/documentApi.js';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();

    listDocuments({ signal: abortController.signal })
      .then(setDocuments)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setNotice({ type: 'error', message: error.message });
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => abortController.abort();
  }, []);

  function handleUploadComplete(document) {
    setDocuments((currentDocuments) => [
      document,
      ...currentDocuments.filter((item) => item.id !== document.id),
    ]);
    setNotice({ type: 'success', message: 'Documento enviado com sucesso.' });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-name">arquivo<span>local</span></span>
        </a>
        <div className="topbar-meta">
          <span>Workspace local</span>
        </div>
      </header>

      <div className="workspace" id="inicio">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">DOCUMENT MANAGEMENT SYSTEM</p>
            <h1 id="page-title">Documentos</h1>
            <p className="page-description">Arquivos da sua biblioteca local.</p>
          </div>
          <div className="library-count" aria-label={`${documents.length} documentos`}>
            <span className="library-count-number">{String(documents.length).padStart(2, '0')}</span>
            <span className="library-count-label">no acervo</span>
          </div>
        </section>

        {notice && (
          <div className={`notice notice-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
            <span>{notice.message}</span>
            <button
              className="notice-dismiss"
              type="button"
              aria-label="Fechar mensagem"
              onClick={() => setNotice(null)}
            >
              ×
            </button>
          </div>
        )}

        <div className="workspace-grid">
          <aside className="upload-panel" aria-labelledby="upload-title">
            <div className="panel-heading">
              <span className="step-index">01</span>
              <div>
                <h2 id="upload-title">Adicionar arquivo</h2>
                <p>Envie para o acervo local.</p>
              </div>
            </div>
            <UploadComponent onUploadComplete={handleUploadComplete} />
            <div className="storage-note">
              <span className="storage-note-mark" aria-hidden="true" />
              <span>Armazenamento local</span>
            </div>
          </aside>

          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDownloadError={(message) => setNotice({ type: 'error', message })}
          />
        </div>

        <footer className="page-footer">
          <span>DMS <span className="footer-separator">/</span> Biblioteca pessoal</span>
          <span>Arquivos mantidos neste dispositivo</span>
        </footer>
      </div>
    </main>
  );
}
