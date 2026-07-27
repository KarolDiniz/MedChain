import { useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, Stethoscope, ClipboardList, FileCheck, Paperclip, UserRound } from 'lucide-react';
import { Card } from './Card';
import { IntegrityBadge } from './IntegrityBadge';
import { FileAttachment } from './FileAttachment';
import { CertificateDownloadButton } from './CertificateDownloadButton';
import { summarizeVisit } from '../../utils/groupByVisitDate';
import './VisitTimeline.css';

function doctorNameFromItem(item) {
  const doctor = item?.medical_record?.doctor || item?.doctor;
  return doctor?.user?.full_name || doctor?.full_name || null;
}

function DoctorLine({ item }) {
  const name = doctorNameFromItem(item);
  if (!name) return null;
  return (
    <div className="visit-doctor">
      <UserRound size={14} />
      <span>Médico: {name}</span>
      {item?.medical_record?.doctor?.CRM || item?.doctor?.CRM ? (
        <span className="visit-doctor-crm">
          · {item?.medical_record?.doctor?.CRM || item?.doctor?.CRM}
        </span>
      ) : null}
    </div>
  );
}

function ConsultationBlock({ item }) {
  return (
    <div className="visit-item visit-item--consultation">
      <div className="visit-item-head">
        <Stethoscope size={16} />
        <strong>Consulta</strong>
      </div>
      <DoctorLine item={item} />
      <div><span>Queixa:</span> {item.chief_complaint || '-'}</div>
      {item.history_of_present_illness && (
        <div><span>História:</span> {item.history_of_present_illness}</div>
      )}
      <div><span>Diagnóstico:</span> {item.diagnosis || '-'}</div>
      <div><span>Plano:</span> {item.treatment_plan || '-'}</div>
      {(item.prescription?.items?.length > 0 || item.prescriptions?.[0]?.items?.length > 0) && (
        <div className="visit-prescriptions">
          <strong>Prescrições</strong>
          {(item.prescription?.items || item.prescriptions?.[0]?.items || []).map((rx, i) => (
            <div key={i}>
              {rx.medication_name} — {rx.dosage} {rx.frequency}
              {rx.treatment_duration ? ` (${rx.treatment_duration})` : ''}
            </div>
          ))}
        </div>
      )}
      <IntegrityBadge item={item} label="Consulta" compact showVerify />
    </div>
  );
}

function DiagnosticBlock({ item }) {
  return (
    <div className="visit-item visit-item--diagnostic">
      <div className="visit-item-head">
        <ClipboardList size={16} />
        <strong>Diagnóstico / exame</strong>
      </div>
      <DoctorLine item={item} />
      <div><span>Descrição:</span> {item.description || '-'}</div>
      <div><span>Resultado:</span> {item.result || '-'}</div>
      <IntegrityBadge item={item} label="Diagnóstico" compact showVerify />
    </div>
  );
}

function CertificateBlock({ item, patient }) {
  return (
    <div className="visit-item visit-item--certificate">
      <div className="visit-item-head visit-item-head--row">
        <span className="visit-item-head-label">
          <FileCheck size={16} />
          <strong>Atestado</strong>
        </span>
        <CertificateDownloadButton certificate={item} patient={patient} compact />
      </div>
      <DoctorLine item={item} />
      <div>{item.purpose || '-'} — {item.period_of_leave ?? '-'} dia(s)</div>
      <IntegrityBadge item={item} label="Atestado" compact showVerify />
    </div>
  );
}

function VisitCard({ visit, defaultOpen = false, patient, note }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={`visit-card ${open ? 'visit-card--open' : ''}`}>
      <button type="button" className="visit-card-header" onClick={() => setOpen((v) => !v)}>
        <div className="visit-card-title">
          <span className="visit-card-icon"><CalendarDays size={18} /></span>
          <div>
            <h3>Atendimento — {visit.dateLabel}</h3>
            <p>{summarizeVisit(visit)}</p>
          </div>
        </div>
        <span className="visit-card-toggle" aria-hidden>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {open && (
        <div className="visit-card-body">
          <p className="visit-card-note">
            {note
              || 'Registros do mesmo dia agrupados visualmente. Cada item mantém sua própria evidência de integridade.'}
          </p>

          {visit.consultations.map((c) => (
            <ConsultationBlock key={`c-${c.id}`} item={c} />
          ))}
          {visit.diagnostics.map((d) => (
            <DiagnosticBlock key={`d-${d.id}`} item={d} />
          ))}
          {visit.medical_certificates.map((cert) => (
            <CertificateBlock key={`cert-${cert.id}`} item={cert} patient={patient} />
          ))}
          {visit.files?.length > 0 && (
            <div className="visit-files">
              <div className="visit-item-head">
                <Paperclip size={16} />
                <strong>Arquivos</strong>
              </div>
              <div className="visit-files-grid">
                {visit.files.map((f) => (
                  <FileAttachment key={f.id} file={f} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Timeline de atendimentos agrupados por data (front-only).
 */
export function VisitTimeline({ visits = [], undatedFiles = [], emptyMessage, patient, note }) {
  if (!visits.length && !undatedFiles.length) {
    return (
      <Card>
        <div className="visit-empty">
          <CalendarDays size={40} strokeWidth={1.5} />
          <p>{emptyMessage || 'Nenhum atendimento registrado.'}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="visit-timeline">
      {visits.map((visit, index) => (
        <VisitCard
          key={visit.dateKey}
          visit={visit}
          defaultOpen={index === 0}
          patient={patient}
          note={note}
        />
      ))}

      {undatedFiles.length > 0 && (
        <Card className="visit-card visit-card--undated">
          <div className="visit-card-header visit-card-header--static">
            <div className="visit-card-title">
              <span className="visit-card-icon"><Paperclip size={18} /></span>
              <div>
                <h3>Arquivos sem data</h3>
                <p>
                  {undatedFiles.length} anexo{undatedFiles.length !== 1 ? 's' : ''} sem data de upload registrada.
                </p>
              </div>
            </div>
          </div>
          <div className="visit-card-body">
            <div className="visit-files-grid">
              {undatedFiles.map((f) => (
                <FileAttachment key={f.id} file={f} />
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
