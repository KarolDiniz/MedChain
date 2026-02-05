import { MOCK_PATIENTS, MOCK_MEDICAL_RECORDS, MOCK_DOCTORS } from '../data/mockData';
import { generateHashForType, HASH_TYPES } from '../utils/hashUtils';

// Pacientes - gerenciados pelo doutor
export function getPatientsByDoctor(doctorId) {
  return MOCK_PATIENTS.filter(p => p.doctor_id === doctorId);
}

export function getPatientById(id) {
  return MOCK_PATIENTS.find(p => p.id === id);
}

export function addPatient(doctorId, patientData) {
  const newPatient = {
    id: `pat-${Date.now()}`,
    type: 'patient',
    full_name: patientData.full_name,
    email: patientData.email,
    password: '12345',
    status: 'ACTIVE',
    cellphone: patientData.cellphone || '',
    birth_date: patientData.birth_date || '',
    gender: patientData.gender || 'OTHER',
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    address: patientData.address || {},
    doctor_id: doctorId,
  };
  MOCK_PATIENTS.push(newPatient);
  return newPatient;
}

export function updatePatient(id, patientData) {
  const idx = MOCK_PATIENTS.findIndex(p => p.id === id);
  if (idx === -1) return null;
  MOCK_PATIENTS[idx] = {
    ...MOCK_PATIENTS[idx],
    ...patientData,
    updated_date: new Date().toISOString(),
  };
  return MOCK_PATIENTS[idx];
}

// Prontuários médicos
export function getMedicalRecordsByPatient(patientId) {
  return MOCK_MEDICAL_RECORDS.filter(mr => mr.patient_id === patientId);
}

export function getMedicalRecordsByDoctor(doctorId) {
  return MOCK_MEDICAL_RECORDS.filter(mr => mr.doctor_id === doctorId);
}

export function getMedicalRecordById(id) {
  return MOCK_MEDICAL_RECORDS.find(mr => mr.id === id);
}

export function addMedicalRecord(doctorId, patientId) {
  const created = new Date().toISOString();
  const newRecord = {
    id: `mr-${Date.now()}`,
    patient_id: patientId,
    doctor_id: doctorId,
    created_date: created,
    updated_date: created,
    consultations: [],
    diagnostics: [],
    medical_certificates: [],
    files: [],
    blockchain_node: {
      timestamp: created,
    },
  };
  MOCK_MEDICAL_RECORDS.push(newRecord);
  return newRecord;
}

export function addConsultation(recordId, data) {
  const record = MOCK_MEDICAL_RECORDS.find(mr => mr.id === recordId);
  if (!record) return null;
  const created = new Date().toISOString();
  const consultationPayload = {
    chief_complaint: data.chief_complaint,
    history_of_present_illness: data.history_of_present_illness,
    diagnosis: data.diagnosis,
    treatment_plan: data.treatment_plan,
    created,
  };
  const newConsultation = {
    id: `cons-${Date.now()}`,
    hash: generateHashForType(HASH_TYPES.CONSULTATION, consultationPayload),
    chief_complaint: data.chief_complaint,
    history_of_present_illness: data.history_of_present_illness,
    diagnosis: data.diagnosis,
    treatment_plan: data.treatment_plan,
    created_date: created,
    prescriptions: [],
  };
  const prescriptionItems = data.prescription_items?.filter((i) => i?.medication_name?.trim()) || [];
  if (prescriptionItems.length > 0) {
    newConsultation.prescriptions.push({
      id: `presc-${Date.now()}`,
      issue_date: created,
      items: prescriptionItems,
    });
  }
  record.consultations = [...(record.consultations || []), newConsultation];
  record.updated_date = new Date().toISOString();
  return newConsultation;
}

export function addDiagnostic(recordId, data) {
  const record = MOCK_MEDICAL_RECORDS.find(mr => mr.id === recordId);
  if (!record) return null;
  const created = new Date().toISOString();
  const issueDate = data.issue_date || created;
  const diagnosticPayload = { description: data.description, issue_date: issueDate, result: data.result, created };
  const newDiagnostic = {
    id: `diag-${Date.now()}`,
    hash: generateHashForType(HASH_TYPES.DIAGNOSTIC, diagnosticPayload),
    description: data.description,
    issue_date: issueDate,
    result: data.result,
    created_date: created,
  };
  record.diagnostics = [...(record.diagnostics || []), newDiagnostic];
  record.updated_date = new Date().toISOString();
  return newDiagnostic;
}

export function addPrescription(consultationId, recordId, data) {
  const record = MOCK_MEDICAL_RECORDS.find(mr => mr.id === recordId);
  if (!record) return null;
  const consultation = record.consultations.find(c => c.id === consultationId);
  if (!consultation) return null;
  const newPrescription = {
    id: `presc-${Date.now()}`,
    issue_date: data.issue_date || new Date().toISOString(),
    items: data.items || [],
  };
  record.consultations = record.consultations.map((c) =>
    c.id === consultationId
      ? { ...c, prescriptions: [...(c.prescriptions || []), newPrescription] }
      : c
  );
  record.updated_date = new Date().toISOString();
  return newPrescription;
}

export function addMedicalCertificate(recordId, data) {
  const record = MOCK_MEDICAL_RECORDS.find(mr => mr.id === recordId);
  if (!record) return null;
  const created = new Date().toISOString();
  const certPayload = { purpose: data.purpose, period_of_leave: data.period_of_leave, created };
  const newCert = {
    id: `cert-${Date.now()}`,
    hash: generateHashForType(HASH_TYPES.CERTIFICATE, certPayload),
    purpose: data.purpose,
    period_of_leave: data.period_of_leave,
    created_date: created,
  };
  record.medical_certificates = [...(record.medical_certificates || []), newCert];
  record.updated_date = new Date().toISOString();
  return newCert;
}

export function addFile(recordId, data) {
  const record = MOCK_MEDICAL_RECORDS.find(mr => mr.id === recordId);
  if (!record) return null;
  const created = new Date().toISOString();
  const filePayload = { url: data.url, format: data.format || 'PDF', description: data.description || '', created };
  const newFile = {
    id: `file-${Date.now()}`,
    url: data.url || '#',
    format: data.format || 'PDF',
    description: data.description || '',
    created_date: created,
    hash: generateHashForType(HASH_TYPES.FILE, filePayload),
  };
  record.files = [...(record.files || []), newFile];
  record.updated_date = new Date().toISOString();
  return newFile;
}

export function getDoctorById(id) {
  return MOCK_DOCTORS.find(d => d.id === id);
}
