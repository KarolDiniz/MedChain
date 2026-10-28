import { describe, it, expect } from 'vitest';
import { buildCertificatePdfContext } from './certificatePdf';

describe('buildCertificatePdfContext', () => {
  it('monta contexto com defaults seguros', () => {
    const ctx = buildCertificatePdfContext({});
    expect(ctx.purpose).toBe('Afastamento');
    expect(ctx.days).toBe(1);
    expect(ctx.patientName).toBe('Paciente');
    expect(ctx.doctorName).toBe('Médico(a)');
    expect(ctx.doctorSpecialty).toBe('—');
    expect(ctx.leaveStart).toBeInstanceOf(Date);
    expect(ctx.leaveEnd).toBeInstanceOf(Date);
  });

  it('calcula período de afastamento e prioriza extras sobre medical_record', () => {
    const issued = new Date(2024, 0, 10);
    const ctx = buildCertificatePdfContext(
      {
        purpose: 'Repouso',
        period_of_leave: 3,
        created_date: issued.toISOString(),
        medical_record: {
          public_id: 'mr-9',
          patient: { user: { full_name: 'Ana API' }, birth_date: '1990-01-01' },
          doctor: { CRM: '12345', specialty: 'CARDIOLOGY', user: { full_name: 'Dr API' } },
        },
      },
      {
        patientName: 'Ana Override',
        doctorName: 'Dr Override',
        doctorSpecialty: 'PEDIATRICS',
        patientCity: 'Recife',
        patientState: 'PE',
      },
    );

    expect(ctx.purpose).toBe('Repouso');
    expect(ctx.days).toBe(3);
    expect(ctx.patientName).toBe('Ana Override');
    expect(ctx.doctorName).toBe('Dr Override');
    expect(ctx.doctorSpecialty).toBe('Pediatria');
    expect(ctx.patientCity).toBe('Recife');
    expect(ctx.patientState).toBe('PE');
    expect(ctx.documentId).toBe('mr-9');
    expect(ctx.leaveEnd.getDate()).toBe(12);
  });

  it('normaliza period_of_leave inválido para no mínimo 1 dia', () => {
    const ctx = buildCertificatePdfContext({ period_of_leave: 0 });
    expect(ctx.days).toBe(1);
  });

  it('mapeia especialidade conhecida e preserva valor desconhecido', () => {
    expect(
      buildCertificatePdfContext({}, { doctorSpecialty: 'neurology' }).doctorSpecialty,
    ).toBe('Neurologia');
    expect(
      buildCertificatePdfContext({}, { doctorSpecialty: 'Custom' }).doctorSpecialty,
    ).toBe('Custom');
  });
});
