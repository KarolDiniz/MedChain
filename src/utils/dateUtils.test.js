import { describe, it, expect } from 'vitest';
import {
  parseDate,
  formatDateBR,
  formatDateTimeBR,
  resolveItemDate,
  resolveItemDateISO,
} from './dateUtils';

describe('parseDate', () => {
  it('retorna null para valores vazios ou inválidos', () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate('')).toBeNull();
    expect(parseDate('not-a-date')).toBeNull();
  });

  it('aceita Date e strings ISO válidas', () => {
    const date = new Date('2024-06-15T12:00:00.000Z');
    expect(parseDate(date)).toBe(date);
    expect(parseDate('2024-06-15T12:00:00.000Z')?.toISOString()).toBe(
      '2024-06-15T12:00:00.000Z',
    );
  });
});

describe('formatDateBR / formatDateTimeBR', () => {
  it('retorna traço para datas inválidas', () => {
    expect(formatDateBR(null)).toBe('—');
    expect(formatDateTimeBR('')).toBe('—');
  });

  it('formata data válida no locale pt-BR', () => {
    const formatted = formatDateBR('2024-01-15T15:00:00.000Z', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    expect(formatted).toBe('15/01/2024');
  });
});

describe('resolveItemDate', () => {
  it('retorna null quando item é nulo', () => {
    expect(resolveItemDate(null)).toBeNull();
  });

  it('prioriza issue_date para diagnósticos', () => {
    const item = {
      issue_date: '2024-03-01T10:00:00.000Z',
      created_date: '2024-02-01T10:00:00.000Z',
      medical_record: { created_date: '2024-01-01T10:00:00.000Z' },
    };
    expect(resolveItemDate(item, 'diagnostic')?.toISOString()).toBe(
      '2024-03-01T10:00:00.000Z',
    );
  });

  it('usa fallbacks de arquivo (created_date → uploaded_at → created)', () => {
    expect(
      resolveItemDate({ uploaded_at: '2024-05-01T00:00:00.000Z' }, 'file')?.toISOString(),
    ).toBe('2024-05-01T00:00:00.000Z');

    expect(
      resolveItemDate({ created: '2024-04-01T00:00:00.000Z' }, 'file')?.toISOString(),
    ).toBe('2024-04-01T00:00:00.000Z');
  });

  it('usa medical_record.created_date como fallback genérico', () => {
    const item = {
      medical_record: { created_date: '2024-07-10T08:00:00.000Z' },
    };
    expect(resolveItemDate(item)?.toISOString()).toBe('2024-07-10T08:00:00.000Z');
  });
});

describe('resolveItemDateISO', () => {
  it('retorna ISO ou null', () => {
    expect(resolveItemDateISO({ created_date: '2024-08-01T00:00:00.000Z' })).toBe(
      '2024-08-01T00:00:00.000Z',
    );
    expect(resolveItemDateISO({})).toBeNull();
  });
});
