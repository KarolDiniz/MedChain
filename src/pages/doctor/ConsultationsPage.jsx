import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMedicalRecordsByDoctor, getPatientsByDoctor } from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import './ConsultationsPage.css';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ConsultationsPage() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const docId = user?.id || user?.public_id;
      if (!docId) {
        setLoading(false);
        return;
      }
      const [records, patients] = await Promise.all([
        getMedicalRecordsByDoctor(docId),
        getPatientsByDoctor(docId),
      ]);
      const getPatientName = (patientId) => {
        const p = patients?.find((x) => (x.patient_public_id || x.uid || x.id) === String(patientId));
        return p?.full_name || 'Paciente';
      };
      const items = (records || []).flatMap((mr) =>
        (mr.consultations || []).map((c) => ({
          id: `con-${mr.id}-${c.id}`,
          title: c.chief_complaint || 'Consulta',
          patientName: getPatientName(mr.patient_id),
          date: c.created_date || mr.updated_date,
          recordId: mr.id || mr.public_id,
        }))
      );
      items.sort((a, b) => new Date(b.date) - new Date(a.date));
      setConsultations(items);
      setLoading(false);
    };
    load();
  }, [user?.id, user?.public_id]);

  return (
    <div className="consultations-page">
      <header className="page-header">
        <div>
          <h1>Consultas</h1>
          <p>Histórico de consultas realizadas</p>
        </div>
      </header>

      <Card>
        {loading ? (
          <div className="empty-state">
            <p>Carregando...</p>
          </div>
        ) : consultations.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <Stethoscope size={48} strokeWidth={1.5} />
            </span>
            <h3>Nenhuma consulta registrada</h3>
            <p>As consultas aparecem aqui quando forem registradas nos prontuários.</p>
            <Link to="/doctor/medical-records" className="consultations-link">
              Ver prontuários
              <ChevronRight size={18} />
            </Link>
          </div>
        ) : (
          <ul className="consultations-list">
            {consultations.map((item) => (
              <li key={item.id} className="consultations-item">
                <span className="consultations-dot" />
                <div className="consultations-content">
                  <strong>{item.title}</strong>
                  <span className="consultations-meta">
                    {item.patientName} · {formatDate(item.date)}
                  </span>
                </div>
                <Link
                  to={`/doctor/medical-records/${item.recordId}`}
                  className="consultations-link consultations-link--inline"
                >
                  Ver prontuário
                  <ChevronRight size={16} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
