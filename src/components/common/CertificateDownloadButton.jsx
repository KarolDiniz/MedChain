import { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadCertificatePdf } from '../../utils/certificatePdf';
import './CertificateDownloadButton.css';

/**
 * Botão que gera o PDF do atestado no cliente (sem endpoint de back).
 */
export function CertificateDownloadButton({
  certificate,
  patient,
  doctor,
  patientName,
  doctorName,
  className = '',
  compact = false,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!certificate || busy) return;
    setBusy(true);
    setError('');
    try {
      downloadCertificatePdf(certificate, {
        patient,
        doctor,
        patientName: patientName || patient?.full_name,
        doctorName: doctorName || doctor?.full_name || doctor?.user?.full_name,
        patientBirth: patient?.birth_date || patient?.dateofbirth,
        patientCity: patient?.address?.city,
        patientState: patient?.address?.state,
        doctorCrm: doctor?.CRM || doctor?.crm,
        doctorSpecialty: doctor?.specialty,
      });
    } catch (err) {
      setError(err?.message || 'Não foi possível gerar o PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`cert-download ${className}`.trim()}>
      <button
        type="button"
        className={`cert-download-btn${compact ? ' cert-download-btn--compact' : ''}`}
        onClick={handleClick}
        disabled={busy || !certificate}
        title="Baixar atestado em PDF"
      >
        <Download size={compact ? 14 : 16} strokeWidth={2} />
        {busy ? 'Gerando…' : compact ? 'PDF' : 'Baixar PDF'}
      </button>
      {error && <span className="cert-download-error">{error}</span>}
    </div>
  );
}
