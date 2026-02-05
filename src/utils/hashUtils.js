/**
 * Utilitário de hashes por tipo de prontuário.
 * Cada tipo (consulta, diagnóstico, prescrição, atestado, arquivo, prontuário)
 * gera um hash com prefixo distinto para auditoria e rastreabilidade.
 */

export const HASH_TYPES = {
  RECORD: 'RECORD',           // Prontuário (bloco principal)
  CONSULTATION: 'CONSULTATION',
  DIAGNOSTIC: 'DIAGNOSTIC',
  PRESCRIPTION: 'PRESCRIPTION',
  CERTIFICATE: 'CERTIFICATE',
  FILE: 'FILE',
};

/** Prefixos visuais por tipo — aparecem no início do hash para identificação rápida */
const TYPE_PREFIX = {
  [HASH_TYPES.RECORD]: 'mr',
  [HASH_TYPES.CONSULTATION]: 'con',
  [HASH_TYPES.DIAGNOSTIC]: 'dia',
  [HASH_TYPES.PRESCRIPTION]: 'pre',
  [HASH_TYPES.CERTIFICATE]: 'cert',
  [HASH_TYPES.FILE]: 'file',
};

/**
 * Algoritmo de hash não criptográfico para fingerprint de conteúdo.
 * Produz string hex estável para o mesmo input.
 */
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

/**
 * Gera fingerprint estável a partir de um objeto (chaves ordenadas).
 */
function contentFingerprint(payload) {
  if (payload == null) return '';
  try {
    const flat = typeof payload === 'object'
      ? JSON.stringify(payload, Object.keys(payload).sort())
      : String(payload);
    return hashString(flat);
  } catch {
    return hashString(String(payload));
  }
}

/**
 * Gera um hash único para um tipo de prontuário.
 * Formato: {prefixo}-{fingerprint}-{nonce} (ex: con-a1b2c3d4-e5f6g7h8)
 *
 * @param {string} type - Um dos HASH_TYPES
 * @param {object} payload - Dados usados para o fingerprint (opcional)
 * @returns {string} Hash com prefixo do tipo
 */
export function generateHashForType(type, payload = {}) {
  const prefix = TYPE_PREFIX[type] ?? 'unk';
  const fingerprint = contentFingerprint(payload);
  const nonce = hashString(`${Date.now()}-${Math.random()}`);
  const combined = `${fingerprint}-${nonce}`.slice(0, 24);
  return `${prefix}-${combined}`;
}

/**
 * Retorna o prefixo do tipo a partir de um hash (para exibição/auditoria).
 */
export function getHashTypePrefix(hash) {
  if (!hash || typeof hash !== 'string') return null;
  const match = hash.match(/^([a-z]+)-/);
  return match ? match[1] : null;
}

/**
 * Label amigável do tipo para exibição.
 */
export const HASH_TYPE_LABELS = {
  [HASH_TYPES.RECORD]: 'Prontuário',
  [HASH_TYPES.CONSULTATION]: 'Consulta',
  [HASH_TYPES.DIAGNOSTIC]: 'Diagnóstico',
  [HASH_TYPES.PRESCRIPTION]: 'Prescrição',
  [HASH_TYPES.CERTIFICATE]: 'Atestado',
  [HASH_TYPES.FILE]: 'Arquivo',
};
