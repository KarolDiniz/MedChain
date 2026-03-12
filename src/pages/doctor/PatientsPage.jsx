import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, X, Mail, Phone, Calendar, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientsByDoctor } from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PatientModal } from '../../components/doctor/PatientModal';
import './PatientsPage.css';

function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      const list = await getPatientsByDoctor(user?.id || user?.public_id);
      setPatients(list || []);
      setLoading(false);
    };
    load();
  }, [user?.id, user?.public_id]);

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
      <header className="patients-header">
        <div className="patients-header-title">
          <h1>Pacientes</h1>
          <p>Gerencie os pacientes cadastrados</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Novo Paciente</Button>
      </header>

      {loading ? (
        <div className="patients-content patients-content--loading">
          <Card>
            <div className="empty-state">
              <p>Carregando...</p>
            </div>
          </Card>
        </div>
      ) : patients.length === 0 ? (
        <div className="patients-content">
          <Card className="patients-empty-card">
            <div className="empty-state">
              <span className="empty-state-icon">
                <Users size={48} strokeWidth={1.5} />
              </span>
              <h3>Nenhum paciente cadastrado</h3>
              <p>Cadastre o primeiro paciente para começar a criar prontuários.</p>
              <Button onClick={() => setShowModal(true)}>Cadastrar Paciente</Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="patients-content">
          <div className="patients-toolbar">
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
            <div className="patients-toolbar-meta">
              {searchQuery ? (
                <>
                  <span className="filter-count">{filteredPatients.length} de {patients.length} paciente(s)</span>
                  <button type="button" className="filter-clear-btn" onClick={() => setSearchQuery('')}>Limpar filtro</button>
                </>
              ) : (
                <span className="filter-count">{patients.length} paciente{patients.length !== 1 ? 's' : ''} cadastrado{patients.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <Card>
              <div className="patients-no-results">
                <p>Nenhum paciente encontrado para &quot;{searchQuery}&quot;.</p>
                <button type="button" className="filter-clear-btn" onClick={() => setSearchQuery('')}>Limpar busca</button>
              </div>
            </Card>
          ) : (
            <div className="patients-grid">
              {filteredPatients.map((p) => (
                <Link key={p.id} to={`/doctor/patients/${p.id}`} className="patient-card">
                  <div className="patient-card-avatar">{getInitials(p.full_name)}</div>
                  <div className="patient-card-body">
                    <h3 className="patient-card-name">{p.full_name}</h3>
                    <div className="patient-card-details">
                      {p.email && (
                        <span className="patient-card-detail">
                          <Mail size={14} />
                          <span>{p.email}</span>
                        </span>
                      )}
                      {p.cellphone && (
                        <span className="patient-card-detail">
                          <Phone size={14} />
                          <span>{p.cellphone}</span>
                        </span>
                      )}
                      {p.birth_date && (
                        <span className="patient-card-detail">
                          <Calendar size={14} />
                          <span>{new Date(p.birth_date).toLocaleDateString('pt-BR')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="patient-card-action">
                    <span>Ver detalhes</span>
                    <ChevronRight size={18} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <PatientModal
          doctorId={user?.id}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            getPatientsByDoctor(user?.id || user?.public_id).then(setPatients);
          }}
        />
      )}
    </div>
  );
}
