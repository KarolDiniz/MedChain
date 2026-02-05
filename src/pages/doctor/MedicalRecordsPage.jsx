import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderOpen, Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientsByDoctor, getMedicalRecordsByDoctor } from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { MedicalRecordModal } from '../../components/doctor/MedicalRecordModal';
import './MedicalRecordsPage.css';

export function MedicalRecordsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const patients = getPatientsByDoctor(user?.id) || [];
  const records = getMedicalRecordsByDoctor(user?.id) || [];
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.trim().toLowerCase();
    return records.filter((mr) => {
      const patient = patients.find((p) => p.id === mr.patient_id);
      const name = (patient?.full_name || '').toLowerCase();
      const email = (patient?.email || '').toLowerCase();
      const dateStr = new Date(mr.created_date).toLocaleDateString('pt-BR');
      return name.includes(q) || email.includes(q) || dateStr.includes(q);
    });
  }, [records, patients, searchQuery]);

  return (
    <div className="medical-records-page">
      <header className="page-header">
        <div>
          <h1>Prontuários Médicos</h1>
          <p>Gerencie consultas, diagnósticos, prescrições e atestados</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Novo Prontuário</Button>
      </header>

      <Card>
        {records.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <FolderOpen size={48} strokeWidth={1.5} />
            </span>
            <h3>Nenhum prontuário cadastrado</h3>
            <p>Crie um prontuário vinculado a um paciente para começar.</p>
            <Button onClick={() => setShowModal(true)}>Criar Prontuário</Button>
          </div>
        ) : (
          <>
            <div className="list-filters">
              <div className="search-bar">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar por nome do paciente ou data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Buscar prontuários"
                />
                {searchQuery && (
                  <button type="button" className="search-clear" onClick={() => setSearchQuery('')} aria-label="Limpar busca">
                    <X size={18} />
                  </button>
                )}
              </div>
              <div className="filter-meta">
                {searchQuery && (
                  <>
                    <span className="filter-count">{filteredRecords.length} de {records.length} prontuário(s)</span>
                    <button type="button" className="filter-clear-btn" onClick={() => setSearchQuery('')}>Limpar filtro</button>
                  </>
                )}
              </div>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Data</th>
                    <th>Consultas</th>
                    <th>Diagnósticos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="table-empty-row">
                        Nenhum prontuário encontrado para &quot;{searchQuery}&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((mr) => {
                      const patient = patients.find((p) => p.id === mr.patient_id);
                      return (
                        <tr key={mr.id}>
                          <td>{patient?.full_name || '-'}</td>
                          <td>{new Date(mr.created_date).toLocaleDateString('pt-BR')}</td>
                          <td>{mr.consultations?.length || 0}</td>
                          <td>{mr.diagnostics?.length || 0}</td>
                          <td>
                            <Link to={`/doctor/medical-records/${mr.id}`} className="table-action">
                              Ver →
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {showModal && (
        <MedicalRecordModal
          doctorId={user?.id}
          patients={patients}
          preselectedPatientId={patientId}
          onClose={() => setShowModal(false)}
          onSaved={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
