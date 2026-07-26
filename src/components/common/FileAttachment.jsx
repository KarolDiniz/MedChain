import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Eye, FileText, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { filesApi } from '../../services/api';
import { IntegrityBadge } from './IntegrityBadge';
import { formatDateBR, resolveItemDate } from '../../utils/dateUtils';
import './FileAttachment.css';

function formatLabel(mime) {
  if (mime === 'application/pdf') return 'PDF';
  if (mime === 'image/png') return 'PNG';
  if (mime === 'image/jpeg') return 'JPEG';
  return mime || 'Arquivo';
}

function isImage(mime) {
  return mime === 'image/jpeg' || mime === 'image/png';
}

function isPdf(mime) {
  return mime === 'application/pdf';
}

function suggestedName(file) {
  const ext =
    file.format === 'application/pdf'
      ? 'pdf'
      : file.format === 'image/png'
        ? 'png'
        : file.format === 'image/jpeg'
          ? 'jpg'
          : 'bin';
  const base = (file.description || `arquivo-${file.id}`).replace(/[^\w\s\-.]/g, '_').trim();
  return base.toLowerCase().endsWith(`.${ext}`) ? base : `${base}.${ext}`;
}

/**
 * Card de arquivo com preview (imagem/PDF) e download.
 * O visualizador abre em portal no body (popup central).
 */
export function FileAttachment({ file, showIntegrity = true, compact = false }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;

    const load = async () => {
      if (!file?.id || !isImage(file.format)) return;
      setLoadingPreview(true);
      setPreviewError('');
      try {
        const blob = await filesApi.fetchContent(file.id);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch (err) {
        if (!cancelled) setPreviewError(err?.message || 'Falha ao carregar preview');
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file?.id, file?.format]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [modalOpen]);

  const handleDownload = async (e) => {
    e?.stopPropagation?.();
    setDownloading(true);
    try {
      await filesApi.download(file.id, suggestedName(file));
    } catch (err) {
      setPreviewError(err?.message || 'Falha no download');
    } finally {
      setDownloading(false);
    }
  };

  const openViewer = async (e) => {
    e?.stopPropagation?.();
    setModalOpen(true);
    if (previewUrl || !file?.id) return;
    setLoadingPreview(true);
    setPreviewError('');
    try {
      const blob = await filesApi.fetchContent(file.id);
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      setPreviewError(err?.message || 'Falha ao abrir arquivo');
    } finally {
      setLoadingPreview(false);
    }
  };

  const viewer = modalOpen
    ? createPortal(
        <div
          className="file-viewer-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={file.description || `Arquivo #${file.id}`}
          onClick={() => setModalOpen(false)}
        >
          <div className="file-viewer-modal" onClick={(ev) => ev.stopPropagation()}>
            <header className="file-viewer-header">
              <div>
                <h3>{file.description || `Arquivo #${file.id}`}</h3>
                <p>{formatLabel(file.format)}</p>
              </div>
              <div className="file-viewer-header-actions">
                <button type="button" className="file-action-btn" onClick={handleDownload} disabled={downloading}>
                  <Download size={15} />
                  Download
                </button>
                <button
                  type="button"
                  className="file-viewer-close"
                  onClick={() => setModalOpen(false)}
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
            </header>
            <div className="file-viewer-body">
              {loadingPreview && !previewUrl ? (
                <div className="file-viewer-empty">
                  <Loader2 size={28} className="file-spin" />
                  <p>Carregando arquivo...</p>
                </div>
              ) : previewError && !previewUrl ? (
                <div className="file-viewer-empty">
                  <p>{previewError}</p>
                </div>
              ) : isImage(file.format) && previewUrl ? (
                <img src={previewUrl} alt={file.description || 'Anexo'} className="file-viewer-image" />
              ) : isPdf(file.format) && previewUrl ? (
                <iframe title={file.description || 'PDF'} src={previewUrl} className="file-viewer-pdf" />
              ) : (
                <div className="file-viewer-empty">
                  <p>Pré-visualização indisponível para este tipo. Use o download.</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className={`file-attachment${compact ? ' file-attachment--compact' : ''}`}>
        <div
          className="file-attachment-preview"
          onClick={openViewer}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && openViewer(e)}
        >
          {isImage(file.format) && previewUrl ? (
            <img src={previewUrl} alt={file.description || 'Anexo'} className="file-attachment-thumb" />
          ) : isPdf(file.format) ? (
            <div className="file-attachment-placeholder file-attachment-placeholder--pdf">
              <FileText size={32} strokeWidth={1.5} />
              <span>PDF</span>
            </div>
          ) : (
            <div className="file-attachment-placeholder">
              {loadingPreview ? <Loader2 size={28} className="file-spin" /> : <ImageIcon size={28} />}
            </div>
          )}
          {loadingPreview && isImage(file.format) && !previewUrl && (
            <div className="file-attachment-loading">
              <Loader2 size={20} className="file-spin" />
            </div>
          )}
        </div>

        <div className="file-attachment-body">
          <span className="file-attachment-format">{formatLabel(file.format)}</span>
          <div className="file-attachment-desc">{file.description || `Arquivo #${file.id}`}</div>
          {resolveItemDate(file, 'file') && (
            <span className="file-attachment-date">
              {formatDateBR(resolveItemDate(file, 'file'))}
            </span>
          )}

          <div className="file-attachment-actions">
            <button type="button" className="file-action-btn" onClick={openViewer}>
              <Eye size={15} />
              Visualizar
            </button>
            <button type="button" className="file-action-btn" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 size={15} className="file-spin" /> : <Download size={15} />}
              Download
            </button>
          </div>

          {previewError && !modalOpen && <p className="file-attachment-error">{previewError}</p>}

          {showIntegrity && (
            <IntegrityBadge hash={file.hash} label="Arquivo" showVerify={false} compact />
          )}
        </div>
      </div>

      {viewer}
    </>
  );
}
