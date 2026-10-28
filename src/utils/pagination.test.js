import { describe, it, expect } from 'vitest';
import { getPageItems, getPaginationMeta } from './pagination';

describe('getPageItems', () => {
  it('retorna lista vazia ou [1] para casos extremos', () => {
    expect(getPageItems(1, 0)).toEqual([]);
    expect(getPageItems(1, 1)).toEqual([1]);
  });

  it('lista todas as páginas quando total <= 7', () => {
    expect(getPageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('insere reticências no início quando página atual está no final', () => {
    const items = getPageItems(10, 12);
    expect(items[0]).toBe(1);
    expect(items).toContain('ellipsis-start');
    expect(items.at(-1)).toBe(12);
    expect(items).not.toContain('ellipsis-end');
  });

  it('insere reticências no fim quando página atual está no início', () => {
    const items = getPageItems(2, 12);
    expect(items).toContain('ellipsis-end');
    expect(items).not.toContain('ellipsis-start');
    expect(items.at(-1)).toBe(12);
  });

  it('insere reticências nos dois lados no meio da lista', () => {
    const items = getPageItems(6, 12);
    expect(items).toEqual([1, 'ellipsis-start', 5, 6, 7, 'ellipsis-end', 12]);
  });
});

describe('getPaginationMeta', () => {
  it('protege página inválida e calcula fatia correta', () => {
    expect(getPaginationMeta(25, 2, 10)).toEqual({
      totalPages: 3,
      safePage: 2,
      startItem: 11,
      endItem: 20,
    });
  });

  it('clampa página acima do total e trata lista vazia', () => {
    expect(getPaginationMeta(5, 99, 10)).toEqual({
      totalPages: 1,
      safePage: 1,
      startItem: 1,
      endItem: 5,
    });
    expect(getPaginationMeta(0, 1, 12)).toEqual({
      totalPages: 1,
      safePage: 1,
      startItem: 0,
      endItem: 0,
    });
  });
});
