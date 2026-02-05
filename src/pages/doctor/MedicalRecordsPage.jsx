import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderOpen, Search, X, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientsByDoctor, getMedicalRecordsByDoctor } from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { MedicalRecordModal } from '../../components/doctor/MedicalRecordModal';
import './MedicalRecordsPage.css';

const SORT_RECENT = 'recent';
const SORT_OLDEST = 'oldest';
const SORT_NAME_ASC = 'name_asc';
const SORT_NAME_DESC = 'name_desc';

const SORT_OPTIONS = [
  { value: SORT_RECENT, label: 'Mais recentes' },
  { value: SORT_OLDEST, label: 'Mais antigos' },
  { value: SORT_NAME_ASC, label: 'Nome do paciente (A→Z)' },
  { value: SORT_NAME_DESC, label: 'Nome do paciente (Z→A)' },
];

export function MedicalRecordsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const patients = getPatientsByDoctor(user?.id) || [];
  const records = getMedicalRecordsByDoctor(user?.id) || [];
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState(SORT_RECENT);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRecords = useMemo(() => {
    let list = records;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = records.filter((mr) => {
        const patient = patients.find((p) => p.id === mr.patient_id);
        const name = (patient?.full_name || '').toLowerCase();
        const email = (patient?.email || '').toLowerCase();
        const dateStr = new Date(mr.created_date).toLocaleDateString('pt-BR');
        return name.includes(q) || email.includes(q) || dateStr.includes(q);
      });
    }
    const getPatientName = (mr) => (patients.find((p) => p.id === mr.patient_id)?.full_name || '').toLowerCase();
    const sorted = [...list].sort((a, b) => {
      if (sortOrder === SORT_RECENT || sortOrder === SORT_OLDEST) {
        const da = new Date(a.created_date).getTime();
        const db = new Date(b.created_date).getTime();
        return sortOrder === SORT_RECENT ? db - da : da - db;
      }
      const na = getPatientName(a);
      const nb = getPatientName(b);
      const cmp = na.localeCompare(nb);
      return sortOrder === SORT_NAME_ASC ? cmp : -cmp;
    });
    return sorted;
  }, [records, patients, searchQuery, sortOrder]);

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
              <div className="filters-row">
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
                <div className="sort-dropdown-wrap" ref={sortDropdownRef}>
                  <button
                    type="button"
                    className={`sort-trigger-btn ${sortDropdownOpen ? 'sort-trigger-btn--open' : ''}`}
                    onClick={() => setSortDropdownOpen((v) => !v)}
                    aria-expanded={sortDropdownOpen}
                    aria-haspopup="listbox"
                    aria-label="Abrir ordenação"
                  >
                    <Filter size={20} />
                  </button>
                  {sortDropdownOpen && (
                    <ul className="sort-dropdown-list" role="listbox">
                      {SORT_OPTIONS.map((opt) => (
                        <li key={opt.value} role="option" aria-selected={sortOrder === opt.value}>
                          <button
                            type="button"
                            className={`sort-dropdown-item ${sortOrder === opt.value ? 'sort-dropdown-item--active' : ''}`}
                            onClick={() => {
                              setSortOrder(opt.value);
                              setSortDropdownOpen(false);
                            }}
                          >
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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
