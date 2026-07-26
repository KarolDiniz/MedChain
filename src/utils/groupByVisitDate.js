/**
 * Agrupa itens clínicos por data civil (YYYY-MM-DD) no fuso local.
 * Front-only: não há episode_id no backend.
 */

import { resolveItemDate } from './dateUtils';

function toDateKey(value) {
  const d = value instanceof Date ? value : (value ? new Date(value) : null);
  if (!d || Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * @param {{ consultations?: any[], diagnostics?: any[], medical_certificates?: any[], files?: any[] }} record
 * @param {'recent'|'oldest'} sortOrder
 */
export function groupRecordItemsByVisitDate(record, sortOrder = 'recent') {
  const map = new Map();

  const ensure = (key) => {
    if (!map.has(key)) {
      map.set(key, {
        dateKey: key,
        dateLabel: formatDateKey(key),
        consultations: [],
        diagnostics: [],
        medical_certificates: [],
        files: [],
        count: 0,
      });
    }
    return map.get(key);
  };

  const push = (kind, list) => {
    (list || []).forEach((item) => {
      const d = resolveItemDate(item, kind === 'certificate' ? 'generic' : kind);
      const key = toDateKey(d);
      if (!key) return;
      const visit = ensure(key);
      if (kind === 'consultation') visit.consultations.push(item);
      else if (kind === 'diagnostic') visit.diagnostics.push(item);
      else if (kind === 'certificate') visit.medical_certificates.push(item);
      else if (kind === 'file') visit.files.push(item);
      visit.count += 1;
    });
  };

  push('consultation', record?.consultations);
  push('diagnostic', record?.diagnostics);
  push('certificate', record?.medical_certificates);

  const undatedFiles = [];
  (record?.files || []).forEach((f) => {
    const d = resolveItemDate(f, 'file');
    const key = toDateKey(d);
    if (!key) {
      undatedFiles.push(f);
      return;
    }
    const visit = ensure(key);
    visit.files.push(f);
    visit.count += 1;
  });

  const visits = Array.from(map.values()).sort((a, b) => {
    const cmp = a.dateKey.localeCompare(b.dateKey);
    return sortOrder === 'oldest' ? cmp : -cmp;
  });

  return { visits, undatedFiles };
}

export function formatDateKey(dateKey) {
  if (!dateKey) return 'Sem data';
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function summarizeVisit(visit) {
  const parts = [];
  if (visit.consultations?.length) parts.push(`${visit.consultations.length} consulta(s)`);
  if (visit.diagnostics?.length) parts.push(`${visit.diagnostics.length} diagnóstico(s)`);
  if (visit.medical_certificates?.length) parts.push(`${visit.medical_certificates.length} atestado(s)`);
  if (visit.files?.length) parts.push(`${visit.files.length} arquivo(s)`);
  return parts.join(' · ') || 'Sem itens';
}
