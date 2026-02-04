// Mock data baseado no diagrama UML - para demonstração (senha padrão: 12345)

const generateHash = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const createDate = (daysAgo = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const MOCK_DOCTORS = [
  {
    id: 'doc-1',
    type: 'doctor',
    full_name: 'Dr. Maria Silva',
    email: 'maria.silva@medchain.com',
    password: '12345',
    status: 'ACTIVE',
    CRM: '12345-SP',
    specialty: 'Clínica Geral',
    created_date: createDate(365),
    updated_date: createDate(1),
  },
  {
    id: 'doc-2',
    type: 'doctor',
    full_name: 'Dr. João Santos',
    email: 'joao.santos@medchain.com',
    password: '12345',
    status: 'ACTIVE',
    CRM: '67890-SP',
    specialty: 'Cardiologia',
    created_date: createDate(200),
    updated_date: createDate(5),
  },
];

export const MOCK_PATIENTS = [
  {
    id: 'pat-1',
    type: 'patient',
    full_name: 'Ana Oliveira',
    email: 'ana.oliveira@email.com',
    password: '12345',
    status: 'ACTIVE',
    cellphone: '(11) 98765-4321',
    birth_date: '1990-05-15',
    gender: 'FEMALE',
    created_date: createDate(180),
    updated_date: createDate(10),
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    },
    doctor_id: 'doc-1',
  },
  {
    id: 'pat-2',
    type: 'patient',
    full_name: 'Carlos Mendes',
    email: 'carlos.mendes@email.com',
    password: '12345',
    status: 'ACTIVE',
    cellphone: '(11) 91234-5678',
    birth_date: '1985-11-20',
    gender: 'MALE',
    created_date: createDate(90),
    updated_date: createDate(3),
    address: {
      street: 'Av. Paulista',
      number: '1000',
      complement: '',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    },
    doctor_id: 'doc-1',
  },
];

export const MOCK_MEDICAL_RECORDS = [
  {
    id: 'mr-1',
    patient_id: 'pat-1',
    doctor_id: 'doc-1',
    hash: generateHash(),
    created_date: createDate(60),
    updated_date: createDate(60),
    consultations: [
      {
        id: 'cons-1',
        chief_complaint: 'Dor de cabeça persistente',
        history_of_present_illness: 'Paciente relata cefaleia há 5 dias, piorando pela manhã.',
        diagnosis: 'Cefaleia tensional',
        treatment_plan: 'Repouso, hidratação e analgésicos sob demanda',
        created_date: createDate(60),
        prescriptions: [
          {
            id: 'presc-1',
            issue_date: createDate(60),
            items: [
              { medication_name: 'Paracetamol 750mg', dosage: '1 comprimido', frequency: '8/8h', treatment_duration: '5 dias' },
            ],
          },
        ],
      },
    ],
    diagnostics: [
      {
        id: 'diag-1',
        description: 'Exame de sangue - Hemograma completo',
        issue_date: createDate(55),
        result: 'Resultados dentro da normalidade',
        created_date: createDate(55),
      },
    ],
    medical_certificates: [
      {
        id: 'cert-1',
        purpose: 'Afastamento laboral',
        period_of_leave: 3,
        created_date: createDate(58),
      },
    ],
    files: [
      {
        id: 'file-1',
        url: '/documents/exame.pdf',
        format: 'PDF',
        description: 'Resultado hemograma',
        hash: generateHash(),
      },
    ],
    blockchain_node: {
      hash: generateHash(),
      timestamp: createDate(60),
    },
  },
  {
    id: 'mr-2',
    patient_id: 'pat-2',
    doctor_id: 'doc-1',
    hash: generateHash(),
    created_date: createDate(30),
    updated_date: createDate(30),
    consultations: [
      {
        id: 'cons-2',
        chief_complaint: 'Check-up anual',
        history_of_present_illness: 'Paciente assintomático para check-up de rotina.',
        diagnosis: 'Paciente saudável',
        treatment_plan: 'Manter hábitos saudáveis',
        created_date: createDate(30),
        prescriptions: [],
      },
    ],
    diagnostics: [],
    medical_certificates: [],
    files: [],
    blockchain_node: {
      hash: generateHash(),
      timestamp: createDate(30),
    },
  },
];
