/**
 * Formatação segura de datas vindas da API.
 * Evita "Invalid Date" quando o campo vem null/undefined/inválido.
 */

export function parseDate(value) {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateBR(value, options) {
  const d = parseDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('pt-BR', options);
}

export function formatDateTimeBR(value) {
  const d = parseDate(value);
  if (!d) return '—';
  return d.toLocaleString('pt-BR');
}

/** Melhor data disponível para um item clínico (fallback em medical_record). */
export function resolveItemDate(item, kind = 'generic') {
  if (!item) return null;
  if (kind === 'diagnostic') {
    return (
      parseDate(item.issue_date)
      || parseDate(item.created_date)
      || parseDate(item.medical_record?.created_date)
    );
  }
  if (kind === 'file') {
    return (
      parseDate(item.created_date)
      || parseDate(item.uploaded_at)
      || parseDate(item.created)
    );
  }
  return (
    parseDate(item.created_date)
    || parseDate(item.medical_record?.created_date)
    || parseDate(item.issue_date)
  );
}

export function resolveItemDateISO(item, kind = 'generic') {
  const d = resolveItemDate(item, kind);
  return d ? d.toISOString() : null;
}
