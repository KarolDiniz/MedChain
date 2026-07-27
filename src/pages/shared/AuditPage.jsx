import { useEffect, useMemo, useState } from 'react';
import { Link2, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getAuditTimeline, getPatientsByDoctor } from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { IntegrityBadge } from '../../components/common/IntegrityBadge';
import { getIntegrityStatus } from '../../utils/blockchain';
import './AuditPage.css';

export function AuditPage() {
  const { user, isDoctor } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const doctorId = user?.public_id || user?.id;
  const patientId = user?.patient_public_id || user?.id;

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
  }, [doctorId, patientId, user?.type]);

  const stats = useMemo(() => {
    const anchored = events.filter((e) => e.hash && e.blockchain_tx_id).length;
    const withHash = events.filter((e) => e.hash).length;
    return {
      total: events.length,
      anchored,
      pending: events.length - withHash,
    };
  }, [events]);

  const patientName = (pid) =>
    patients.find((p) => String(p.patient_public_id || p.id) === String(pid))?.full_name || 'Paciente';

  return (
    <div className="audit-page">
      <header className="page-header">
        <div>
          <h1>Auditoria de integridade</h1>
          <p>
            Timeline de registros clínicos com hash SHA-256 e âncora na Solana (devnet).
            Os dados ficam no banco; a blockchain guarda a prova de integridade.
          </p>
        </div>
      </header>

      <div className="audit-stats">
        <Card className="audit-stat">
          <span className="audit-stat-value">{stats.total}</span>
          <span className="audit-stat-label">Eventos</span>
        </Card>
        <Card className="audit-stat">
          <span className="audit-stat-value">{stats.anchored}</span>
          <span className="audit-stat-label">Ancorados</span>
        </Card>
        <Card className="audit-stat">
          <span className="audit-stat-value">{stats.pending}</span>
          <span className="audit-stat-label">Pendentes</span>
        </Card>
      </div>

      {loading ? (
        <Card><p>Carregando auditoria...</p></Card>
      ) : events.length === 0 ? (
        <Card>
          <div className="audit-empty">
            <Shield size={40} strokeWidth={1.5} />
            <h3>Nenhum evento para auditar</h3>
            <p>Quando consultas, diagnósticos ou atestados forem criados, aparecerão aqui com hash e status on-chain.</p>
          </div>
        </Card>
      ) : (
        <div className="audit-timeline">
          {events.map((event) => {
            const status = getIntegrityStatus(event);
            return (
              <Card key={event.id} className="audit-event">
                <div className="audit-event-header">
                  <div>
                    <span className="audit-event-kind">{event.label}</span>
                    <h3>{event.summary}</h3>
                    <p className="audit-event-meta">
                      {event.date ? new Date(event.date).toLocaleString('pt-BR') : 'Sem data'}
                      {isDoctor() ? ` · ${patientName(event.patient_id)}` : ''}
                    </p>
                  </div>
                  <span className={`audit-pill audit-pill--${status.tone}`}>
                    <Link2 size={14} />
                    {status.label}
                  </span>
                </div>
                {event.kind === 'file' ? (
                  <IntegrityBadge hash={event.hash} label="Arquivo" showVerify={false} />
                ) : (
                  <IntegrityBadge
                    publicId={event.public_id}
                    hash={event.hash}
                    blockchainTxId={event.blockchain_tx_id}
                    label={event.label}
                  />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
