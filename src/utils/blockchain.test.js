import { describe, it, expect } from 'vitest';
import {
  getSolanaExplorerUrl,
  getIntegrityStatus,
  shortenHash,
  extractIntegrityFields,
  translateApiMessage,
} from './blockchain';

describe('getSolanaExplorerUrl', () => {
  it('retorna null sem tx e monta URL com cluster', () => {
    expect(getSolanaExplorerUrl(null)).toBeNull();
    expect(getSolanaExplorerUrl('abc123')).toBe(
      'https://explorer.solana.com/tx/abc123?cluster=devnet',
    );
    expect(getSolanaExplorerUrl('abc123', 'mainnet-beta')).toContain('cluster=mainnet-beta');
  });
});

describe('getIntegrityStatus', () => {
  it('classifica anchored, local_only e pending', () => {
    expect(getIntegrityStatus({ anchored: true }).key).toBe('anchored');
    expect(
      getIntegrityStatus({ hash: 'h', blockchain_tx_id: 'tx' }).key,
    ).toBe('anchored');
    expect(getIntegrityStatus({ hash: 'h' }).key).toBe('local_only');
    expect(getIntegrityStatus({}).key).toBe('pending');
  });
});

describe('shortenHash', () => {
  it('retorna traço para inválidos e encurta hashes longos', () => {
    expect(shortenHash(null)).toBe('—');
    expect(shortenHash(123)).toBe('—');
    expect(shortenHash('abcdef')).toBe('abcdef');
    expect(shortenHash('abcdefghijklmnopqrstuvwxyz', 4)).toBe('abcd…wxyz');
  });
});

describe('extractIntegrityFields', () => {
  it('extrai campos do item ou do medical_record aninhado', () => {
    const fromNested = extractIntegrityFields({
      medical_record: {
        public_id: 'mr-1',
        hash: 'hash-1',
        blockchain_tx_id: 'tx-1',
      },
    });
    expect(fromNested).toMatchObject({
      publicId: 'mr-1',
      hash: 'hash-1',
      blockchainTxId: 'tx-1',
      anchored: true,
    });

    const fromFlat = extractIntegrityFields({
      public_id: 'mr-2',
      hash: 'hash-2',
    });
    expect(fromFlat.anchored).toBe(false);
    expect(fromFlat.hash).toBe('hash-2');
  });
});

describe('translateApiMessage', () => {
  it.each([
    ['String should have at least 8 characters', 'O campo deve ter pelo menos 8 caracteres.'],
    ['value is not a valid email address', 'Informe um e-mail válido.'],
    ['field required', 'Campo obrigatório.'],
    ['Input should be a valid email', 'Informe um e-mail válido.'],
    ['mensagem desconhecida', 'mensagem desconhecida'],
  ])('traduz "%s"', (input, expected) => {
    expect(translateApiMessage(input)).toBe(expected);
  });

  it('preserva valores não-string', () => {
    expect(translateApiMessage(null)).toBeNull();
    expect(translateApiMessage(42)).toBe(42);
  });
});
