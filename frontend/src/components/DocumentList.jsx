import DownloadButton from './DownloadButton.jsx';
import { formatFileSize } from '../utils/formatFileSize.js';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function DocumentList({ documents, isLoading, onDownloadError }) {
  return (
    <section className="documents-section" aria-labelledby="documents-title">
      <div className="section-heading">
        <div className="section-heading-title">
          <span className="step-index">02</span>
          <div>
            <h2 id="documents-title">Acervo</h2>
            <p>Documentos disponíveis nesta sessão.</p>
          </div>
        </div>
        <span className="document-count">{documents.length} {documents.length === 1 ? 'arquivo' : 'arquivos'}</span>
      </div>

      {isLoading ? (
        <div className="list-state" role="status">Carregando documentos...</div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-rule" aria-hidden="true" />
          <p>Nenhum documento no acervo</p>
        </div>
      ) : (
        <div className="document-table-wrap">
          <table className="document-table">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Proprietário</th>
                <th scope="col">Enviado em</th>
                <th scope="col">Tamanho</th>
                <th scope="col"><span className="visually-hidden">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td className="document-name-cell">
                    <span className="document-name-wrap">
                      <span className="file-type-mark" aria-hidden="true">DOC</span>
                      <span className="document-name" title={document.originalName}>{document.originalName}</span>
                    </span>
                  </td>
                  <td data-label="Proprietário">{document.owner}</td>
                  <td data-label="Enviado em">
                    <time dateTime={document.uploadedAt}>
                      {dateFormatter.format(new Date(document.uploadedAt))}
                    </time>
                  </td>
                  <td data-label="Tamanho">{formatFileSize(document.size)}</td>
                  <td className="download-cell">
                    <DownloadButton document={document} onError={onDownloadError} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}