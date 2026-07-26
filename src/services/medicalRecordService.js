import { patientsApi, doctorsApi, medicalRecordsApi, filesApi } from './api';
import { extractIntegrityFields } from '../utils/blockchain';

function mapPatient(p) {
  const addr = p.address || {};
  const flatAddr = {
    street: addr.street || p.address_street,
    number: addr.number || p.address_number,
    complement: addr.complement || p.address_complement,
    neighborhood: addr.neighborhood || p.address_neighborhood,
    city: addr.city || p.address_city,
    state: addr.state || p.address_state,
  };
  // patient_public_id = Patient.public_id (APIs clínicas/arquivos).
  // uid = User.public_id (aceito em GET /patients/, mas NÃO em /files/by-patient/).
  const patientPublicId = p.patient_public_id || null;
  const userPublicId = p.uid || p.user_public_id || (patientPublicId ? null : p.id) || null;
  return {
    id: patientPublicId || userPublicId || p.id,
    uid: userPublicId,
    user_public_id: userPublicId,
    patient_public_id: patientPublicId || userPublicId,
    full_name: p.full_name || p.name,
    name: p.name || p.full_name,
    email: p.email,
    cellphone: p.cellphone || p.phone,
    phone: p.phone || p.cellphone,
    birth_date: p.birth_date || p.dateofbirth,
    dateofbirth: p.dateofbirth || p.birth_date,
    gender: p.gender,
    status: p.status,
    address: flatAddr,
    created_at: p.created_at || p.created_date || p.date_created || p.created,
  };
}

