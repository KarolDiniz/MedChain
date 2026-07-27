import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Users, Search, X, Mail, Phone, Calendar, ChevronRight, ArrowUpDown, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getPatientsByDoctor } from '../../services/medicalRecordService';
import { resolvePatientRouteId } from '../../utils/ids';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  getPaginationMeta,
} from '../../utils/pagination';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { Pagination } from '../../components/common/Pagination';
import { PatientModal } from '../../components/doctor/PatientModal';
import '../../components/common/ListToolbar.css';
import '../../components/common/ListSurface.css';
import './PatientsPage.css';

function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function normalizeForSearch(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Nome (A → Z)' },
  { value: 'name-desc', label: 'Nome (Z → A)' },
  { value: 'birth-desc', label: 'Mais novos primeiro' },
  { value: 'birth-asc', label: 'Mais velhos primeiro' },
  { value: 'email-asc', label: 'E-mail (A → Z)' },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function PatientsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [letterFilter, setLetterFilter] = useState('');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const sortDropdownRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    function handleClickOutside(e) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await getPatientsByDoctor(user?.id || user?.public_id);
        setPatients(list || []);
      } catch (err) {
        setPatients([]);
        toast.error(err?.message || 'Não foi possível carregar os pacientes.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, user?.public_id]);

  const letterCounts = useMemo(() => {
    const map = {};
    ALPHABET.forEach((l) => { map[l] = 0; });
    patients.forEach((p) => {
      const first = (p.full_name || '').trim().charAt(0);
      const base = normalizeForSearch(first).charAt(0);
      if (base && /[a-z]/.test(base)) {
        const key = base.toUpperCase();
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [patients]);

  const filteredPatients = useMemo(() => {
    let result = patients;

    if (letterFilter) {
      result = result.filter((p) => {
        const first = (p.full_name || '').trim().charAt(0);
        const normalized = normalizeForSearch(first).charAt(0).toUpperCase();
        return normalized === letterFilter;
      });
    }

    if (searchQuery.trim()) {
      const rawTokens = searchQuery.trim().split(/\s+/).filter(Boolean);
      const tokens = rawTokens.map((t) => normalizeForSearch(t));
      const phoneDigits = searchQuery.replace(/\D/g, '');
      result = result.filter((p) => {
        const name = normalizeForSearch(p.full_name);
        const email = normalizeForSearch(p.email);
        const phone = (p.cellphone || '').replace(/\D/g, '');
        const birthStr = p.birth_date ? new Date(p.birth_date).toLocaleDateString('pt-BR') : '';
        if (tokens.length > 0) {
          const nameMatch = tokens.every((t) => name.includes(t));
          const emailMatch = tokens.every((t) => email.includes(t));
          const birthMatch = rawTokens.some((t) => birthStr.includes(t));
          const phoneMatch = phoneDigits.length >= 2 && phone.includes(phoneDigits);
          if (nameMatch || emailMatch || birthMatch || phoneMatch) return true;
        }
        return false;
      });
    }

    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.full_name || '').localeCompare(b.full_name || '', 'pt-BR');
        case 'name-desc':
          return (b.full_name || '').localeCompare(a.full_name || '', 'pt-BR');
        case 'birth-desc': {
          const da = a.birth_date ? new Date(a.birth_date) : new Date(0);
          const db = b.birth_date ? new Date(b.birth_date) : new Date(0);
          return db - da;
        }
        case 'birth-asc': {
          const da = a.birth_date ? new Date(a.birth_date) : new Date(0);
          const db = b.birth_date ? new Date(b.birth_date) : new Date(0);
          return da - db;
        }
        case 'email-asc':
          return (a.email || '').localeCompare(b.email || '', 'pt-BR');
        default:
          return 0;
      }
    });

    return sorted;
  }, [patients, searchQuery, letterFilter, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, letterFilter, sortBy]);

  const totalItems = filteredPatients.length;
  const { totalPages, safePage, startItem, endItem } = getPaginationMeta(
    totalItems,
    currentPage,
    itemsPerPage,
  );

  const paginatedPatients = useMemo(() => {
    return filteredPatients.slice(startItem - 1, endItem);
  }, [filteredPatients, startItem, endItem]);

  const hasActiveFilters = searchQuery.trim() || letterFilter;
  const clearAllFilters = () => {
    setSearchQuery('');
    setLetterFilter('');
  };

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Ordenar';

  const animationProps = reducedMotion
    ? { initial: false, animate: false }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } };

  return (
    <motion.div
      className="patients-page"
      {...animationProps}
    >
      <motion.header
        className="patients-header"
        initial={reducedMotion ? false : { opacity: 0, y: -8 }}
        animate={reducedMotion ? false : { opacity: 1, y: 0 }}
        transition={reducedMotion ? undefined : { duration: 0.35, delay: 0.05 }}
      >
        <div className="patients-header-content">
          <div className="patients-header-icon-wrap">
            <Users size={28} strokeWidth={1.8} />
          </div>
          <div className="patients-header-title">
            <h1>Pacientes</h1>
            <p>Gerencie os pacientes cadastrados e acesse seus prontuários</p>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)} className="patients-btn-new">
          + Novo Paciente
        </Button>
      </motion.header>

      {loading ? (
        <motion.div
          className="patients-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="list-toolbar">
            <div className="list-toolbar-row">
              <div className="list-search list-search--disabled">
                <Search size={20} className="list-search-icon" />
                <input type="text" className="list-search-input" placeholder="Buscar..." disabled aria-hidden />
              </div>
            </div>
          </div>
          <div className="patients-loading" aria-busy="true" aria-label="Carregando pacientes">
            <div className="list-entity-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="list-entity-skeleton" aria-hidden>
                  <div className="list-entity-skeleton-avatar" />
                  <div className="list-entity-skeleton-body">
                    <div className="list-entity-skeleton-line list-entity-skeleton-line--title" />
                    <div className="list-entity-skeleton-line" />
                    <div className="list-entity-skeleton-line list-entity-skeleton-line--short" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : patients.length === 0 ? (
        <motion.div
          className="patients-content"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="patients-empty-card patients-empty-card--enhanced">
            <div className="empty-state empty-state--patients">
              <div className="empty-state-icon-wrap" aria-hidden>
                <Users size={56} strokeWidth={1.5} />
              </div>
              <h3>Nenhum paciente cadastrado</h3>
              <p>Cadastre o primeiro paciente para começar a criar prontuários e gerenciar o histórico médico.</p>
              <Button onClick={() => setShowModal(true)} className="empty-state-cta">+ Cadastrar Paciente</Button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          className="patients-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="list-filters-sticky">
            <div className="list-toolbar">
              <div className="list-toolbar-row">
                <div className="list-search">
                  <Search size={18} className="list-search-icon" />
                  <input
                    type="text"
                    className="list-search-input"
                    placeholder="Buscar por nome, e-mail, telefone ou data..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Buscar pacientes"
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
                          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        >
                          {SORT_OPTIONS.map((opt) => (
                            <li key={opt.value} role="option">
                              <button
                                type="button"
                                className={`list-sort-item${sortBy === opt.value ? ' list-sort-item--active' : ''}`}
                                onClick={() => {
                                  setSortBy(opt.value);
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
                      {filteredPatients.length} de {patients.length} paciente{patients.length !== 1 ? 's' : ''}
                    </span>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        className="list-clear-filters"
                        onClick={clearAllFilters}
                        title="Limpar filtros"
                      >
                        <RotateCcw size={14} />
                        Limpar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="patients-letter-bar">
              <span className="patients-letter-label">A–Z</span>
              <div className="patients-letter-strip" role="group" aria-label="Filtrar por inicial do nome">
                <button
                  type="button"
                  className={`patients-letter-chip patients-letter-chip--all ${!letterFilter ? 'patients-letter-chip--active' : ''}`}
                  onClick={() => setLetterFilter('')}
                  title="Todos os pacientes"
                >
                  Todos
                </button>
                {ALPHABET.map((l) => {
                  const count = letterCounts[l] || 0;
                  const isAvailable = count > 0;
                  const isActive = letterFilter === l;
                  return (
                    <button
                      key={l}
                      type="button"
                      className={`patients-letter-chip ${!isAvailable ? 'patients-letter-chip--disabled' : ''} ${isActive ? 'patients-letter-chip--active' : ''}`}
                      onClick={() => isAvailable && setLetterFilter(isActive ? '' : l)}
                      disabled={!isAvailable}
                      title={isAvailable ? `${count} paciente${count !== 1 ? 's' : ''} com nome em "${l}"` : `Nenhum paciente em "${l}"`}
                    >
                      <span className="patients-letter-char">{l}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reducedMotion ? undefined : { duration: 0.3 }}
            >
              <Card>
                <div className="list-no-results patients-no-results">
                  <p>
                    {hasActiveFilters
                      ? `Nenhum paciente encontrado${searchQuery ? ` para "${searchQuery}"` : ''}${letterFilter ? ` com inicial "${letterFilter}"` : ''}.`
                      : 'Nenhum paciente cadastrado.'}
                  </p>
                  {hasActiveFilters && (
                    <button type="button" className="filter-clear-btn" onClick={clearAllFilters} title="Limpar filtros">
                      <RotateCcw size={16} />
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          ) : (
            <>
              <motion.div
                className="list-entity-grid patients-grid"
                variants={reducedMotion ? {} : {
                  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
                }}
                initial={reducedMotion ? false : 'hidden'}
                animate={reducedMotion ? false : 'visible'}
              >
                {paginatedPatients.map((p) => (
                  <motion.div
                    key={p.id}
                    variants={reducedMotion ? {} : {
                      hidden: { opacity: 0, y: 16 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={reducedMotion ? undefined : { duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Link
                      to={`/doctor/patients/${resolvePatientRouteId(p)}`}
                      className="list-entity-card patient-card"
                      aria-label={`Abrir ficha de ${p.full_name}`}
                    >
                      <div className="list-entity-avatar patient-card-avatar">
                        <Avatar
                          userId={resolvePatientRouteId(p) || p.uid || p.id}
                          isDoctor={false}
                          size={52}
                          editable={false}
                          variant="profile"
                          initials={getInitials(p.full_name)}
                        />
                      </div>
                      <div className="list-entity-body patient-card-body">
                        <h3 className="list-entity-name patient-card-name">{p.full_name}</h3>
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
                      <div className="list-entity-action patient-card-action" aria-hidden>
                        <ChevronRight size={20} />
                      </div>
                    </Link>
                  </motion.div>
                ))}
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
                itemLabel={(n) => (n === 1 ? 'paciente' : 'pacientes')}
                idPrefix="patients"
                ariaLabel="Paginação de pacientes"
              />
            </>
          )}
        </motion.div>
      )}

      {showModal && (
        <PatientModal
          doctorId={user?.id}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            toast.success('Paciente cadastrado com sucesso.');
            getPatientsByDoctor(user?.id || user?.public_id)
              .then(setPatients)
              .catch((err) => toast.error(err?.message || 'Não foi possível atualizar a lista.'));
          }}
        />
      )}
    </motion.div>
  );
}
