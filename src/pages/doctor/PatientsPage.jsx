import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientsByDoctor } from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PatientModal } from '../../components/doctor/PatientModal';
import './PatientsPage.css';

export function PatientsPage() {
  const { user } = useAuth();
  const patients = getPatientsByDoctor(user?.id) || [];
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="patients-page">
      <header className="page-header">
        <div>
          <h1>Pacientes</h1>
          <p>Gerencie os pacientes cadastrados</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Novo Paciente</Button>
      </header>

      <Card>
        {patients.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <Users size={48} strokeWidth={1.5} />
            </span>
            <h3>Nenhum paciente cadastrado</h3>
            <p>Cadastre o primeiro paciente para começar a criar prontuários.</p>
            <Button onClick={() => setShowModal(true)}>Cadastrar Paciente</Button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>Data Nasc.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>{p.full_name}</td>
                    <td>{p.email}</td>
                    <td>{p.cellphone}</td>
                    <td>{p.birth_date ? new Date(p.birth_date).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>
                      <Link to={`/doctor/patients/${p.id}`} className="table-action">
                        Ver detalhes →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <PatientModal
          doctorId={user?.id}
          onClose={() => setShowModal(false)}
          onSaved={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