function withIntegrity(item) {
  const fields = extractIntegrityFields(item);
  const created =
    item.created_date
    || item.issue_date
    || item.medical_record?.created_date
    || null;
  return {
    ...item,
    created_date: item.created_date || created,
    hash: fields.hash,
    blockchain_tx_id: fields.blockchainTxId,
    public_id: fields.publicId || item.public_id || item.medical_record?.public_id,
    anchored: fields.anchored,
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

function groupRecordsByDoctorPatient(consultations, diagnostics, certificates, files = []) {
  const map = new Map();
  const key = (d, p) => `${d}|${p}`;
  const ensure = (did, pid, mr) => {
    const k = key(did, pid);
    if (!map.has(k)) {
      map.set(k, {
        id: mr?.public_id || `${did}-${pid}`,
        public_id: mr?.public_id,
        doctor_id: did,
        patient_id: pid,
        created_date: mr?.created_date,
        consultations: [],
        diagnostics: [],
        medical_certificates: [],
        files: [],
        items: [],
      });
    }
    return map.get(k);
  };

  const add = (item, type) => {
    const enriched = withIntegrity(item);
    const mr = item.medical_record || item;
    const did = mr.doctor_id ?? mr.doctor?.public_id;
    const pid = mr.patient_id ?? mr.patient?.public_id;
    if (!did || !pid) return;
    const rec = ensure(did, pid, mr);
    if (type === 'consultation') {
      rec.consultations.push(enriched);
      rec.items.push({ kind: 'consultation', ...enriched });
      if (item.created_date && (!rec.created_date || new Date(item.created_date) > new Date(rec.created_date))) {
        rec.created_date = item.created_date;
      }
    } else if (type === 'diagnostic') {
      rec.diagnostics.push(enriched);
      rec.items.push({ kind: 'diagnostic', ...enriched });
      const d = item.issue_date || item.created_date;
      if (d && (!rec.created_date || new Date(d) > new Date(rec.created_date))) rec.created_date = d;
    } else if (type === 'certificate') {
      rec.medical_certificates.push(enriched);
      rec.items.push({ kind: 'certificate', ...enriched });
      if (item.created_date && (!rec.created_date || new Date(item.created_date) > new Date(rec.created_date))) {
        rec.created_date = item.created_date;
      }
    }
  };

  (consultations || []).forEach((c) => add(c, 'consultation'));
  (diagnostics || []).forEach((d) => add(d, 'diagnostic'));
  (certificates || []).forEach((c) => add(c, 'certificate'));

  (files || []).forEach((f) => {
    const did = f.doctor_uid || f.doctor_id;
    const pid = f.patient_uid || f.patient_id;
    if (!did || !pid) return;
    const rec = ensure(did, pid, { public_id: f.id, created_date: f.created_date });
    const fileItem = {
      ...f,
      hash: f.hash,
      public_id: f.id,
      anchored: Boolean(f.hash),
    };
    rec.files.push(fileItem);
    rec.items.push({ kind: 'file', ...fileItem });
  });

  return Array.from(map.values());
}

async function loadFilesForPatients(patientIds) {
  const unique = [...new Set((patientIds || []).filter(Boolean).map(String))];
  const results = await Promise.all(
    unique.map(async (pid) => {
      try {
        const list = await filesApi.listByPatient(pid);
        return list || [];
      } catch {
        return [];
      }
    })
  );
  return results.flat();
}

export async function getMedicalRecordsByPatient(patientId) {
  try {
    const data = await medicalRecordsApi.list();
    const consultations = data?.consultations || [];
    const diagnostics = data?.diagnostics || [];
    const certificates = data?.medical_certificates || [];
    const patientIdStr = String(patientId);
    const filterByPatient = (item) => {
      const pid = item.medical_record?.patient_id ?? item.patient_id ?? item.patient?.public_id;
      return pid && String(pid) === patientIdStr;
    };
    const files = await loadFilesForPatients([patientId]);
    return groupRecordsByDoctorPatient(
      consultations.filter(filterByPatient),
      diagnostics.filter(filterByPatient),
      certificates.filter(filterByPatient),
      files
    );
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
    const patientIds = [
      ...consultations.map((c) => c.medical_record?.patient_id ?? c.patient_id),
      ...diagnostics.map((d) => d.medical_record?.patient_id ?? d.patient_id),
      ...certificates.map((c) => c.medical_record?.patient_id ?? c.patient_id),
    ];
    const files = await loadFilesForPatients(patientIds);
    const doctorFiles = (files || []).filter(
      (f) => String(f.doctor_uid || f.doctor_id) === String(doctorId)
    );
    return groupRecordsByDoctorPatient(consultations, diagnostics, certificates, doctorFiles);
  } catch {
    return [];
  }
}

export async function getFilesByPatient(patientId) {
  try {
    if (!patientId) return [];
    return await filesApi.listByPatient(patientId);
  } catch {
    return [];
  }
}

export async function getMedicalRecordById(id) {
  try {
    const mr = await medicalRecordsApi.get(id);
    if (!mr) return null;
    const consultation = mr.consultation ? withIntegrity({ ...mr.consultation, medical_record: mr }) : null;
    const diagnostic = mr.diagnostic ? withIntegrity({ ...mr.diagnostic, medical_record: mr }) : null;
    const certificate = mr.certificate ? withIntegrity({ ...mr.certificate, medical_record: mr }) : null;
    let files = [];
    try {
      files = await filesApi.listByPatient(mr.patient_id);
    } catch {
      files = [];
    }
    return {
      ...mr,
      id: mr.public_id ?? mr.id,
      hash: mr.hash,
      blockchain_tx_id: mr.blockchain_tx_id,
      anchored: Boolean(mr.hash && mr.blockchain_tx_id),
      consultations: consultation ? [consultation] : [],
      diagnostics: diagnostic ? [diagnostic] : [],
      medical_certificates: certificate ? [certificate] : [],
      files: files || [],
    };
  } catch {
    return null;
  }
}

export async function verifyMedicalRecord(publicId) {
  return medicalRecordsApi.verify(publicId);
}

export async function getAuditTimeline(doctorId, patientId) {
  const records = doctorId
    ? await getMedicalRecordsByDoctor(doctorId)
    : await getMedicalRecordsByPatient(patientId);

  const events = [];
  for (const group of records || []) {
    for (const c of group.consultations || []) {
      events.push({
        id: `c-${c.id}`,
        kind: 'consultation',
        label: 'Consulta',
        date: c.created_date,
        patient_id: group.patient_id,
        doctor_id: group.doctor_id,
        public_id: c.public_id || c.medical_record?.public_id,
        hash: c.hash,
        blockchain_tx_id: c.blockchain_tx_id,
        summary: c.chief_complaint || c.diagnosis || 'Consulta',
      });
    }
    for (const d of group.diagnostics || []) {
      events.push({
        id: `d-${d.id}`,
        kind: 'diagnostic',
        label: 'Diagnóstico',
        date: d.issue_date || d.created_date,
        patient_id: group.patient_id,
        doctor_id: group.doctor_id,
        public_id: d.public_id || d.medical_record?.public_id,
        hash: d.hash,
        blockchain_tx_id: d.blockchain_tx_id,
        summary: d.description || 'Diagnóstico',
      });
    }
    for (const cert of group.medical_certificates || []) {
      events.push({
        id: `cert-${cert.id}`,
        kind: 'certificate',
        label: 'Atestado',
        date: cert.created_date,
        patient_id: group.patient_id,
        doctor_id: group.doctor_id,
        public_id: cert.public_id || cert.medical_record?.public_id,
        hash: cert.hash,
        blockchain_tx_id: cert.blockchain_tx_id,
        summary: cert.purpose || 'Atestado',
      });
    }
    for (const f of group.files || []) {
      events.push({
        id: `f-${f.id}`,
        kind: 'file',
        label: 'Arquivo',
        date: f.created_date,
        patient_id: group.patient_id,
        doctor_id: group.doctor_id,
        public_id: null,
        hash: f.hash,
        blockchain_tx_id: null,
        summary: f.description || f.format || 'Arquivo',
        verifyDisabled: true,
      });
    }
  }

  return events.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
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
  return medicalRecordsApi.create(payload);
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
  return filesApi.upload(formData);
}
