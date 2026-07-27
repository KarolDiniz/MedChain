/**
 * PDF resumido dos atendimentos do paciente (visão de impressão no cliente).
 */

import { jsPDF } from 'jspdf';
import { formatDateBR, resolveItemDate } from './dateUtils';
import { getIntegrityStatus, shortenHash } from './blockchain';

function slugify(text) {
  return String(text || 'paciente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 40) || 'paciente';
}

/**
 * @param {{ consultations?: any[], diagnostics?: any[], medical_certificates?: any[], files?: any[] }} flat
 * @param {{ patientName?: string }} extras
 */
export function downloadRecordsSummaryPdf(flat, extras = {}) {
  const patientName = extras.patientName || 'Paciente';
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = 20;

  const ensureSpace = (need = 16) => {
    if (y + need > pageH - 16) {
      doc.addPage();
      y = 20;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 118, 110);
  doc.text('MEDCHAIN — Resumo de prontuário', margin, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Paciente: ${patientName}`, margin, y);
  y += 5;
  doc.text(`Gerado em: ${formatDateBR(new Date())} · Visão de impressão (não armazenada no servidor)`, margin, y);
  y += 10;

  const sections = [
    {
      title: 'Consultas',
      items: flat?.consultations || [],
      line: (c) =>
        `${formatDateBR(resolveItemDate(c))} — ${c.chief_complaint || c.diagnosis || 'Consulta'}`,
    },
    {
      title: 'Diagnósticos / exames',
      items: flat?.diagnostics || [],
      line: (d) =>
        `${formatDateBR(resolveItemDate(d, 'diagnostic'))} — ${d.description || 'Diagnóstico'}`,
    },
    {
      title: 'Atestados',
      items: flat?.medical_certificates || [],
      line: (c) =>
        `${formatDateBR(resolveItemDate(c))} — ${c.purpose || 'Atestado'} (${c.period_of_leave ?? '—'} dia(s))`,
    },
    {
      title: 'Arquivos',
      items: flat?.files || [],
      line: (f) =>
        `${formatDateBR(resolveItemDate(f, 'file'))} — ${f.description || f.format || 'Arquivo'}`,
    },
  ];

  sections.forEach((sec) => {
    ensureSpace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sec.title} (${sec.items.length})`, margin, y);
    y += 6;

    if (!sec.items.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('Nenhum item.', margin, y);
      y += 8;
      return;
    }

    sec.items.forEach((item) => {
      ensureSpace(14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(sec.line(item), pageW - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 4.5;

      const status = getIntegrityStatus(item);
      const hash = item.hash || item.medical_record?.hash;
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      const integrityLine = hash
        ? `Integridade: ${status.label} · ${shortenHash(hash, 8)}`
        : `Integridade: ${status.label}`;
      doc.text(integrityLine, margin, y);
      y += 6;
    });
    y += 4;
  });

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Use “Verificar integridade” no MedChain para confirmar a âncora on-chain.',
    pageW / 2,
    pageH - 10,
    { align: 'center' }
  );

  const filename = `resumo-prontuario-${slugify(patientName)}.pdf`;
  doc.save(filename);
  return { filename };
}
