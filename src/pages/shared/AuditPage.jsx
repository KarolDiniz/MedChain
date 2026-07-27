import { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Search,
  X,
  RotateCcw,
  Stethoscope,
  ClipboardList,
  FileCheck,
  Paperclip,
  Link2,
  Calendar,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { resolveDoctorId, resolvePatientPublicId, findPatientByAnyId } from '../../utils/ids';
import { getAuditTimeline, getPatientsByDoctor } from '../../services/medicalRecordService';
import { IntegrityBadge } from '../../components/common/IntegrityBadge';
import { Pagination } from '../../components/common/Pagination';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  getPaginationMeta,
} from '../../utils/pagination';
import { getIntegrityStatus, shortenHash } from '../../utils/blockchain';
import '../../components/common/ListToolbar.css';
import './AuditPage.css';

const STATUS_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'anchored', label: 'Ancorados' },
  { id: 'local_only', label: 'Hash local' },
  { id: 'pending', label: 'Pendentes' },
];

const KIND_ICONS = {
  consultation: Stethoscope,
  diagnostic: ClipboardList,
  certificate: FileCheck,
  file: Paperclip,
};

function eventStatusKey(event) {
  return getIntegrityStatus(event).key;
}

function formatEventDate(date) {
  if (!date) return 'Sem data';
  try {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Sem data';
  }
}

