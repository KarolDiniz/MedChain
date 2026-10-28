import { describe, it, expect } from 'vitest';
import {
  resolvePatientPublicId,
  resolveUserPublicId,
  resolvePatientRouteId,
  resolveDoctorId,
  sameId,
  findPatientByAnyId,
} from './ids';

describe('resolvePatientPublicId / resolveUserPublicId', () => {
  it('retorna null para entradas inválidas', () => {
    expect(resolvePatientPublicId(null)).toBeNull();
    expect(resolveUserPublicId('x')).toBeNull();
  });

  it('não mistura patient_public_id com uid', () => {
    const entity = {
      patient_public_id: 'pat-1',
      uid: 'user-1',
      user_public_id: 'user-1',
    };
    expect(resolvePatientPublicId(entity)).toBe('pat-1');
    expect(resolveUserPublicId(entity)).toBe('user-1');
  });

  it('aceita patient_id como fallback clínico', () => {
    expect(resolvePatientPublicId({ patient_id: 'p-9' })).toBe('p-9');
  });
});

describe('resolvePatientRouteId', () => {
  it('prioriza patient_public_id, depois id, depois uid', () => {
    expect(resolvePatientRouteId({ patient_public_id: 'a', id: 'b', uid: 'c' })).toBe('a');
    expect(resolvePatientRouteId({ id: 'b', uid: 'c' })).toBe('b');
    expect(resolvePatientRouteId({ uid: 'c' })).toBe('c');
  });
});

describe('resolveDoctorId', () => {
  it('usa public_id ou id', () => {
    expect(resolveDoctorId({ public_id: 'doc-1', id: 2 })).toBe('doc-1');
    expect(resolveDoctorId({ id: 2 })).toBe(2);
    expect(resolveDoctorId(null)).toBeNull();
  });
});

describe('sameId', () => {
  it('compara com coerção de string e rejeita null', () => {
    expect(sameId(1, '1')).toBe(true);
    expect(sameId(null, '1')).toBe(false);
    expect(sameId('a', 'b')).toBe(false);
  });
});

describe('findPatientByAnyId', () => {
  const patients = [
    { patient_public_id: 'pat-1', id: 'legacy-1', uid: 'user-1' },
    { patient_public_id: 'pat-2', user_public_id: 'user-2' },
  ];

  it('encontra por qualquer identificador conhecido', () => {
    expect(findPatientByAnyId(patients, 'pat-1')?.patient_public_id).toBe('pat-1');
    expect(findPatientByAnyId(patients, 'legacy-1')?.id).toBe('legacy-1');
    expect(findPatientByAnyId(patients, 'user-2')?.patient_public_id).toBe('pat-2');
  });

  it('retorna null quando id ou lista é inválida', () => {
    expect(findPatientByAnyId(patients, null)).toBeNull();
    expect(findPatientByAnyId(null, 'pat-1')).toBeNull();
    expect(findPatientByAnyId(patients, 'missing')).toBeNull();
  });
});
