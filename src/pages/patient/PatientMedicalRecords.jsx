import { useState, useEffect, useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMedicalRecordsByPatient } from '../../services/medicalRecordService';
import { groupRecordItemsByVisitDate } from '../../utils/groupByVisitDate';
import { Card } from '../../components/common/Card';
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
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  const { visits, undatedFiles } = useMemo(
    () => groupRecordItemsByVisitDate(flattenPatientRecords(groups), 'recent'),
    [groups]
  );

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
      <header className="page-header">
        <h1>Meus Prontuários</h1>
        <p>
          Registros do mesmo dia aparecem juntos como um atendimento.
          Cada item mantém seu hash de integridade na blockchain.
        </p>
      </header>

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
          emptyMessage="Nenhum atendimento encontrado."
        />
      )}
    </div>
  );
}
