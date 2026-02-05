import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, X } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.trim().toLowerCase();
    return patients.filter((p) => {
      const name = (p.full_name || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      const phone = (p.cellphone || '').replace(/\D/g, '');
      const phoneQuery = q.replace(/\D/g, '');
      const birthStr = p.birth_date ? new Date(p.birth_date).toLocaleDateString('pt-BR') : '';
      return name.includes(q) || email.includes(q) || birthStr.includes(q) || (phoneQuery.length >= 2 && phone.includes(phoneQuery));
    });
  }, [patients, searchQuery]);

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
          <>
            <div className="list-filters">
              <div className="search-bar">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar por nome, e-mail ou telefone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Buscar pacientes"
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
                    <span className="filter-count">{filteredPatients.length} de {patients.length} paciente(s)</span>
                    <button type="button" className="filter-clear-btn" onClick={() => setSearchQuery('')}>Limpar filtro</button>
                  </>
                )}
              </div>
            </div>
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
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="table-empty-row">
                        Nenhum paciente encontrado para &quot;{searchQuery}&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((p) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
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
