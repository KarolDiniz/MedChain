import { MOCK_PATIENTS, MOCK_MEDICAL_RECORDS, MOCK_DOCTORS } from '../data/mockData';

const generateHash = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

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
  const newRecord = {
    id: `mr-${Date.now()}`,
    patient_id: patientId,
    doctor_id: doctorId,
    hash: generateHash(),
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    consultations: [],
    diagnostics: [],
    medical_certificates: [],
    files: [],
    blockchain_node: {
      hash: generateHash(),
      timestamp: new Date().toISOString(),
    },
  };
  MOCK_MEDICAL_RECORDS.push(newRecord);
  return newRecord;
}

export function addConsultation(recordId, data) {
  const record = MOCK_MEDICAL_RECORDS.find(mr => mr.id === recordId);
  if (!record) return null;
  const newConsultation = {
    id: `cons-${Date.now()}`,
    chief_complaint: data.chief_complaint,
    history_of_present_illness: data.history_of_present_illness,
    diagnosis: data.diagnosis,
    treatment_plan: data.treatment_plan,
    created_date: new Date().toISOString(),
    prescriptions: [],
  };
  record.consultations.push(newConsultation);
  record.updated_date = new Date().toISOString();
  return newConsultation;
}

export function addDiagnostic(recordId, data) {
  const record = MOCK_MEDICAL_RECORDS.find(mr => mr.id === recordId);
  if (!record) return null;
  const newDiagnostic = {
    id: `diag-${Date.now()}`,
    description: data.description,
    issue_date: data.issue_date || new Date().toISOString(),
    result: data.result,
    created_date: new Date().toISOString(),
  };
  record.diagnostics.push(newDiagnostic);
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
  consultation.prescriptions = consultation.prescriptions || [];
  consultation.prescriptions.push(newPrescription);
  record.updated_date = new Date().toISOString();
  return newPrescription;
}

export function addMedicalCertificate(recordId, data) {
  const record = MOCK_MEDICAL_RECORDS.find(mr => mr.id === recordId);
  if (!record) return null;
  const newCert = {
    id: `cert-${Date.now()}`,
    purpose: data.purpose,
    period_of_leave: data.period_of_leave,
    created_date: new Date().toISOString(),
  };
  record.medical_certificates.push(newCert);
  record.updated_date = new Date().toISOString();
  return newCert;
}

export function addFile(recordId, data) {
  const record = MOCK_MEDICAL_RECORDS.find(mr => mr.id === recordId);
  if (!record) return null;
  const newFile = {
    id: `file-${Date.now()}`,
    url: data.url || '#',
    format: data.format || 'PDF',
    description: data.description || '',
    hash: generateHash(),
  };
  record.files.push(newFile);
  record.updated_date = new Date().toISOString();
  return newFile;
}

export function getDoctorById(id) {
  return MOCK_DOCTORS.find(d => d.id === id);
}
