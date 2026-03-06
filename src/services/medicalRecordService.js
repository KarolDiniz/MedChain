import { patientsApi, doctorsApi, medicalRecordsApi } from './api';

function mapPatient(p) {
  return {
    id: p.uid || p.id,
    uid: p.uid || p.id,
    full_name: p.full_name || p.name,
    name: p.name || p.full_name,
    email: p.email,
    cellphone: p.cellphone || p.phone,
    phone: p.phone || p.cellphone,
    birth_date: p.birth_date || p.dateofbirth,
    dateofbirth: p.dateofbirth || p.birth_date,
    gender: p.gender,
    status: p.status,
    address: p.address || {},
  };
}

export async function getPatientsByDoctor(doctorId) {
  try {
    const list = await patientsApi.list();
    return (list || []).map(mapPatient);
  } catch {
    return [];
  }
}

export async function getPatientById(id) {
  try {
    const p = await patientsApi.get(id);
    return mapPatient(p);
  } catch {
    return null;
  }
}

export async function addPatient(doctorId, patientData) {
  const res = await patientsApi.create({
    name: patientData.full_name || patientData.name,
    dateofbirth: patientData.birth_date || patientData.dateofbirth,
    gender: patientData.gender === 'FEMALE' ? 1 : patientData.gender === 'MALE' ? 0 : 2,
    email: patientData.email,
    phone: patientData.cellphone || patientData.phone,
    status: 1,
    address_street: patientData.address?.street || '',
    address_number: patientData.address?.number || '',
    address_complement: patientData.address?.complement || '',
    address_neighborhood: patientData.address?.neighborhood || '',
    address_city: patientData.address?.city || '',
    address_state: patientData.address?.state || '',
  });
  return mapPatient({ ...res, uid: res.uid, id: res.uid });
}

export async function updatePatient(id, patientData) {
  await patientsApi.update(id, patientData);
  return getPatientById(id);
}

export async function getMedicalRecordsByPatient(patientId) {
  try {
    const data = await medicalRecordsApi.list();
    const list = data?.consultations || data?.diagnostics || data?.medical_certificates || (Array.isArray(data) ? data : []);
    return list.filter((mr) => String(mr.patient_id || mr.patient?.public_id) === String(patientId));
  } catch {
    return [];
  }
}

export async function getMedicalRecordsByDoctor(doctorId) {
  try {
    const data = await medicalRecordsApi.list();
    const list = data?.consultations || data?.diagnostics || data?.medical_certificates || (Array.isArray(data) ? data : []);
    return list.filter((mr) => String(mr.doctor_id || mr.doctor?.public_id) === String(doctorId));
  } catch {
    return [];
  }
}

export async function getMedicalRecordById(id) {
  try {
    return await medicalRecordsApi.get(id);
  } catch {
    return null;
  }
}

export async function addMedicalRecord(doctorId, patientId) {
  return medicalRecordsApi.create({
    doctor_id: doctorId,
    patient_id: patientId,
  });
}

export async function getDoctorById(id) {
  try {
    const list = await doctorsApi.list();
    const d = (list || []).find((x) => String(x.id || x.public_id || x.uid) === String(id));
    return d || null;
  } catch {
    return null;
  }
}

export const addConsultation = async (recordId, data) => {
  throw new Error('Use medicalRecordsApi para consultas - integração pendente');
};

export const addDiagnostic = addConsultation;
export const addPrescription = addConsultation;
export const addMedicalCertificate = addConsultation;
export const addFile = addConsultation;
