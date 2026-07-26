import { useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { medicalRecordsApi } from '../../services/api';
import {
  extractIntegrityFields,
  getIntegrityStatus,
  getSolanaExplorerUrl,
  shortenHash,
} from '../../utils/blockchain';
import './IntegrityBadge.css';

/**
 * Exibe hash, status de âncora Solana e ação de verificação de integridade.
 */
export function IntegrityBadge({
  item,
  publicId: publicIdProp,
  hash: hashProp,
  blockchainTxId: txProp,
  label = 'Registro',
  compact = false,
  showVerify = true,
}) {
  const extracted = extractIntegrityFields(item || {});
  const publicId = publicIdProp || extracted.publicId;
  const hash = hashProp || extracted.hash;
  const blockchainTxId = txProp || extracted.blockchainTxId;
  const status = getIntegrityStatus({ hash, blockchain_tx_id: blockchainTxId });
  const explorerUrl = getSolanaExplorerUrl(blockchainTxId);

  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!publicId) {
      setError('ID do prontuário indisponível para verificação.');
      return;
    }
    setVerifying(true);
    setError('');
    setResult(null);
    try {
      const res = await medicalRecordsApi.verify(publicId);
      setResult(res);
    } catch (err) {
      setError(err?.message || 'Falha ao verificar integridade.');
    } finally {
      setVerifying(false);
    }
  };

  const StatusIcon =
    status.key === 'anchored' ? ShieldCheck : status.key === 'local_only' ? ShieldAlert : ShieldQuestion;

  return (
    <div className={`integrity-badge integrity-badge--${status.tone}${compact ? ' integrity-badge--compact' : ''}`}>
      <div className="integrity-badge-top">
        <span className={`integrity-status integrity-status--${status.tone}`}>
          <StatusIcon size={14} strokeWidth={2} />
          {status.label}
        </span>
        <span className="integrity-label">{label}</span>
      </div>

      {hash ? (
        <code className="integrity-hash" title={hash}>
          {compact ? shortenHash(hash, 8) : hash}
        </code>
      ) : (
        <p className="integrity-empty">{status.description}</p>
      )}

      <div className="integrity-actions">
        {explorerUrl && (
          <a
            className="integrity-link"
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir transação no Solana Explorer"
          >
            <ExternalLink size={14} />
            Explorer
          </a>
        )}
        {showVerify && publicId && (
          <button
            type="button"
            className="integrity-verify-btn"
            onClick={handleVerify}
            disabled={verifying}
          >
            {verifying ? <Loader2 size={14} className="integrity-spin" /> : <CheckCircle2 size={14} />}
            {verifying ? 'Verificando…' : 'Verificar integridade'}
          </button>
        )}
      </div>

      {error && <p className="integrity-feedback integrity-feedback--error">{error}</p>}
      {result && (
        <p
          className={`integrity-feedback ${
            result.valid
              ? 'integrity-feedback--ok'
              : result.status === 'pending'
                ? 'integrity-feedback--warn'
                : 'integrity-feedback--error'
          }`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