export function AuditPage() {
  const { user, isDoctor } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);

  const doctorView = isDoctor();
  const doctorId = resolveDoctorId(user);
  const patientId = resolvePatientPublicId(user) || user?.id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (user?.type === 'doctor') {
          const [timeline, patientList] = await Promise.all([
            getAuditTimeline(doctorId, null),
            getPatientsByDoctor(doctorId),
          ]);
          setEvents(timeline || []);
          setPatients(patientList || []);
        } else {
          const timeline = await getAuditTimeline(null, patientId);
          setEvents(timeline || []);
          setPatients([]);
        }
      } catch (err) {
        setEvents([]);
        toast.error(err?.message || 'Não foi possível carregar a auditoria.');
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, patientId, user?.type]);

  const patientName = (pid) => findPatientByAnyId(patients, pid)?.full_name || 'Paciente';

  const stats = useMemo(() => {
    let anchored = 0;
    let localOnly = 0;
    let pending = 0;
    for (const e of events) {
      const key = eventStatusKey(e);
      if (key === 'anchored') anchored += 1;
      else if (key === 'local_only') localOnly += 1;
      else pending += 1;
    }
    return { total: events.length, anchored, localOnly, pending };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events.filter((event) => {
      const statusKey = eventStatusKey(event);
      if (statusFilter !== 'all' && statusKey !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        event.summary,
        event.label,
        event.kind,
        event.hash,
        doctorView ? patientName(event.patient_id) : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [events, searchQuery, statusFilter, doctorView, patients]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalItems = filteredEvents.length;
  const { totalPages, safePage, startItem, endItem } = getPaginationMeta(
    totalItems,
    currentPage,
    itemsPerPage,
  );
  const paginated = useMemo(
    () => filteredEvents.slice(startItem > 0 ? startItem - 1 : 0, endItem),
    [filteredEvents, startItem, endItem],
  );

  const hasActiveFilters = Boolean(searchQuery.trim()) || statusFilter !== 'all';
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const subtitle = doctorView
    ? 'Prova de integridade dos registros clínicos dos seus pacientes (SHA-256 + Solana).'
    : 'Prova de integridade dos seus registros clínicos (SHA-256 + Solana).';

  return (
    <div className="audit-page">
      <header className="audit-header">
        <div className="audit-header-content">
          <div className="audit-header-icon-wrap" aria-hidden>
            <Shield size={28} strokeWidth={1.8} />
          </div>
          <div className="audit-header-title">
            <h1>Auditoria de integridade</h1>
            <p>{subtitle}</p>
          </div>
        </div>
        <p className="audit-header-note">
          Os dados clínicos ficam no banco; a blockchain guarda a prova imutável do hash.
        </p>
      </header>

      <section className="audit-stats" aria-label="Resumo de integridade">
        <article className="audit-stat audit-stat--total">
          <div className="audit-stat-icon" aria-hidden>
            <Link2 size={20} />
          </div>
          <div className="audit-stat-body">
            <span className="audit-stat-value">{stats.total}</span>
            <span className="audit-stat-label">Eventos</span>
          </div>
        </article>
        <article className="audit-stat audit-stat--success">
          <div className="audit-stat-icon" aria-hidden>
            <ShieldCheck size={20} />
          </div>
          <div className="audit-stat-body">
            <span className="audit-stat-value">{stats.anchored}</span>
            <span className="audit-stat-label">Ancorados</span>
          </div>
        </article>
        <article className="audit-stat audit-stat--warning">
          <div className="audit-stat-icon" aria-hidden>
            <ShieldAlert size={20} />
          </div>
          <div className="audit-stat-body">
            <span className="audit-stat-value">{stats.localOnly}</span>
            <span className="audit-stat-label">Hash local</span>
          </div>
        </article>
        <article className="audit-stat audit-stat--neutral">
          <div className="audit-stat-icon" aria-hidden>
            <ShieldQuestion size={20} />
          </div>
          <div className="audit-stat-body">
            <span className="audit-stat-value">{stats.pending}</span>
            <span className="audit-stat-label">Pendentes</span>
          </div>
        </article>
      </section>

      {!loading && events.length > 0 && (
        <div className="list-filters-sticky audit-filters">
          <div className="list-toolbar">
            <div className="list-toolbar-row">
              <div className="list-search">
                <Search size={18} className="list-search-icon" />
                <input
                  type="text"
                  className="list-search-input"
                  placeholder={
                    doctorView
                      ? 'Buscar por paciente, resumo ou hash...'
                      : 'Buscar por resumo, tipo ou hash...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Buscar na auditoria"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="list-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpar busca"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="list-toolbar-actions">
                <div className="list-toolbar-meta">
                  <span className="list-filter-count">
                    {filteredEvents.length} de {events.length} evento
                    {events.length !== 1 ? 's' : ''}
                  </span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      className="list-clear-filters"
                      onClick={clearFilters}
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

          <div className="audit-status-bar" role="group" aria-label="Filtrar por status">
            {STATUS_FILTERS.map((f) => {
              const count =
                f.id === 'all'
                  ? stats.total
                  : f.id === 'anchored'
                    ? stats.anchored
                    : f.id === 'local_only'
                      ? stats.localOnly
                      : stats.pending;
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`audit-status-chip${statusFilter === f.id ? ' audit-status-chip--active' : ''}${f.id !== 'all' ? ` audit-status-chip--${f.id}` : ''}`}
                  onClick={() => setStatusFilter(f.id)}
                  aria-pressed={statusFilter === f.id}
                >
                  {f.label}
                  <span className="audit-status-chip-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="audit-loading" aria-busy="true" aria-label="Carregando auditoria">
          <div className="audit-skeleton-stats">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="audit-skeleton-stat" />
            ))}
          </div>
          <div className="audit-timeline audit-timeline--skeleton">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="audit-skeleton-event" aria-hidden>
                <div className="audit-skeleton-rail" />
                <div className="audit-skeleton-card">
                  <div className="audit-skeleton-line audit-skeleton-line--title" />
                  <div className="audit-skeleton-line" />
                  <div className="audit-skeleton-line audit-skeleton-line--short" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="audit-empty">
          <div className="audit-empty-icon" aria-hidden>
            <Shield size={40} strokeWidth={1.5} />
          </div>
          <h3>Nenhum evento para auditar</h3>
          <p>
            Quando consultas, diagnósticos, atestados ou arquivos forem registrados,
            aparecerão aqui com hash e status on-chain.
          </p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="audit-empty audit-empty--filtered">
          <div className="audit-empty-icon" aria-hidden>
            <Search size={36} strokeWidth={1.5} />
          </div>
          <h3>Nenhum resultado</h3>
          <p>Ajuste a busca ou o filtro de status para ver eventos.</p>
          <button type="button" className="list-clear-filters" onClick={clearFilters}>
            <RotateCcw size={14} />
            Limpar filtros
          </button>
        </div>
      ) : (
        <>
          <ol className="audit-timeline">
            {paginated.map((event) => {
              const status = getIntegrityStatus(event);
              const KindIcon = KIND_ICONS[event.kind] || Shield;
              const StatusIcon =
                status.key === 'anchored'
                  ? ShieldCheck
                  : status.key === 'local_only'
                    ? ShieldAlert
                    : ShieldQuestion;

              return (
                <li key={event.id} className={`audit-event audit-event--${status.tone}`}>
                  <div className="audit-event-rail" aria-hidden>
                    <span className={`audit-event-dot audit-event-dot--${status.tone}`}>
                      <KindIcon size={16} strokeWidth={2} />
                    </span>
                  </div>

                  <article className="audit-event-card">
                    <header className="audit-event-header">
                      <div className="audit-event-heading">
                        <div className="audit-event-tags">
                          <span className="audit-event-kind">{event.label}</span>
                          <span className={`audit-pill audit-pill--${status.tone}`}>
                            <StatusIcon size={13} strokeWidth={2.25} />
                            {status.label}
                          </span>
                        </div>
                        <h3>{event.summary || event.label}</h3>
                        <div className="audit-event-meta">
                          <span>
                            <Calendar size={14} aria-hidden />
                            {formatEventDate(event.date)}
                          </span>
                          {doctorView && (
                            <span>
                              <User size={14} aria-hidden />
                              {patientName(event.patient_id)}
                            </span>
                          )}
                          {event.hash && (
                            <span className="audit-event-hash-preview" title={event.hash}>
                              {shortenHash(event.hash, 6)}
                            </span>
                          )}
                        </div>
                      </div>
                    </header>

                    <div className="audit-event-integrity">
                      {event.kind === 'file' || event.verifyDisabled ? (
                        <IntegrityBadge
                          hash={event.hash}
                          blockchainTxId={event.blockchain_tx_id}
                          label={event.label || 'Arquivo'}
                          showVerify={false}
                        />
                      ) : (
                        <IntegrityBadge
                          publicId={event.public_id}
                          hash={event.hash}
                          blockchainTxId={event.blockchain_tx_id}
                          label={event.label}
                        />
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>

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
            itemLabel={(n) => (n === 1 ? 'evento' : 'eventos')}
            idPrefix="audit"
            ariaLabel="Paginação da auditoria"
          />
        </>
      )}
    </div>
  );
}
