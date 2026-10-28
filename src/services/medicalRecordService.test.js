import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./api', () => ({
  patientsApi: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  doctorsApi: {
    list: vi.fn(),
    getPatients: vi.fn(),
    getDashboardStats: vi.fn(),
  },
  medicalRecordsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    verify: vi.fn(),
  },
  filesApi: {
    listByPatient: vi.fn(),
    upload: vi.fn(),
  },
}));

import {
  patientsApi,
  doctorsApi,
  medicalRecordsApi,
  filesApi,
} from './api';
import {
  getPatientsByDoctor,
  getPatientById,
  addPatient,
  getMedicalRecordsByDoctor,
  getMedicalRecordsByPatient,
  getMedicalRecordById,
  getAuditTimeline,
  addConsultation,
  addDiagnostic,
  addMedicalCertificate,
  addFile,
  getDashboardStats,
  getDoctorById,
  verifyMedicalRecord,
} from './medicalRecordService';

describe('medicalRecordService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapeamento de pacientes', () => {
    it('retorna lista vazia sem doctorId', async () => {
      expect(await getPatientsByDoctor(null)).toEqual([]);
      expect(doctorsApi.getPatients).not.toHaveBeenCalled();
    });

    it('normaliza endereço e separa patient_public_id de uid', async () => {
      doctorsApi.getPatients.mockResolvedValue([
        {
          patient_public_id: 'pat-1',
          uid: 'user-1',
          full_name: 'Maria',
          cellphone: '81999999999',
          birth_date: '1990-01-01',
          address: { street: 'Rua A', city: 'Recife', state: 'PE' },
        },
      ]);

      const [patient] = await getPatientsByDoctor('doc-1');
      expect(patient.patient_public_id).toBe('pat-1');
      expect(patient.uid).toBe('user-1');
      expect(patient.id).toBe('pat-1');
      expect(patient.address.street).toBe('Rua A');
      expect(patient.address.city).toBe('Recife');
      expect(patient.phone).toBe('81999999999');
    });

    it('mapeia gênero corretamente ao criar paciente', async () => {
      patientsApi.create.mockResolvedValue({
        uid: 'user-9',
        patient_public_id: 'pat-9',
        name: 'João',
      });

      await addPatient('doc-1', {
        full_name: 'João',
        gender: 'MALE',
        birth_date: '1985-05-05',
        cellphone: '81988887777',
        password: 'senha123',
        address: { street: 'Rua B', city: 'Olinda', state: 'PE' },
      });

      expect(patientsApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'João',
          gender: 0,
          phone: '81988887777',
          address_street: 'Rua B',
          address_city: 'Olinda',
        }),
      );

      patientsApi.create.mockResolvedValue({ uid: 'u2', patient_public_id: 'p2', name: 'Ana' });
      await addPatient('doc-1', { full_name: 'Ana', gender: 'FEMALE' });
      expect(patientsApi.create.mock.calls.at(-1)[0].gender).toBe(1);
    });
  });

  describe('agrupamento de prontuários', () => {
    it('agrupa consulta/diagnóstico/atestado/arquivo do mesmo médico-paciente', async () => {
      medicalRecordsApi.list.mockResolvedValue({
        consultations: [
          {
            id: 1,
            created_date: '2024-01-02T10:00:00.000Z',
            chief_complaint: 'Dor',
            medical_record: {
              public_id: 'mr-1',
              doctor_id: 'doc-1',
              patient_id: 'pat-1',
              created_date: '2024-01-01T10:00:00.000Z',
              hash: 'h1',
              blockchain_tx_id: 'tx1',
            },
          },
        ],
        diagnostics: [
          {
            id: 2,
            issue_date: '2024-01-03T10:00:00.000Z',
            description: 'Exame',
            medical_record: {
              public_id: 'mr-1',
              doctor_id: 'doc-1',
              patient_id: 'pat-1',
            },
          },
        ],
        medical_certificates: [
          {
            id: 3,
            created_date: '2024-01-04T10:00:00.000Z',
            purpose: 'Repouso',
            medical_record: {
              public_id: 'mr-1',
              doctor_id: 'doc-1',
              patient_id: 'pat-1',
            },
          },
        ],
      });
      filesApi.listByPatient.mockResolvedValue([
        {
          id: 'f1',
          doctor_uid: 'doc-1',
          patient_uid: 'pat-1',
          created_date: '2024-01-05T10:00:00.000Z',
          hash: 'filehash',
          description: 'RX',
        },
      ]);

      const groups = await getMedicalRecordsByDoctor('doc-1');
      expect(groups).toHaveLength(1);
      expect(groups[0].consultations).toHaveLength(1);
      expect(groups[0].diagnostics).toHaveLength(1);
      expect(groups[0].medical_certificates).toHaveLength(1);
      expect(groups[0].files).toHaveLength(1);
      expect(groups[0].consultations[0].anchored).toBe(true);
      expect(groups[0].created_date).toBe('2024-01-04T10:00:00.000Z');
    });

    it('filtra por paciente e tolera falha ao listar arquivos', async () => {
      medicalRecordsApi.list.mockResolvedValue({
        consultations: [
          {
            id: 1,
            medical_record: { doctor_id: 'doc-1', patient_id: 'pat-1', public_id: 'mr-1' },
          },
          {
            id: 2,
            medical_record: { doctor_id: 'doc-1', patient_id: 'pat-2', public_id: 'mr-2' },
          },
        ],
        diagnostics: [],
        medical_certificates: [],
      });
      filesApi.listByPatient.mockRejectedValue(new Error('fail'));

      const groups = await getMedicalRecordsByPatient('pat-1');
      expect(groups).toHaveLength(1);
      expect(groups[0].patient_id).toBe('pat-1');
      expect(groups[0].files).toEqual([]);
    });

    it('retorna [] sem doctorId', async () => {
      expect(await getMedicalRecordsByDoctor(undefined)).toEqual([]);
    });
  });

  describe('detalhe, auditoria e criação', () => {
    it('monta detalhe com integridade e arquivos', async () => {
      medicalRecordsApi.get.mockResolvedValue({
        public_id: 'mr-1',
        patient_id: 'pat-1',
        hash: 'h',
        blockchain_tx_id: 'tx',
        consultation: { id: 1, chief_complaint: 'Dor' },
        diagnostic: null,
        certificate: null,
      });
      filesApi.listByPatient.mockResolvedValue([{ id: 'f1' }]);

      const detail = await getMedicalRecordById('mr-1');
      expect(detail.id).toBe('mr-1');
      expect(detail.anchored).toBe(true);
      expect(detail.consultations).toHaveLength(1);
      expect(detail.files).toHaveLength(1);
    });

    it('gera timeline ordenada do mais recente ao mais antigo', async () => {
      medicalRecordsApi.list.mockResolvedValue({
        consultations: [
          {
            id: 1,
            created_date: '2024-01-01T10:00:00.000Z',
            chief_complaint: 'Consulta antiga',
            medical_record: { doctor_id: 'doc-1', patient_id: 'pat-1', public_id: 'mr-1' },
          },
        ],
        diagnostics: [
          {
            id: 2,
            issue_date: '2024-02-01T10:00:00.000Z',
            description: 'Diag novo',
            medical_record: { doctor_id: 'doc-1', patient_id: 'pat-1', public_id: 'mr-1' },
          },
        ],
        medical_certificates: [],
      });
      filesApi.listByPatient.mockResolvedValue([]);

      const events = await getAuditTimeline('doc-1');
      expect(events[0].kind).toBe('diagnostic');
      expect(events[1].kind).toBe('consultation');
    });

    it('cria payloads tipados para consulta, diagnóstico e atestado', async () => {
      medicalRecordsApi.create.mockResolvedValue({ id: 'ok' });

      await addConsultation('doc-1', 'pat-1', {
        chief_complaint: 'Dor',
        prescription_items: [{ drug: 'Dipirona' }],
      });
      expect(medicalRecordsApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'consultation',
          data: expect.objectContaining({
            doctor_id: 'doc-1',
            patient_id: 'pat-1',
            prescription: { items: [expect.objectContaining({ drug: 'Dipirona' })] },
          }),
        }),
      );

      await addDiagnostic('doc-1', 'pat-1', { description: 'RX', result: 'Normal' });
      expect(medicalRecordsApi.create.mock.calls.at(-1)[0].type).toBe('diagnostic');

      await addMedicalCertificate('doc-1', 'pat-1', { purpose: 'Repouso', period_of_leave: 2 });
      expect(medicalRecordsApi.create.mock.calls.at(-1)[0]).toEqual({
        type: 'medical_certificate',
        data: {
          doctor_id: 'doc-1',
          patient_id: 'pat-1',
          purpose: 'Repouso',
          period_of_leave: 2,
        },
      });
    });

    it('addFile exige patientUid e monta FormData', async () => {
      await expect(addFile(null, new File(['x'], 'a.pdf'))).rejects.toThrow(
        /ID do paciente inválido/i,
      );

      filesApi.upload.mockResolvedValue({ id: 'f1' });
      const file = new File(['conteudo'], 'exame.pdf', { type: 'application/pdf' });
      await addFile('pat-1', file, 'Laudo');

      const formData = filesApi.upload.mock.calls[0][0];
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get('patient_uid')).toBe('pat-1');
      expect(formData.get('description')).toBe('Laudo');
      expect(formData.get('file')).toBeInstanceOf(File);
    });
  });

  describe('helpers de suporte', () => {
    it('getDashboardStats e getDoctorById tratam falhas', async () => {
      expect(await getDashboardStats(null)).toBeNull();
      doctorsApi.getDashboardStats.mockRejectedValue(new Error('down'));
      expect(await getDashboardStats('doc-1')).toBeNull();

      doctorsApi.list.mockRejectedValue(new Error('down'));
      expect(await getDoctorById('doc-1')).toBeNull();

      doctorsApi.list.mockResolvedValue([{ public_id: 'doc-2', full_name: 'Dr' }]);
      expect(await getDoctorById('doc-2')).toMatchObject({ public_id: 'doc-2' });
    });

    it('getPatientById e verifyMedicalRecord delegam à API', async () => {
      patientsApi.get.mockResolvedValue({
        patient_public_id: 'pat-1',
        uid: 'user-1',
        full_name: 'Maria',
      });
      const patient = await getPatientById('pat-1');
      expect(patient.patient_public_id).toBe('pat-1');

      medicalRecordsApi.verify.mockResolvedValue({ valid: true });
      expect(await verifyMedicalRecord('mr-1')).toEqual({ valid: true });
    });
  });
});
