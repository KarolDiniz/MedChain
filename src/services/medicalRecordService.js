import { patientsApi, doctorsApi, medicalRecordsApi } from './api';

function mapPatient(p) {
  return {
    id: p.uid || p.id,
    uid: p.uid || p.id,
    patient_public_id: p.patient_public_id || p.uid,
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
    if (!doctorId) return [];
    const list = await doctorsApi.getPatients(doctorId);
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
    password: patientData.password,
    status: 1,
    address_street: patientData.address?.street || '',
    address_number: patientData.address?.number || '',
    address_complement: patientData.address?.complement || '',
    address_neighborhood: patientData.address?.neighborhood || '',
    address_city: patientData.address?.city || '',
    address_state: patientData.address?.state || '',
  });
  return mapPatient({ ...res, uid: res.uid, id: res.uid, patient_public_id: res.patient_public_id });
}

export async function updatePatient(id, patientData) {
  await patientsApi.update(id, patientData);
  return getPatientById(id);
}

function groupRecordsByDoctorPatient(consultations, diagnostics, certificates) {
  const map = new Map();
  const key = (d, p) => `${d}|${p}`;
  const add = (item, type) => {
    const mr = item.medical_record || item;
    const did = mr.doctor_id ?? mr.doctor?.public_id;
    const pid = mr.patient_id ?? mr.patient?.public_id;
    if (!did || !pid) return;
    const k = key(did, pid);
    if (!map.has(k)) {
      map.set(k, {
        id: mr.public_id,
        public_id: mr.public_id,
        doctor_id: did,
        patient_id: pid,
        created_date: mr.created_date,
        consultations: [],
        diagnostics: [],
        medical_certificates: [],
      });
    }
    const rec = map.get(k);
    if (type === 'consultation') {
      rec.consultations.push(item);
      if (item.created_date && (!rec.created_date || new Date(item.created_date) > new Date(rec.created_date))) {
        rec.created_date = item.created_date;
      }
    } else if (type === 'diagnostic') {
      rec.diagnostics.push(item);
      const d = item.issue_date || item.created_date;
      if (d && (!rec.created_date || new Date(d) > new Date(rec.created_date))) rec.created_date = d;
    } else if (type === 'certificate') {
      rec.medical_certificates.push(item);
      if (item.created_date && (!rec.created_date || new Date(item.created_date) > new Date(rec.created_date))) {
        rec.created_date = item.created_date;
      }
    }
  };
  (consultations || []).forEach((c) => add(c, 'consultation'));
  (diagnostics || []).forEach((d) => add(d, 'diagnostic'));
  (certificates || []).forEach((c) => add(c, 'certificate'));
  return Array.from(map.values());
}

export async function getMedicalRecordsByPatient(patientId) {
  try {
    const data = await medicalRecordsApi.list();
    const consultations = data?.consultations || [];
    const diagnostics = data?.diagnostics || [];
    const certificates = data?.medical_certificates || [];
    const patientIdStr = String(patientId);
    const filtered = groupRecordsByDoctorPatient(
      consultations.filter((c) => {
        const pid = c.medical_record?.patient_id ?? c.patient_id ?? c.patient?.public_id;
        return pid && String(pid) === patientIdStr;
      }),
      diagnostics.filter((d) => {
        const pid = d.medical_record?.patient_id ?? d.patient_id ?? d.patient?.public_id;
        return pid && String(pid) === patientIdStr;
      }),
      certificates.filter((c) => {
        const pid = c.medical_record?.patient_id ?? c.patient_id ?? c.patient?.public_id;
        return pid && String(pid) === patientIdStr;
      })
    );
    return filtered;
  } catch {
    return [];
  }
}

export async function getMedicalRecordsByDoctor(doctorId) {
  try {
    if (!doctorId) return [];
    const data = await medicalRecordsApi.list(null, doctorId);
    const consultations = data?.consultations || [];
    const diagnostics = data?.diagnostics || [];
    const certificates = data?.medical_certificates || [];
    return groupRecordsByDoctorPatient(consultations, diagnostics, certificates);
  } catch {
    return [];
  }
}

export async function getMedicalRecordById(id) {
  try {
    const mr = await medicalRecordsApi.get(id);
    if (!mr) return null;
    return {
      ...mr,
      id: mr.public_id ?? mr.id,
      consultations: mr.consultation ? [mr.consultation] : [],
      diagnostics: mr.diagnostic ? [mr.diagnostic] : [],
      medical_certificates: mr.certificate ? [mr.certificate] : [],
      files: mr.files || [],
    };
  } catch {
    return null;
  }
}

export async function addMedicalRecord(doctorId, patientId, type = 'consultation', data = {}) {
  const payload = {
    type,
    data: {
      doctor_id: String(doctorId || ''),
      patient_id: String(patientId || ''),
      chief_complaint: data.chief_complaint || '',
      history_of_present_illness: data.history_of_present_illness || '',
      diagnosis: data.diagnosis || '',
      treatment_plan: data.treatment_plan || '',
      ...data,
    },
  };
  const res = await medicalRecordsApi.create(payload);
  return res.medical_record_public_id ?? res.consultation?.medical_record?.public_id ?? res.id;
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

export async function getDashboardStats(doctorId) {
  try {
    if (!doctorId) return null;
    return await doctorsApi.getDashboardStats(doctorId);
  } catch {
    return null;
  }
}

export async function addConsultation(doctorId, patientId, data) {
  const payload = {
    type: 'consultation',
    data: {
      doctor_id: doctorId,
      patient_id: patientId,
      chief_complaint: data.chief_complaint || '',
      history_of_present_illness: data.history_of_present_illness || '',
      diagnosis: data.diagnosis || '',
      treatment_plan: data.treatment_plan || '',
      prescription: data.prescription_items?.length
        ? { items: data.prescription_items.map((i) => ({ ...i, treatment_duration: i.treatment_duration || '' })) }
        : undefined,
    },
  };
  const res = await medicalRecordsApi.create(payload);
  return res;
}

export async function addDiagnostic(doctorId, patientId, data) {
  const payload = {
    type: 'diagnostic',
    data: {
      doctor_id: doctorId,
      patient_id: patientId,
      description: data.description || '',
      issue_date: data.issue_date || new Date().toISOString().slice(0, 10),
      result: data.result || '',
    },
  };
  return medicalRecordsApi.create(payload);
}

export async function addMedicalCertificate(doctorId, patientId, data) {
  const payload = {
    type: 'medical_certificate',
    data: {
      doctor_id: doctorId,
      patient_id: patientId,
      purpose: data.purpose || '',
      period_of_leave: data.period_of_leave ?? 0,
    },
  };
  return medicalRecordsApi.create(payload);
}

export const addPrescription = addConsultation;

export async function addFile(patientUid, file, description) {
  const formData = new FormData();
  formData.append('patient_uid', patientUid);
  formData.append('file', file);
  if (description) formData.append('description', description);
  const { filesApi } = await import('./api');
  return filesApi.upload(formData);
}
