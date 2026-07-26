/**
 * Helpers de integridade / Solana para o MedChain.
 * Hash real (SHA-256) e tx_id vêm do backend; o front só exibe e aciona verificação.
 */

export function getSolanaExplorerUrl(txId, cluster = 'devnet') {
  if (!txId) return null;
  return `https://explorer.solana.com/tx/${txId}?cluster=${cluster}`;
}

export function getIntegrityStatus({ hash, blockchain_tx_id, anchored } = {}) {
  if (anchored === true || (hash && blockchain_tx_id)) {
    return {
      key: 'anchored',
      label: 'Ancorado',
      tone: 'success',
      description: 'Hash SHA-256 registrado na Solana (devnet).',
    };
  }
  if (hash && !blockchain_tx_id) {
    return {
      key: 'local_only',
      label: 'Hash local',
      tone: 'warning',
      description: 'Há hash local, mas sem transação on-chain.',
    };
  }
  return {
    key: 'pending',
    label: 'Pendente',
    tone: 'neutral',
    description: 'Ainda sem âncora na blockchain.',
  };
}

export function shortenHash(hash, size = 10) {
  if (!hash || typeof hash !== 'string') return '—';
  if (hash.length <= size * 2) return hash;
  return `${hash.slice(0, size)}…${hash.slice(-size)}`;
}

export function extractIntegrityFields(item) {
  const mr = item?.medical_record || item || {};
  return {
    publicId: mr.public_id || item?.public_id || item?.medical_record_public_id || null,
    hash: item?.hash || mr.hash || null,
    blockchainTxId: item?.blockchain_tx_id || mr.blockchain_tx_id || null,
    anchored: item?.anchored ?? Boolean((item?.hash || mr.hash) && (item?.blockchain_tx_id || mr.blockchain_tx_id)),
  };
}

/** Traduz mensagens comuns de validação do Pydantic/FastAPI */
export function translateApiMessage(msg) {
  if (!msg || typeof msg !== 'string') return msg;
  const map = [
    [/String should have at least (\d+) characters/i, (_, n) => `O campo deve ter pelo menos ${n} caracteres.`],
    [/ensure this value has at least (\d+) characters/i, (_, n) => `O campo deve ter pelo menos ${n} caracteres.`],
    [/value is not a valid email address/i, 'Informe um e-mail válido.'],
    [/field required/i, 'Campo obrigatório.'],
    [/Input should be a valid email/i, 'Informe um e-mail válido.'],
  ];
  for (const [re, repl] of map) {
    if (re.test(msg)) {
      return typeof repl === 'function' ? msg.replace(re, repl) : repl;
    }
  }
  return msg;
}
