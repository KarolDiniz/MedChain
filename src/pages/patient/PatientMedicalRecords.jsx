import { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Download, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getMedicalRecordsByPatient } from '../../services/medicalRecordService';
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

  const patientId = user?.patient_public_id || user?.id || user?.uid;

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

  const handleExport = () => {
    try {
      downloadRecordsSummaryPdf(flat, { patientName: user?.full_name || 'Paciente' });
      toast.success('Resumo PDF gerado.');
    } catch (err) {
      toast.error(err?.message || 'Falha ao gerar o resumo.');
    }
  };

  if (loading) {
    return (
      <div className="patient-records">
        <header className="page-header">
          <h1>Meus Prontuários</h1>
          <p>Carregando...</p>
        </header>
        <Card><div className="empty-state"><p>Carregando prontuários...</p></div></Card>
      </div>
    );
  }

  const empty = visits.length === 0 && undatedFiles.length === 0;

  return (
    <div className="patient-records">
      <header className="page-header page-header--with-actions">
        <div>
          <h1>Meus Prontuários</h1>
          <p>
            Registros do mesmo dia aparecem juntos como um atendimento.
            Cada item mantém seu hash de integridade na blockchain.
          </p>
        </div>
        {!empty && (
          <Button type="button" variant="ghost" onClick={handleExport}>
            <Download size={16} />
            Exportar resumo PDF
          </Button>
        )}
      </header>

      {!empty && (
        <Card className="patient-records-integrity-banner">
          <ShieldCheck size={22} className="patient-records-integrity-icon" />
          <div>
            <strong>Verifique a integridade dos seus registros</strong>
            <p>
              {anchoredCount > 0
                ? `${anchoredCount} registro(s) com âncora na Solana. Expanda um atendimento e use “Verificar integridade”.`
                : 'Quando houver âncora on-chain, use o botão “Verificar integridade” em cada item.'}
              {' '}
              A página Auditoria também lista todos os eventos com hash.
            </p>
          </div>
        </Card>
      )}

      {empty ? (
        <Card>
          <div className="empty-state">
            <span className="empty-state-icon">
              <ClipboardList size={48} strokeWidth={1.5} />
            </span>
            <h3>Nenhum prontuário</h3>
            <p>Seus prontuários aparecerão aqui após serem cadastrados pelo médico.</p>
          </div>
        </Card>
      ) : (
        <VisitTimeline
          visits={visits}
          undatedFiles={undatedFiles}
          patient={user}
          emptyMessage="Nenhum atendimento encontrado."
        />
      )}
    </div>
  );
}
