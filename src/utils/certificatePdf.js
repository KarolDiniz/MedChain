/**
 * Gera PDF de atestado médico no navegador (visão de impressão).
 * Não persiste nada no servidor — usa apenas dados já carregados da API.
 */

import { jsPDF } from 'jspdf';
import { formatDateBR, resolveItemDate } from './dateUtils';

const SPECIALTY_LABELS = {
  GENERAL: 'Clínica Geral',
  CARDIOLOGY: 'Cardiologia',
  DERMATOLOGY: 'Dermatologia',
  PEDIATRICS: 'Pediatria',
  ORTHOPEDICS: 'Ortopedia',
  NEUROLOGY: 'Neurologia',
  PSYCHIATRY: 'Psiquiatria',
  GYNECOLOGY: 'Ginecologia',
  OTHER: 'Outra',
};

function slugify(text) {
  return String(text || 'paciente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 40) || 'paciente';
}

function addDays(date, days) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

function formatSpecialty(value) {
  if (!value) return '—';
  const key = String(value).toUpperCase();
  return SPECIALTY_LABELS[key] || String(value);
}

/**
 * Extrai paciente/médico/atestado a partir do item da API + overrides opcionais.
 */
export function buildCertificatePdfContext(certificate, extras = {}) {
  const mr = certificate?.medical_record || {};
  const patientFromMr = mr.patient || {};
  const patientUser = patientFromMr.user || {};
  const doctor = mr.doctor || extras.doctor || {};
  const doctorUser = doctor.user || {};
  const extrasPatient = extras.patient || {};

  const issued = resolveItemDate(certificate) || new Date();
  const days = Math.max(1, parseInt(certificate?.period_of_leave, 10) || 1);
  const start = issued;
  const end = addDays(issued, days - 1);

  return {
    purpose: certificate?.purpose || 'Afastamento',
    days,
    issuedAt: issued,
    leaveStart: start,
    leaveEnd: end,
    patientName:
      extras.patientName
      || extrasPatient.full_name
      || patientUser.full_name
      || patientFromMr.full_name
      || 'Paciente',
    patientBirth:
      extras.patientBirth
      || extrasPatient.birth_date
      || extrasPatient.dateofbirth
      || patientFromMr.birth_date
      || patientUser.birth_date
      || null,
    patientCity:
      extras.patientCity
      || extrasPatient.address?.city
      || null,
    patientState:
      extras.patientState
      || extrasPatient.address?.state
      || null,
    doctorName:
      extras.doctorName
      || doctorUser.full_name
      || doctor.full_name
      || 'Médico(a)',
    doctorCrm: extras.doctorCrm || doctor.CRM || doctor.crm || '—',
    doctorSpecialty: formatSpecialty(extras.doctorSpecialty || doctor.specialty),
    documentId: certificate?.id || certificate?.public_id || mr.public_id || '—',
  };
}

function drawHeader(doc, margin, pageW) {
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MEDCHAIN', margin, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Atestado Médico', margin, 20);
  doc.setFontSize(8);
  doc.text('Documento gerado digitalmente', pageW - margin, 12, { align: 'right' });
}

function drawSectionTitle(doc, title, x, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 118, 110);
  doc.text(title, x, y);
  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(0.3);
  doc.line(x, y + 1.5, x + 55, y + 1.5);
  return y + 8;
}

/**
 * Gera e dispara o download do PDF do atestado.
 * @returns {{ filename: string }}
 */
export function downloadCertificatePdf(certificate, extras = {}) {
  const ctx = buildCertificatePdfContext(certificate, extras);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 36;

  drawHeader(doc, margin, pageW);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nº do registro: ${ctx.documentId}`, pageW - margin, y, { align: 'right' });
  y += 10;

  y = drawSectionTitle(doc, 'IDENTIFICAÇÃO DO MÉDICO', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(ctx.doctorName, margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`CRM: ${ctx.doctorCrm}  ·  Especialidade: ${ctx.doctorSpecialty}`, margin, y);
  y += 12;

  y = drawSectionTitle(doc, 'IDENTIFICAÇÃO DO PACIENTE', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(ctx.patientName, margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const birthLabel = ctx.patientBirth ? formatDateBR(ctx.patientBirth) : '—';
  let patientMeta = `Data de nascimento: ${birthLabel}`;
  if (ctx.patientCity) {
    patientMeta += `  ·  ${ctx.patientCity}${ctx.patientState ? `/${ctx.patientState}` : ''}`;
  }
  doc.text(patientMeta, margin, y);
  y += 14;

  y = drawSectionTitle(doc, 'ATESTADO', margin, y);

  const issuedLabel = formatDateBR(ctx.issuedAt);
  const startLabel = formatDateBR(ctx.leaveStart);
  const endLabel = formatDateBR(ctx.leaveEnd);
  const body = [
    `Atesto para os devidos fins que o(a) paciente ${ctx.patientName} necessita de afastamento de suas atividades por ${ctx.days} dia(s), a partir de ${issuedLabel}, com a finalidade de: ${ctx.purpose}.`,
    '',
    `Período de afastamento: ${startLabel} a ${endLabel} (${ctx.days} dia${ctx.days === 1 ? '' : 's'}).`,
  ].join('\n');

  const contentWidth = pageW - margin * 2;
  const lines = doc.splitTextToSize(body, contentWidth - 8);
  const lineH = 6;
  const boxPad = 6;
  const boxH = lines.length * lineH + boxPad * 2;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, boxH, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(lines, margin + 4, y + boxPad + 4);
  y += boxH + 24;

  // Assinatura simulada
  const sigX = pageW / 2;
  y = Math.max(y, pageH - 68);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(sigX - 45, y, sigX + 45, y);
  y += 8;

  // Nome em itálico como “assinatura” visual
  doc.setFont('times', 'italic');
  doc.setFontSize(16);
  doc.setTextColor(15, 118, 110);
  doc.text(ctx.doctorName, sigX, y, { align: 'center' });
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(ctx.doctorName, sigX, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`CRM ${ctx.doctorCrm}  ·  ${ctx.doctorSpecialty}`, sigX, y, { align: 'center' });
  y += 5;
  doc.setFontSize(8);
  doc.text('Assinatura eletrônica simulada — documento gerado pelo MedChain', sigX, y, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Emitido em ${formatDateBR(ctx.issuedAt)} · Visão de impressão · MedChain`,
    pageW / 2,
    pageH - 10,
    { align: 'center' }
  );

  const filename = `atestado-${slugify(ctx.patientName)}-${formatDateBR(ctx.issuedAt).replace(/\//g, '-')}.pdf`;
  doc.save(filename);
  return { filename };
}
