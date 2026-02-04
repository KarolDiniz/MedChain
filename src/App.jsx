import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { PatientsPage } from './pages/doctor/PatientsPage';
import { PatientDetailPage } from './pages/doctor/PatientDetailPage';
import { MedicalRecordsPage } from './pages/doctor/MedicalRecordsPage';
import { MedicalRecordDetailPage } from './pages/doctor/MedicalRecordDetailPage';
import { PatientProfile } from './pages/patient/PatientProfile';
import { PatientMedicalRecords } from './pages/patient/PatientMedicalRecords';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/doctor"
            element={
              <ProtectedRoute requireDoctor>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DoctorDashboard />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="patients/:id" element={<PatientDetailPage />} />
            <Route path="medical-records" element={<MedicalRecordsPage />} />
            <Route path="medical-records/:id" element={<MedicalRecordDetailPage />} />
          </Route>

          <Route
            path="/patient"
            element={
              <ProtectedRoute requirePatient>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PatientProfile />} />
            <Route path="medical-records" element={<PatientMedicalRecords />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
