import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ClipboardList,
  Search,
  X,
  ArrowUpDown,
  ChevronRight,
  Stethoscope,
  FileText,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getPatientsByDoctor, getMedicalRecordsByDoctor } from '../../services/medicalRecordService';
import { resolveDoctorId, findPatientByAnyId, sameId } from '../../utils/ids';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { Pagination } from '../../components/common/Pagination';
import { MedicalRecordModal } from '../../components/doctor/MedicalRecordModal';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  getPaginationMeta,
} from '../../utils/pagination';
import '../../components/common/ListToolbar.css';
import './MedicalRecordsPage.css';

const SORT_RECENT = 'recent';
const SORT_OLDEST = 'oldest';
const SORT_NAME_ASC = 'name_asc';
const SORT_NAME_DESC = 'name_desc';

const SORT_OPTIONS = [
  { value: SORT_RECENT, label: 'Mais recentes' },
  { value: SORT_OLDEST, label: 'Mais antigos' },
  { value: SORT_NAME_ASC, label: 'Nome A→Z' },
  { value: SORT_NAME_DESC, label: 'Nome Z→A' },
];

function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function MedicalRecordsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const preselectedPatient = searchParams.get('patient');
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState(SORT_RECENT);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const sortDropdownRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const doctorId = resolveDoctorId(user);
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortOrder)?.label || 'Ordenar';

  const reload = async () => {
    if (!doctorId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        getPatientsByDoctor(doctorId),
        getMedicalRecordsByDoctor(doctorId),
      ]);
      setPatients(p || []);
      setRecords(r || []);
    } catch (err) {
      setPatients([]);
      setRecords([]);
      toast.error(err?.message || 'Não foi possível carregar os prontuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

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
    if (loading) return [];
    let list = records;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = records.filter((mr) => {
        const patient = findPatientByAnyId(patients, mr.patient_id);
        const name = (patient?.full_name || '').toLowerCase();
        const email = (patient?.email || '').toLowerCase();
        const dateStr = new Date(mr.created_date).toLocaleDateString('pt-BR');
        return name.includes(q) || email.includes(q) || dateStr.includes(q);
      });
    }
    const getPatientName = (mr) =>
      (findPatientByAnyId(patients, mr.patient_id)?.full_name || '').toLowerCase();
    return [...list].sort((a, b) => {
      if (sortOrder === SORT_RECENT || sortOrder === SORT_OLDEST) {
        const da = new Date(a.created_date).getTime();
        const db = new Date(b.created_date).getTime();
        return sortOrder === SORT_RECENT ? db - da : da - db;
      }
      const cmp = getPatientName(a).localeCompare(getPatientName(b));
      return sortOrder === SORT_NAME_ASC ? cmp : -cmp;
    });
  }, [records, patients, searchQuery, sortOrder, loading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOrder]);

  const totalItems = filteredRecords.length;
  const { totalPages, safePage, startItem, endItem } = getPaginationMeta(
    totalItems,
    currentPage,
    itemsPerPage,
  );
  const paginated = useMemo(
    () => filteredRecords.slice(startItem > 0 ? startItem - 1 : 0, endItem),
    [filteredRecords, startItem, endItem],
  );
  const hasActiveFilters = Boolean(searchQuery.trim());
  const clearAllFilters = () => setSearchQuery('');

  return (
    <div className="medical-records-page">
      <header className="records-header">
        <div className="records-header-content">
          <div className="records-header-icon-wrap" aria-hidden>
            <ClipboardList size={28} strokeWidth={1.8} />
          </div>
          <div className="records-header-title">
            <h1>Prontuários Médicos</h1>
            <p>Consultas, diagnósticos e atestados por paciente</p>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)} className="records-btn-new">
          + Abrir ficha
        </Button>
      </header>

      {loading ? (
        <div className="records-content">
          <div className="list-filters-sticky">
            <div className="list-toolbar">
              <div className="list-toolbar-row">
                <div className="list-search list-search--disabled">
                  <Search size={18} className="list-search-icon" />
                  <input type="text" className="list-search-input" placeholder="Buscar..." disabled aria-hidden />
                </div>
              </div>
            </div>
          </div>
          <div className="records-loading" aria-busy="true" aria-label="Carregando prontuários">
            <div className="records-grid records-grid--skeleton">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="record-card-skeleton" aria-hidden>
                  <div className="record-card-skeleton-avatar" />
                  <div className="record-card-skeleton-body">
                    <div className="record-card-skeleton-line record-card-skeleton-line--title" />
                    <div className="record-card-skeleton-line" />
                    <div className="record-card-skeleton-line record-card-skeleton-line--short" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="records-content">
          <Card className="records-empty-card">
            <div className="records-empty-state">
              <div className="records-empty-icon-wrap" aria-hidden>
                <ClipboardList size={56} strokeWidth={1.5} />
              </div>
              <h3>Nenhum registro clínico ainda</h3>
              <p>
                Abra a ficha de um paciente para registrar consultas, diagnósticos e atestados.
              </p>
              <Button onClick={() => setShowModal(true)} className="records-empty-cta">
                + Abrir ficha do paciente
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="records-content">
          <div className="list-filters-sticky">
            <div className="list-toolbar">
              <div className="list-toolbar-row">
                <div className="list-search">
                  <Search size={18} className="list-search-icon" />
                  <input
                    type="text"
                    className="list-search-input"
                    placeholder="Buscar por paciente, e-mail ou data..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Buscar prontuários"
                  />
                  {searchQuery && (
                    <button type="button" className="list-search-clear" onClick={() => setSearchQuery('')} aria-label="Limpar busca">
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="list-toolbar-actions">
                  <div className="list-sort" ref={sortDropdownRef}>
                    <button
                      type="button"
                      className={`list-sort-trigger${sortDropdownOpen ? ' list-sort-trigger--open' : ''}`}
                      onClick={() => setSortDropdownOpen((v) => !v)}
                      aria-expanded={sortDropdownOpen}
                      aria-label={`Ordenar por: ${currentSortLabel}`}
                    >
                      <ArrowUpDown size={16} />
                      <span className="list-sort-trigger-label">{currentSortLabel}</span>
                    </button>
                    <AnimatePresence>
                      {sortDropdownOpen && (
                        <motion.ul
                          className="list-sort-menu"
                          role="listbox"
                          initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={reducedMotion ? undefined : { opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.2 }}
                        >
                          {SORT_OPTIONS.map((opt) => (
                            <li key={opt.value} role="option">
                              <button
                                type="button"
                                className={`list-sort-item${sameId(sortOrder, opt.value) ? ' list-sort-item--active' : ''}`}
                                onClick={() => {
                                  setSortOrder(opt.value);
                                  setSortDropdownOpen(false);
                                }}
                              >
                                {opt.label}
                              </button>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="list-toolbar-meta">
                    <span className="list-filter-count">
                      {filteredRecords.length} de {records.length} prontuário{records.length !== 1 ? 's' : ''}
                    </span>
                    {hasActiveFilters && (
                      <button type="button" className="list-clear-filters" onClick={clearAllFilters} title="Limpar filtros">
                        <RotateCcw size={14} />
                        Limpar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <Card>
              <div className="records-no-results">
                <p>
                  {hasActiveFilters
                    ? `Nenhum prontuário encontrado${searchQuery ? ` para "${searchQuery}"` : ''}.`
                    : 'Nenhum prontuário cadastrado.'}
                </p>
                {hasActiveFilters && (
                  <button type="button" className="records-filter-clear-btn" onClick={clearAllFilters} title="Limpar filtros">
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            </Card>
          ) : (
            <>
              <motion.div
                className="records-grid"
                variants={reducedMotion ? {} : { visible: { transition: { staggerChildren: 0.035, delayChildren: 0.04 } } }}
                initial={reducedMotion ? false : 'hidden'}
                animate={reducedMotion ? false : 'visible'}
              >
                {paginated.map((mr) => {
                  const patient = findPatientByAnyId(patients, mr.patient_id);
                  const consultationsCount = mr.consultations?.length || 0;
                  const diagnosticsCount = mr.diagnostics?.length || 0;
                  const certificatesCount = mr.medical_certificates?.length || 0;
                  const recordLinkId = mr.public_id;
                  const href = recordLinkId
                    ? `/doctor/medical-records/${recordLinkId}`
                    : `/doctor/patients/${mr.patient_id}`;

                  return (
                    <motion.div
                      key={mr.id}
                      variants={reducedMotion ? {} : { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                      transition={{ duration: 0.3 }}
                    >
                      <Link
                        to={href}
                        className="record-card"
                        aria-label={`Abrir prontuário de ${patient?.full_name || 'paciente'}`}
                      >
                        <div className="record-card-avatar">
                          <Avatar
                            userId={mr.patient_id}
                            isDoctor={false}
                            size={52}
                            editable={false}
                            variant="profile"
                            initials={getInitials(patient?.full_name)}
                          />
                        </div>
                        <div className="record-card-body">
                          <h3 className="record-card-name">{patient?.full_name || 'Paciente'}</h3>
                          <div className="record-card-date">
                            <Calendar size={14} />
                            <span>
                              {new Date(mr.created_date).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="record-card-badges">
                            <span className="record-badge record-badge--consult">
                              <Stethoscope size={12} />
                              {consultationsCount}
                            </span>
                            <span className="record-badge record-badge--diagnostic">
                              <FileText size={12} />
                              {diagnosticsCount}
                            </span>
                            <span className="record-badge record-badge--cert">
                              <FileText size={12} />
                              {certificatesCount}
                            </span>
                          </div>
                        </div>
                        <div className="record-card-action" aria-hidden>
                          <ChevronRight size={20} />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>

              <Pagination
                page={safePage}
                totalPages={totalPages}
                totalItems={totalItems}
                startItem={startItem}
                endItem={endItem}
                itemsPerPage={itemsPerPage}
                pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                }}
                itemLabel={(n) => (n === 1 ? 'prontuário' : 'prontuários')}
                idPrefix="records"
                ariaLabel="Paginação de prontuários"
              />
            </>
          )}
        </div>
      )}

      {showModal && (
        <MedicalRecordModal
          patients={patients}
          preselectedPatientId={preselectedPatient}
          doctorId={doctorId}
          onClose={() => setShowModal(false)}
          onSaved={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
