import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Download,
  ShieldCheck,
  CalendarDays,
  Stethoscope,
  FileText,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getMedicalRecordsByPatient } from '../../services/medicalRecordService';
import { resolvePatientPublicId } from '../../utils/ids';
import { groupRecordItemsByVisitDate } from '../../utils/groupByVisitDate';
import { downloadRecordsSummaryPdf } from '../../utils/recordsSummaryPdf';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { VisitTimeline } from '../../components/common/VisitTimeline';
import './PatientMedicalRecords.css';

function flattenPatientRecords(groups) {
  const flat = {
    consultations: [],
    diagnostics: [],
    medical_certificates: [],
    files: [],
  };
  (groups || []).forEach((g) => {
    flat.consultations.push(...(g.consultations || []));
    flat.diagnostics.push(...(g.diagnostics || []));
    flat.medical_certificates.push(...(g.medical_certificates || []));
    flat.files.push(...(g.files || []));
  });
  return flat;
}

export function PatientMedicalRecords() {
  const { user } = useAuth();
  const toast = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const patientId = resolvePatientPublicId(user) || user?.id || user?.uid;

  useEffect(() => {
    const load = async () => {
      if (!patientId) {
        setGroups([]);
        setLoading(false);
        return;
      }
      try {
        const list = await getMedicalRecordsByPatient(patientId);
        setGroups(list || []);
      } catch (err) {
        setGroups([]);
        toast.error(err?.message || 'Não foi possível carregar seus prontuários.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  const flat = useMemo(() => flattenPatientRecords(groups), [groups]);
  const { visits, undatedFiles } = useMemo(
    () => groupRecordItemsByVisitDate(flat, 'recent'),
    [flat]
  );

  const anchoredCount = useMemo(() => {
    const items = [
      ...flat.consultations,
      ...flat.diagnostics,
      ...flat.medical_certificates,
    ];
    return items.filter((i) => i.hash && i.blockchain_tx_id).length;
  }, [flat]);

  const stats = useMemo(
    () => ({
      visits: visits.length,
      consultations: flat.consultations.length,
      diagnostics: flat.diagnostics.length,
      certificates: flat.medical_certificates.length,
    }),
    [visits.length, flat]
  );

  const handleExport = () => {
    try {
      downloadRecordsSummaryPdf(flat, { patientName: user?.full_name || 'Paciente' });
      toast.success('Resumo PDF gerado.');
    } catch (err) {
      toast.error(err?.message || 'Falha ao gerar o resumo.');
    }
  };

  const empty = visits.length === 0 && undatedFiles.length === 0;

  return (
    <div className="patient-records">
      <header className="patient-records-header">
        <div className="patient-records-header-content">
          <div className="patient-records-header-icon" aria-hidden>
            <ClipboardList size={28} strokeWidth={1.8} />
          </div>
          <div className="patient-records-header-text">
            <h1>Meus prontuários</h1>
            <p>
              Seus atendimentos agrupados por dia, com consulta, exames e atestados
              no mesmo lugar.
            </p>
          </div>
        </div>
        {!loading && !empty && (
          <Button type="button" variant="ghost" className="patient-records-export" onClick={handleExport}>
            <Download size={16} />
            Exportar resumo PDF
          </Button>
        )}
      </header>

      {loading ? (
        <div className="patient-records-loading" aria-busy="true" aria-label="Carregando prontuários">
          <div className="patient-records-skeleton patient-records-skeleton--banner" />
          <div className="patient-records-skeleton-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="patient-records-skeleton patient-records-skeleton--card" />
            ))}
          </div>
        </div>
      ) : empty ? (
        <Card className="patient-records-empty-card">
          <div className="patient-records-empty">
            <div className="patient-records-empty-icon" aria-hidden>
              <ClipboardList size={48} strokeWidth={1.5} />
            </div>
            <h3>Nenhum prontuário ainda</h3>
            <p>
              Quando o seu médico registrar um atendimento, os documentos clínicos
              aparecerão aqui automaticamente.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <section className="patient-records-stats" aria-label="Resumo do histórico">
            <article className="patient-records-stat">
              <span className="patient-records-stat-icon" aria-hidden>
                <CalendarDays size={18} />
              </span>
              <div>
                <strong>{stats.visits}</strong>
                <span>Atendimento{stats.visits !== 1 ? 's' : ''}</span>
              </div>
            </article>
            <article className="patient-records-stat">
              <span className="patient-records-stat-icon" aria-hidden>
                <Stethoscope size={18} />
              </span>
              <div>
                <strong>{stats.consultations}</strong>
                <span>Consulta{stats.consultations !== 1 ? 's' : ''}</span>
              </div>
            </article>
            <article className="patient-records-stat">
              <span className="patient-records-stat-icon" aria-hidden>
                <FileText size={18} />
              </span>
              <div>
                <strong>{stats.diagnostics}</strong>
                <span>Exame{stats.diagnostics !== 1 ? 's' : ''}</span>
              </div>
            </article>
            <article className="patient-records-stat">
              <span className="patient-records-stat-icon" aria-hidden>
                <FileCheck size={18} />
              </span>
              <div>
                <strong>{stats.certificates}</strong>
                <span>Atestado{stats.certificates !== 1 ? 's' : ''}</span>
              </div>
            </article>
          </section>

          <Card className="patient-records-integrity-banner">
            <div className="patient-records-integrity-icon" aria-hidden>
              <ShieldCheck size={22} />
            </div>
            <div className="patient-records-integrity-body">
              <strong>Confira a integridade dos seus registros</strong>
              <p>
                {anchoredCount > 0
                  ? `${anchoredCount} registro${anchoredCount !== 1 ? 's' : ''} com evidência verificável. Expanda um atendimento e use “Verificar integridade”.`
                  : 'Ao expandir um atendimento, use “Verificar integridade” em cada item para confirmar que o conteúdo não foi alterado.'}
                {' '}
                A página <Link to="/patient/auditoria">Auditoria</Link> reúne todos os eventos.
              </p>
            </div>
          </Card>

          <VisitTimeline
            visits={visits}
            undatedFiles={undatedFiles}
            patient={user}
            emptyMessage="Nenhum atendimento encontrado."
            note="Registros do mesmo dia aparecem juntos. Cada item pode ser verificado individualmente."
          />
        </>
      )}
    </div>
  );
}
