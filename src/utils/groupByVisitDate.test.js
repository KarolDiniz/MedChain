import { describe, it, expect } from 'vitest';
import {
  groupRecordItemsByVisitDate,
  formatDateKey,
  summarizeVisit,
} from './groupByVisitDate';

describe('groupRecordItemsByVisitDate', () => {
  const record = {
    consultations: [
      { id: 1, created_date: '2024-05-10T14:00:00.000Z' },
      { id: 2, created_date: '2024-05-11T10:00:00.000Z' },
    ],
    diagnostics: [
      { id: 3, issue_date: '2024-05-10T09:00:00.000Z' },
    ],
    medical_certificates: [
      { id: 4, created_date: '2024-05-11T18:00:00.000Z' },
    ],
    files: [
      { id: 5, created_date: '2024-05-10T12:00:00.000Z' },
      { id: 6, description: 'sem data' },
    ],
  };

  it('agrupa por dia civil e separa arquivos sem data', () => {
    const { visits, undatedFiles } = groupRecordItemsByVisitDate(record);

    expect(undatedFiles).toHaveLength(1);
    expect(undatedFiles[0].id).toBe(6);

    const may10 = visits.find((v) => v.dateKey.includes('05-10') || v.consultations.some((c) => c.id === 1));
    expect(may10).toBeTruthy();
    expect(may10.consultations.map((c) => c.id)).toContain(1);
    expect(may10.diagnostics.map((d) => d.id)).toContain(3);
    expect(may10.files.map((f) => f.id)).toContain(5);
    expect(may10.count).toBeGreaterThanOrEqual(3);
  });

  it('ordena visitas recentes primeiro por padrão e oldest quando solicitado', () => {
    const recent = groupRecordItemsByVisitDate(record, 'recent').visits;
    const oldest = groupRecordItemsByVisitDate(record, 'oldest').visits;

    expect(recent[0].dateKey >= recent.at(-1).dateKey).toBe(true);
    expect(oldest[0].dateKey <= oldest.at(-1).dateKey).toBe(true);
  });

  it('ignora itens sem data resolvível e aceita record vazio', () => {
    const { visits, undatedFiles } = groupRecordItemsByVisitDate({
      consultations: [{ id: 9 }],
      files: [{ id: 10 }],
    });
    expect(visits).toEqual([]);
    expect(undatedFiles).toHaveLength(1);
    expect(groupRecordItemsByVisitDate(null).visits).toEqual([]);
  });
});

describe('formatDateKey / summarizeVisit', () => {
  it('formata chave YYYY-MM-DD e trata ausência', () => {
    expect(formatDateKey(null)).toBe('Sem data');
    expect(formatDateKey('2024-03-05')).toMatch(/2024/);
  });

  it('resume contagens da visita', () => {
    expect(
      summarizeVisit({
        consultations: [1],
        diagnostics: [1, 2],
        medical_certificates: [],
        files: [1],
      }),
    ).toBe('1 consulta(s) · 2 diagnóstico(s) · 1 arquivo(s)');

    expect(summarizeVisit({})).toBe('Sem itens');
  });
});
