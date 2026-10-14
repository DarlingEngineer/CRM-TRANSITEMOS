import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { summarizeTickets, formatDateTime } from './reportExport';
import {
  STATUS_ORDER, STATUS_COLORS, STATUS_BADGES,
  PRIORITY_ORDER, PRIORITY_COLORS, PRIORITY_BADGES,
  SERIES_COLOR, CHART_INK, normalizeStatus,
} from './chartTheme';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Medidas en milímetros (A4 vertical: 210 x 297).
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const ROW_STRIPE = '#f8fafc';

function fitText(doc, text, maxWidth) {
  const value = String(text ?? '');
  if (doc.getTextWidth(value) <= maxWidth) return value;
  let cut = value;
  while (cut.length > 1 && doc.getTextWidth(`${cut}…`) > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

function ensureSpace(doc, y, needed) {
  if (y + needed <= PAGE_H - 18) return y;
  doc.addPage();
  return MARGIN + 4;
}

function sectionTitle(doc, title, x, y, width = CONTENT_W) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(CHART_INK.brand);
  doc.text(title, x, y);
  doc.setDrawColor(CHART_INK.grid);
  doc.setLineWidth(0.4);
  doc.line(x, y + 2, x + width, y + 2);
  return y + 8;
}

function drawHeader(doc, total) {
  doc.setFillColor(CHART_INK.brand);
  doc.rect(0, 0, PAGE_W, 30, 'F');
  doc.setFillColor(SERIES_COLOR);
  doc.rect(0, 30, PAGE_W, 1.4, 'F');

  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('Reporte de Gestión de Tickets', MARGIN, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('CRM Transitemos · Sistema de soporte interno', MARGIN, 21);

  doc.setFontSize(8.5);
  doc.text(`Generado: ${formatDateTime(new Date().toISOString())}`, PAGE_W - MARGIN, 14, { align: 'right' });
  doc.text(`${total} ticket(s) incluido(s)`, PAGE_W - MARGIN, 21, { align: 'right' });
}

function drawKpis(doc, kpis, y) {
  const gap = 4;
  const w = (CONTENT_W - gap * (kpis.length - 1)) / kpis.length;
  const h = 22;
  kpis.forEach((k, i) => {
    const x = MARGIN + i * (w + gap);
    doc.setFillColor('#ffffff');
    doc.setDrawColor(CHART_INK.grid);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');
    doc.setFillColor(k.color);
    doc.rect(x + 0.15, y + 0.15, w - 0.3, 1.6, 'F');

    doc.setTextColor(CHART_INK.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(String(k.value), x + w / 2, y + 12, { align: 'center' });
    doc.setTextColor(CHART_INK.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(k.label.toUpperCase(), x + w / 2, y + 18, { align: 'center' });
  });
  return y + h + 10;
}

// Barras horizontales con etiqueta, pista gris y valor al final.
function drawBars(doc, items, x, y, width) {
  const labelW = 32;
  const valueW = 10;
  const trackW = width - labelW - valueW;
  const rowH = 7;
  const max = Math.max(1, ...items.map((i) => i.value));

  items.forEach((item, idx) => {
    const rowY = y + idx * rowH;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(CHART_INK.text);
    doc.text(fitText(doc, item.label, labelW - 2), x, rowY + 3.2);

    doc.setFillColor(CHART_INK.track);
    doc.roundedRect(x + labelW, rowY, trackW, 4.2, 1.2, 1.2, 'F');
    const fillW = (item.value / max) * trackW;
    if (fillW > 0) {
      doc.setFillColor(item.color);
      doc.roundedRect(x + labelW, rowY, Math.max(fillW, 2.4), 4.2, 1.2, 1.2, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.text(String(item.value), x + width, rowY + 3.2, { align: 'right' });
  });
  return y + items.length * rowH + 4;
}

// Columnas verticales para la evolución mensual.
function drawColumns(doc, items, x, y, width, height) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const baseY = y + height;
  const slot = width / Math.max(items.length, 1);
  const barW = Math.min(14, slot * 0.6);

  doc.setDrawColor(CHART_INK.grid);
  doc.setLineWidth(0.2);
  [0.5, 1].forEach((f) => doc.line(x, baseY - height * f, x + width, baseY - height * f));
  doc.setDrawColor(CHART_INK.axis);
  doc.setLineWidth(0.3);
  doc.line(x, baseY, x + width, baseY);

  items.forEach((item, idx) => {
    const cx = x + slot * idx + slot / 2;
    const h = (item.value / max) * (height - 6);
    if (h > 0) {
      doc.setFillColor(SERIES_COLOR);
      doc.roundedRect(cx - barW / 2, baseY - h, barW, h, 1, 1, 'F');
      doc.rect(cx - barW / 2, baseY - Math.min(h, 1), barW, Math.min(h, 1), 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(CHART_INK.text);
    doc.text(String(item.value), cx, baseY - h - 1.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(CHART_INK.muted);
    doc.text(fitText(doc, item.label, slot - 1), cx, baseY + 4, { align: 'center' });
  });
  return baseY + 10;
}

const TABLE_STYLES = {
  theme: 'grid',
  margin: { left: MARGIN, right: MARGIN, bottom: 18 },
  styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 1.8, textColor: CHART_INK.text, lineColor: CHART_INK.grid, lineWidth: 0.2 },
  headStyles: { fillColor: CHART_INK.brand, textColor: '#ffffff', fontStyle: 'bold' },
  alternateRowStyles: { fillColor: ROW_STRIPE },
};

// Pinta las celdas de Estado y Prioridad con los mismos tintes de la app.
function badgeCells(statusCol, priorityCol) {
  return (data) => {
    if (data.section !== 'body') return;
    let theme = null;
    if (data.column.index === statusCol) theme = STATUS_BADGES[normalizeStatus(data.cell.raw)];
    if (data.column.index === priorityCol) theme = PRIORITY_BADGES[data.cell.raw];
    if (theme) {
      data.cell.styles.fillColor = theme.bg;
      data.cell.styles.textColor = theme.text;
      data.cell.styles.fontStyle = 'bold';
    }
  };
}

function drawFooters(doc) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(CHART_INK.grid);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(CHART_INK.muted);
    doc.text('Documento generado automáticamente por CRM Transitemos', MARGIN, PAGE_H - 7);
    doc.text(`Página ${i} de ${pages}`, PAGE_W - MARGIN, PAGE_H - 7, { align: 'right' });
  }
}

export function buildPdfReport(data) {
  const { tickets = [], porMes = [], porArea = [], porPrioridad = [], tiempo } = data || {};
  const s = summarizeTickets(tickets);
  const avg = tiempo?.average_hours ?? s.avgHours;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setProperties({ title: 'Reporte de Tickets — TRANSITEMOS', author: 'CRM Transitemos' });

  drawHeader(doc, s.total);

  let y = drawKpis(doc, [
    { label: 'Total de tickets', value: s.total, color: CHART_INK.brand },
    { label: 'Abiertos', value: s.openCount, color: STATUS_COLORS.Abierto },
    { label: 'Resueltos / cerrados', value: s.resolvedCount, color: STATUS_COLORS.Resuelto },
    { label: 'Promedio resolución', value: avg != null ? `${Number(avg).toFixed(1)} h` : 'N/A', color: SERIES_COLOR },
  ], 40);

  // Estado y prioridad lado a lado
  const colGap = 10;
  const colW = (CONTENT_W - colGap) / 2;
  const rightX = MARGIN + colW + colGap;
  sectionTitle(doc, 'Distribución por estado', MARGIN, y, colW);
  sectionTitle(doc, 'Distribución por prioridad', rightX, y, colW);
  y += 8;
  const statusEnd = drawBars(doc, STATUS_ORDER.map((st) => ({
    label: st, value: s.byStatus[st] || 0, color: STATUS_COLORS[st],
  })), MARGIN, y, colW);
  const priorityEnd = drawBars(doc, PRIORITY_ORDER.map((p) => ({
    label: p, value: porPrioridad.find((x) => x.name === p)?.total ?? (s.byPriority[p] || 0), color: PRIORITY_COLORS[p],
  })), rightX, y, colW);
  y = Math.max(statusEnd, priorityEnd) + 4;

  // Áreas: una sola serie ordenada de mayor a menor
  const areaItems = [...porArea].sort((a, b) => b.total - a.total)
    .map((a) => ({ label: a.area, value: a.total, color: SERIES_COLOR }));
  y = ensureSpace(doc, y, 16 + areaItems.length * 7);
  y = sectionTitle(doc, 'Tickets por área', MARGIN, y);
  if (areaItems.length) {
    y = drawBars(doc, areaItems, MARGIN, y, CONTENT_W) + 4;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(CHART_INK.muted);
    doc.text('Sin datos', MARGIN, y + 2);
    y += 10;
  }

  // Evolución mensual
  const meses = porMes.slice(-12).map((m) => ({ label: `${MESES[m.month - 1] || m.month} ${String(m.year).slice(-2)}`, value: m.total }));
  if (meses.length) {
    y = ensureSpace(doc, y, 60);
    y = sectionTitle(doc, 'Evolución mensual', MARGIN, y);
    y = drawColumns(doc, meses, MARGIN, y, CONTENT_W, 36);
  }

  // Tickets abiertos más antiguos
  if (s.oldestOpen.length) {
    y = ensureSpace(doc, y, 30);
    y = sectionTitle(doc, 'Tickets abiertos más antiguos', MARGIN, y);
    autoTable(doc, {
      ...TABLE_STYLES,
      startY: y,
      head: [['ID', 'Título', 'Prioridad', 'Estado', 'Área', 'Creado']],
      body: s.oldestOpen.map((t) => [t.id, t.title, t.priority, t.status, t.area, formatDateTime(t.created_at)]),
      didParseCell: badgeCells(3, 2),
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Detalle completo
  y = ensureSpace(doc, y, 30);
  y = sectionTitle(doc, `Detalle de tickets (${tickets.length})`, MARGIN, y);
  autoTable(doc, {
    ...TABLE_STYLES,
    startY: y,
    styles: { ...TABLE_STYLES.styles, fontSize: 7 },
    head: [['ID', 'Título', 'Prioridad', 'Estado', 'Área', 'Descripción', 'Actualizado por', 'Creado', 'Actualizado']],
    body: [...tickets].sort((a, b) => b.id - a.id).map((t) => [
      t.id, t.title, t.priority, t.status, t.area, t.body || '', t.updated_by || '',
      formatDateTime(t.created_at), formatDateTime(t.updated_at),
    ]),
    columnStyles: {
      0: { cellWidth: 8 },
      2: { cellWidth: 16 },
      3: { cellWidth: 17 },
      7: { cellWidth: 18 },
      8: { cellWidth: 18 },
    },
    didParseCell: badgeCells(3, 2),
  });

  drawFooters(doc);
  return doc;
}

export function downloadPdfReport(data) {
  const doc = buildPdfReport(data);
  doc.save(`reporte_tickets_${new Date().toISOString().slice(0, 10)}.pdf`);
}
