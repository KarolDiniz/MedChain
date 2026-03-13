import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Users, Search, X, Mail, Phone, Calendar, ChevronRight, ChevronLeft, Loader2, ArrowUpDown, RotateCcw, Type } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientsByDoctor } from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { PatientModal } from '../../components/doctor/PatientModal';
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

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96];

function getPageItems(currentPage, totalPages) {
  if (totalPages <= 1) return [];
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const items = [1];
  if (currentPage > 3) items.push('ellipsis-start');
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    if (!items.includes(i)) items.push(i);
  }
  if (currentPage < totalPages - 2) items.push('ellipsis-end');
  if (totalPages > 1) items.push(totalPages);
  return items;
}

export function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [letterFilter, setLetterFilter] = useState('');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [letterFilterOpen, setLetterFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const sortDropdownRef = useRef(null);
  const letterFilterRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    function handleClickOutside(e) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
      if (letterFilterRef.current && !letterFilterRef.current.contains(e.target)) {
        setLetterFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const load = async () => {
      const list = await getPatientsByDoctor(user?.id || user?.public_id);
      setPatients(list || []);
      setLoading(false);
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
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safePage * itemsPerPage, totalItems);

  const paginatedPatients = useMemo(() => {
    return filteredPatients.slice(startItem - 1, endItem);
  }, [filteredPatients, startItem, endItem]);

  const pageItems = getPageItems(safePage, totalPages);
  const showPagination = totalItems > 0;

  const hasActiveFilters = searchQuery.trim() || letterFilter;
  const clearAllFilters = () => {
    setSearchQuery('');
    setLetterFilter('');
  };

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
        <div className="patients-header-title">
          <h1>Pacientes</h1>
          <p>Gerencie os pacientes cadastrados</p>
        </div>
      </motion.header>

      {loading ? (
        <motion.div
          className="patients-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="patients-toolbar">
            <div className="search-bar search-bar--disabled">
              <Search size={20} className="search-icon" />
              <input type="text" className="search-input" placeholder="Buscar..." disabled aria-hidden />
            </div>
            <Button onClick={() => setShowModal(true)}>+ Novo Paciente</Button>
          </div>
          <div className="patients-loading">
            <div className="patients-loading-spinner">
              <Loader2 size={40} strokeWidth={2} />
            </div>
            <p>Carregando pacientes...</p>
            <div className="patients-grid patients-grid--skeleton">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="patient-card-skeleton">
                  <div className="patient-card-skeleton-avatar" />
                  <div className="patient-card-skeleton-body">
                    <div className="patient-card-skeleton-line patient-card-skeleton-name" />
                    <div className="patient-card-skeleton-line patient-card-skeleton-detail" />
                    <div className="patient-card-skeleton-line patient-card-skeleton-detail patient-card-skeleton-detail--short" />
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
        </motion.div>
      ) : (
        <motion.div
          className="patients-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="patients-toolbar">
            <div className="patients-toolbar-row">
              <div className="search-bar">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar por nome, e-mail, telefone ou data..."
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
              <div className="patients-toolbar-actions">
                <div className="patients-sort-dropdown" ref={sortDropdownRef}>
                  <button
                    type="button"
                    className={`patients-sort-trigger ${sortDropdownOpen ? 'patients-sort-trigger--open' : ''}`}
                    onClick={() => setSortDropdownOpen((v) => !v)}
                    aria-expanded={sortDropdownOpen}
                    aria-label="Ordenar por"
                  >
                    <ArrowUpDown size={20} />
                  </button>
                  <AnimatePresence>
                  {sortDropdownOpen && (
                    <motion.ul
                      className="patients-sort-dropdown-list"
                      role="listbox"
                      initial={reducedMotion ? false : { opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reducedMotion ? undefined : { opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <li key={opt.value} role="option">
                          <button
                            type="button"
                            className={`patients-sort-dropdown-item ${sortBy === opt.value ? 'patients-sort-dropdown-item--active' : ''}`}
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
                <div className="patients-letter-trigger-wrap" ref={letterFilterRef}>
                  <button
                    type="button"
                    className={`patients-sort-trigger ${letterFilterOpen ? 'patients-sort-trigger--open' : ''} ${letterFilter ? 'patients-sort-trigger--active' : ''}`}
                    onClick={() => setLetterFilterOpen((v) => !v)}
                    aria-expanded={letterFilterOpen}
                    aria-label="Filtro por inicial do nome"
                    title="Inicial do nome"
                  >
                    <Type size={20} />
                  </button>
                  <AnimatePresence>
                  {letterFilterOpen && (
                    <motion.div
                      className="patients-letter-filters patients-letter-filters--dropdown"
                      initial={reducedMotion ? false : { opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reducedMotion ? undefined : { opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <span className="patients-letter-label">Inicial do nome:</span>
                      <div className="patients-letter-strip">
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
                      {isAvailable && <span className="patients-letter-count">{count}</span>}
                    </button>
                  );
                })}
              </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
                <Button onClick={() => setShowModal(true)}>+ Novo Paciente</Button>
              </div>
            </div>
            <div className="patients-toolbar-meta">
              <span className="filter-count">
                {filteredPatients.length} de {patients.length}
              </span>
              {hasActiveFilters && (
                <button type="button" className="filter-clear-btn" onClick={clearAllFilters} title="Limpar filtros">
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reducedMotion ? undefined : { duration: 0.3 }}
            >
            <Card>
              <div className="patients-no-results">
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
              className="patients-grid"
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
                <Link to={`/doctor/patients/${p.id}`} className="patient-card">
                  <div className="patient-card-avatar">
                    <Avatar
                      userId={p.patient_public_id || p.uid || p.id}
                      isDoctor={false}
                      size={52}
                      editable={false}
                      variant="profile"
                      initials={getInitials(p.full_name)}
                    />
                  </div>
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
                </motion.div>
              ))}
            </motion.div>

            {showPagination && (
              <motion.footer
                className="patients-pagination"
                style={{ '--pagination-progress': totalPages > 1 ? ((safePage - 1) / (totalPages - 1)) * 100 : 100 }}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                aria-label="Navegação de páginas"
              >
                <div className="patients-pagination-info">
                  <span>
                    Mostrando <strong>{startItem}</strong>–<strong>{endItem}</strong> de{' '}
                    <strong>{totalItems}</strong> paciente{totalItems !== 1 ? 's' : ''}
                  </span>
                </div>
                <nav className="patients-pagination-nav" role="navigation">
                  <button
                    type="button"
                    className="patients-pagination-btn patients-pagination-btn--prev"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="patients-pagination-numbers" role="group" aria-label="Números de página">
                    {pageItems.map((item, idx) =>
                      item === 'ellipsis-start' || item === 'ellipsis-end' ? (
                        <span key={`ellipsis-${idx}`} className="patients-pagination-ellipsis" aria-hidden>
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          className={`patients-pagination-num ${item === safePage ? 'patients-pagination-num--active' : ''}`}
                          onClick={() => setCurrentPage(item)}
                          aria-current={item === safePage ? 'page' : undefined}
                          aria-label={`Página ${item}`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    type="button"
                    className="patients-pagination-btn patients-pagination-btn--next"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    aria-label="Próxima página"
                  >
                    <ChevronRight size={18} />
                  </button>
                </nav>
                <div className="patients-pagination-per-page">
                  <label htmlFor="patients-per-page">Por página:</label>
                  <select
                    id="patients-per-page"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label="Itens por página"
                  >
                    {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.footer>
            )}
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
            getPatientsByDoctor(user?.id || user?.public_id).then(setPatients);
          }}
        />
      )}
    </motion.div>
  );
}
