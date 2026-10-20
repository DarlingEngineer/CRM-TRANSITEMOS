import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import {
  buildReportFilename,
  buildReportModel,
  displayValue,
  formatDateTime,
  formatHours,
  formatNumber,
  formatPercent,
  loadImageDataUrl,
  parseDate,
} from './reportData';
import {
  CHART_INK,
  PRIORITY_BADGES,
  PRIORITY_COLORS,
  SERIES_COLOR,
  STATUS_BADGES,
  STATUS_COLORS,
  normalizeStatus,
} from './chartTheme';

// Medidas en milímetros. El detalle tiene nueve columnas, por eso
// el informe completo usa tamaño carta horizontal (279 x 216 mm).
const PAGE_W = 279.4;
const PAGE_H = 215.9;
const MARGIN = 12;
const CONTENT_W = PAGE_W - MARGIN * 2;
const CONTENT_TOP = 20;
const PAGE_BOTTOM = PAGE_H - 14;
const HEADER_H = 30;
const ROW_STRIPE = '#f8fafc';

const BRAND = CHART_INK.brand;
const INK = CHART_INK.text;
const MUTED = CHART_INK.muted;
const LINE = CHART_INK.grid;

function fitText(doc, text, maxWidth) {
  const value = String(text ?? '');
  if (!value) return '—';
  if (doc.getTextWidth(value) <= maxWidth) return value;
  let cut = value;
  while (cut.length > 1 && doc.getTextWidth(`${cut}…`) > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

function ensureSpace(doc, y, needed) {
  if (y + needed <= PAGE_BOTTOM) return y;
  doc.addPage();
  return CONTENT_TOP;
}

function sectionTitle(doc, title, x, y, width = CONTENT_W) {
  doc.setFillColor(SERIES_COLOR);
  doc.rect(x, y - 3.1, 2.6, 3.1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(BRAND);
  doc.text(title, x + 5, y);
  doc.setDrawColor(LINE);
  doc.setLineWidth(0.35);
  doc.line(x, y + 2.6, x + width, y + 2.6);
  return y + 8;
}

function drawLogo(doc, logoDataUrl, x, y, size) {
  doc.setFillColor('#ffffff');
  doc.roundedRect(x, y, size, size, 2, 2, 'F');
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', x + 1.2, y + 1.2, size - 2.4, size - 2.4);
      return;
    } catch {
      // Si la imagen no se puede incrustar, se usa el monograma.
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size * 0.32);
  doc.setTextColor(BRAND);
  doc.text('TM', x + size / 2, y + size * 0.63, { align: 'center' });
}

function drawCoverHeader(doc, model, logoDataUrl) {
  doc.setFillColor(BRAND);
  doc.rect(0, 0, PAGE_W, HEADER_H - 1, 'F');
  doc.setFillColor(SERIES_COLOR);
  doc.rect(0, HEADER_H - 1, PAGE_W, 1.5, 'F');

  drawLogo(doc, logoDataUrl, MARGIN, 6, 18);

  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('TRANSITEMOS', MARGIN + 23, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('CRM de Gestión de Solicitudes', MARGIN + 23, 20);
  doc.setFontSize(7.5);
  doc.text(model.meta.subtitle, MARGIN + 23, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('REPORTE DE GESTIÓN DE TICKETS', PAGE_W - MARGIN, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generado: ${formatDateTime(model.generatedAt)}`, PAGE_W - MARGIN, 18, { align: 'right' });
  doc.text(`${formatNumber(model.total)} ticket(s) incluido(s)`, PAGE_W - MARGIN, 24, { align: 'right' });
}

function drawContinuationHeader(doc, model) {
  doc.setFillColor(BRAND);
  doc.rect(0, 0, PAGE_W, 13, 'F');
  doc.setFillColor(SERIES_COLOR);
  doc.rect(0, 13, PAGE_W, 1, 'F');
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TRANSITEMOS · Reporte de Gestión de Tickets', MARGIN, 8.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Generado: ${formatDateTime(model.generatedAt)}`, PAGE_W - MARGIN, 8.2, { align: 'right' });
}

function drawFooters(doc, model) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(LINE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(MUTED);
    doc.text('CRM Transitemos · Documento generado automáticamente', MARGIN, PAGE_H - 7.5);
    doc.text(model.meta.title, PAGE_W / 2, PAGE_H - 7.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(INK);
    doc.text(`Página ${page} de ${pages}`, PAGE_W - MARGIN, PAGE_H - 7.5, { align: 'right' });
  }
}

function decoratePages(doc, model, logoDataUrl) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    if (page === 1) drawCoverHeader(doc, model, logoDataUrl);
    else drawContinuationHeader(doc, model);
  }
  drawFooters(doc, model);
}

function drawKpis(doc, kpis, y) {
  const gap = 4;
  const width = (CONTENT_W - gap * (kpis.length - 1)) / kpis.length;
  const height = 24;
  kpis.forEach((kpi, index) => {
    const x = MARGIN + index * (width + gap);
    doc.setFillColor('#ffffff');
    doc.setDrawColor(LINE);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, width, height, 2, 2, 'FD');
    doc.setFillColor(kpi.color);
    doc.rect(x + 0.2, y + 0.2, width - 0.4, 1.7, 'F');

    doc.setTextColor(INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(kpi.value.length > 7 ? 13 : 16);
    doc.text(fitText(doc, kpi.value, width - 8), x + width / 2, y + 11.5, { align: 'center' });
    doc.setTextColor(MUTED);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text(fitText(doc, kpi.label.toUpperCase(), width - 5), x + width / 2, y + 17, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(fitText(doc, kpi.hint, width - 5), x + width / 2, y + 21, { align: 'center' });
  });
  return y + height + 8;
}

function drawDistribution(doc, title, rows, x, y, width) {
  let currentY = sectionTitle(doc, title, x, y, width);
  const labelW = 29;
  const valueW = 27;
  const trackW = width - labelW - valueW;
  const rowH = 8;

  rows.forEach((row) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(INK);
    doc.text(fitText(doc, row.name, labelW - 2), x, currentY + 3.1);

    doc.setFillColor(CHART_INK.track);
    doc.roundedRect(x + labelW, currentY, trackW, 4.2, 1.2, 1.2, 'F');
    const fillW = row.pct * trackW;
    if (fillW > 0) {
      doc.setFillColor(row.color);
      doc.roundedRect(x + labelW, currentY, Math.max(fillW, 2), 4.2, 1.2, 1.2, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(INK);
    doc.text(`${formatNumber(row.total)} · ${formatPercent(row.pct)}`, x + width, currentY + 3.1, { align: 'right' });
    currentY += rowH;
  });

  return currentY + 3;
}

function drawAreaBars(doc, title, rows, x, y, width) {
  let currentY = sectionTitle(doc, title, x, y, width);
  if (!rows.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text('Sin datos disponibles para este periodo.', x, currentY + 2);
    return currentY + 11;
  }

  const labelW = 57;
  const valueW = 20;
  const trackW = width - labelW - valueW;
  const rowH = 7.4;
  const max = Math.max(1, ...rows.map((row) => row.total));

  rows.forEach((row) => {
    if (currentY + rowH > PAGE_BOTTOM) {
      doc.addPage();
      currentY = sectionTitle(doc, `${title} (continuación)`, x, CONTENT_TOP, width);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(INK);
    doc.text(fitText(doc, row.area, labelW - 2), x, currentY + 3.2);

    doc.setFillColor(CHART_INK.track);
    doc.roundedRect(x + labelW, currentY, trackW, 4.2, 1.2, 1.2, 'F');
    const fillW = (row.total / max) * trackW;
    if (fillW > 0) {
      doc.setFillColor(SERIES_COLOR);
      doc.roundedRect(x + labelW, currentY, Math.max(fillW, 2.2), 4.2, 1.2, 1.2, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.3);
    doc.text(`${formatNumber(row.total)} · ${formatPercent(row.pct)}`, x + width, currentY + 3.2, { align: 'right' });
    currentY += rowH;
  });

  return currentY + 3;
}

function drawMonthlyColumns(doc, title, rows, x, y, width, height = 36) {
  let currentY = sectionTitle(doc, title, x, y, width);
  const items = rows.slice(-12);
  if (!items.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text('Sin datos disponibles para este periodo.', x, currentY + 2);
    return currentY + 11;
  }

  const max = Math.max(1, ...items.map((row) => row.total));
  const baseY = currentY + height;
  const slot = width / Math.max(items.length, 1);
  const barW = Math.min(14, slot * 0.58);

  doc.setDrawColor(LINE);
  doc.setLineWidth(0.2);
  [0.5, 1].forEach((factor) => doc.line(x, baseY - height * factor, x + width, baseY - height * factor));
  doc.setDrawColor(CHART_INK.axis);
  doc.setLineWidth(0.3);
  doc.line(x, baseY, x + width, baseY);

  items.forEach((item, index) => {
    const centerX = x + slot * index + slot / 2;
    const barH = (item.total / max) * (height - 7);
    if (barH > 0) {
      doc.setFillColor(SERIES_COLOR);
      doc.roundedRect(centerX - barW / 2, baseY - barH, barW, barH, 1, 1, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(INK);
    doc.text(formatNumber(item.total), centerX, baseY - barH - 1.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED);
    doc.text(fitText(doc, item.label, slot - 1.5), centerX, baseY + 4.2, { align: 'center' });
  });

  return baseY + 11;
}

function badgeCells(statusCol, priorityCol) {
  return (data) => {
    if (data.section !== 'body') return;
    if (data.column.index === statusCol) {
      const badge = STATUS_BADGES[normalizeStatus(data.cell.raw)];
      if (badge) {
        data.cell.styles.fillColor = badge.bg;
        data.cell.styles.textColor = badge.text;
        data.cell.styles.fontStyle = 'bold';
      }
    }
    if (data.column.index === priorityCol) {
      const badge = PRIORITY_BADGES[data.cell.raw];
      if (badge) {
        data.cell.styles.fillColor = badge.bg;
        data.cell.styles.textColor = badge.text;
        data.cell.styles.fontStyle = 'bold';
      }
    }
  };
}

function drawOldestOpen(doc, rows, y, model) {
  if (!rows.length) return y;
  y = ensureSpace(doc, y, 34);
  y = sectionTitle(doc, 'Tickets abiertos más antiguos', MARGIN, y);
  autoTable(doc, {
    startY: y,
    margin: { top: CONTENT_TOP, left: MARGIN, right: MARGIN, bottom: 15 },
    theme: 'grid',
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 1.6,
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.2,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: BRAND,
      textColor: '#ffffff',
      fontStyle: 'bold',
      fontSize: 7.2,
    },
    alternateRowStyles: { fillColor: ROW_STRIPE },
    head: [['ID', 'Título', 'Prioridad', 'Estado', 'Área', 'Creado', 'Días']],
    body: rows.map((ticket) => {
      const created = parseDate(ticket.created_at);
      const days = created
        ? Math.max(0, Math.floor((model.generatedAt.getTime() - created.getTime()) / 86400000))
        : '—';
      return [
        ticket.id,
        displayValue(ticket.title),
        displayValue(ticket.priority),
        displayValue(ticket.status),
        displayValue(ticket.area),
        formatDateTime(ticket.created_at),
        days,
      ];
    }),
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 92.4 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 58 },
      5: { cellWidth: 36, halign: 'center' },
      6: { cellWidth: 17, halign: 'center' },
    },
    didParseCell: badgeCells(3, 2),
  });
  return doc.lastAutoTable.finalY + 9;
}

function drawDetail(doc, rows, model, startY = CONTENT_TOP) {
  // Si el resumen ya ocupó más de una página y queda espacio suficiente,
  // el detalle continúa en esa misma página para no dejar áreas vacías.
  let y = startY;
  if (!(doc.getNumberOfPages() > 1 && y + 40 <= PAGE_BOTTOM)) {
    doc.addPage();
    y = CONTENT_TOP;
  }
  y = sectionTitle(doc, `Detalle de tickets (${formatNumber(rows.length)})`, MARGIN, y);
  autoTable(doc, {
    startY: y,
    margin: { top: CONTENT_TOP, left: MARGIN, right: MARGIN, bottom: 15 },
    theme: 'grid',
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    styles: {
      font: 'helvetica',
      fontSize: 6.6,
      cellPadding: 1.25,
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.16,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: BRAND,
      textColor: '#ffffff',
      fontStyle: 'bold',
      fontSize: 6.8,
      halign: 'center',
    },
    alternateRowStyles: { fillColor: ROW_STRIPE },
    head: [['ID', 'Título', 'Prioridad', 'Estado', 'Área', 'Descripción', 'Actualizado por', 'Creado', 'Actualizado']],
    body: rows.map((ticket) => [
      ticket.id,
      displayValue(ticket.title),
      displayValue(ticket.priority),
      displayValue(ticket.status),
      displayValue(ticket.area),
      displayValue(ticket.body),
      displayValue(ticket.updated_by),
      formatDateTime(ticket.created_at),
      formatDateTime(ticket.updated_at),
    ]),
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 44 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 17, halign: 'center' },
      4: { cellWidth: 30 },
      5: { cellWidth: 80.4 },
      6: { cellWidth: 21 },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 20, halign: 'center' },
    },
    didParseCell: badgeCells(3, 2),
  });
  y = doc.lastAutoTable.finalY + 7;

  if (y < PAGE_BOTTOM) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(MUTED);
    doc.text(
      `Total de registros en el detalle: ${formatNumber(rows.length)} · ${model.scopeNote}`,
      MARGIN,
      y,
    );
  }
}

function drawEmptyState(doc, y, total) {
  const height = 34;
  doc.setFillColor('#f4f8fc');
  doc.setDrawColor(LINE);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, height, 2, 2, 'FD');
  doc.setFillColor(SERIES_COLOR);
  doc.rect(MARGIN + 0.2, y + 0.2, CONTENT_W - 0.4, 1.6, 'F');

  doc.setTextColor(BRAND);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Sin registros para mostrar', PAGE_W / 2, y + 13, { align: 'center' });
  doc.setTextColor(MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    total
      ? 'No se encontraron tickets que cumplan los criterios del reporte.'
      : 'No hay tickets disponibles para generar el detalle. Se muestra el resumen sin registros.',
    PAGE_W / 2,
    y + 21,
    { align: 'center', maxWidth: CONTENT_W - 20 },
  );
  doc.setFontSize(7.5);
  doc.text('La información se actualizará cuando existan solicitudes en el sistema.', PAGE_W / 2, y + 28, {
    align: 'center',
    maxWidth: CONTENT_W - 20,
  });
  return y + height + 8;
}

function drawSummary(doc, model) {
  let y = HEADER_H + 9;
  y = sectionTitle(doc, 'Resumen ejecutivo', MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(MUTED);
  const scopeLines = doc.splitTextToSize(model.scopeNote, CONTENT_W);
  doc.text(scopeLines, MARGIN, y);
  y += scopeLines.length * 3.6 + 2.5;

  const period = model.period
    ? `Periodo de los datos: ${formatDateTime(model.period.from)} — ${formatDateTime(model.period.to)}`
    : 'Periodo de los datos: sin fechas válidas.';
  const periodLines = doc.splitTextToSize(period, CONTENT_W);
  doc.text(periodLines, MARGIN, y);
  y += periodLines.length * 3.6 + 5.5;

  y = drawKpis(doc, [
    { label: 'Total de tickets', value: formatNumber(model.total), hint: 'Registros incluidos', color: BRAND },
    { label: 'Tickets abiertos', value: formatNumber(model.openCount), hint: 'Pendientes de cierre', color: CHART_INK.brand },
    { label: 'Resueltos / cerrados', value: formatNumber(model.resolvedCount), hint: 'Atención finalizada', color: '#1baf7a' },
    { label: 'Tiempo promedio', value: model.avgHours != null ? formatHours(model.avgHours) : '—', hint: 'Horas de resolución', color: SERIES_COLOR },
  ], y);

  // Estado y prioridad lado a lado.
  y = ensureSpace(doc, y, 52);
  const gap = 10;
  const colW = (CONTENT_W - gap) / 2;
  const rightX = MARGIN + colW + gap;
  const statusEnd = drawDistribution(
    doc,
    'Distribución por estado',
    model.statusRows.map((row) => ({ ...row, color: STATUS_COLORS[row.name] || BRAND })),
    MARGIN,
    y,
    colW,
  );
  const priorityEnd = drawDistribution(
    doc,
    'Distribución por prioridad',
    model.priorityRows.map((row) => ({ ...row, color: PRIORITY_COLORS[row.name] || SERIES_COLOR })),
    rightX,
    y,
    colW,
  );
  y = Math.max(statusEnd, priorityEnd) + 2;

  // Áreas: se muestra la distribución completa; si crece, continúa en otra página.
  y = ensureSpace(doc, y, 22);
  y = drawAreaBars(doc, 'Tickets por área', model.areaRows, MARGIN, y, CONTENT_W);

  // Evolución mensual (últimos 12 meses).
  y = ensureSpace(doc, y, 58);
  y = drawMonthlyColumns(doc, 'Evolución mensual (últimos 12 meses)', model.monthRows, MARGIN, y, CONTENT_W, 36);

  // Seguimiento de abiertos antiguos.
  y = drawOldestOpen(doc, model.summary.oldestOpen, y, model);
  return y;
}

export function buildPdfReport(data = {}) {
  const generatedAt = data.generatedAt instanceof Date && !Number.isNaN(data.generatedAt.getTime())
    ? data.generatedAt
    : new Date();
  const model = buildReportModel({ ...data, generatedAt });
  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'landscape', compress: true });
  doc.setProperties({
    title: `Reporte de Gestión de Tickets — ${model.meta.entity}`,
    subject: 'Reporte institucional de solicitudes',
    author: model.meta.system,
    creator: 'CRM Transitemos',
    keywords: 'TRANSITEMOS, CRM, tickets, reporte, PDF',
  });
  if (typeof doc.setCreationDate === 'function') doc.setCreationDate(generatedAt);

  if (!model.total) {
    let y = HEADER_H + 16;
    y = sectionTitle(doc, 'Resumen ejecutivo', MARGIN, y);
    y = drawKpis(doc, [
      { label: 'Total de tickets', value: '0', hint: 'Registros incluidos', color: BRAND },
      { label: 'Tickets abiertos', value: '0', hint: 'Pendientes de cierre', color: CHART_INK.brand },
      { label: 'Resueltos / cerrados', value: '0', hint: 'Atención finalizada', color: '#1baf7a' },
      { label: 'Tiempo promedio', value: '—', hint: 'Horas de resolución', color: SERIES_COLOR },
    ], y + 3);
    drawEmptyState(doc, y + 2, model.total);
  } else {
    const summaryEnd = drawSummary(doc, model);
    drawDetail(doc, model.tickets, model, summaryEnd);
  }

  decoratePages(doc, model, data.logoDataUrl || null);
  return doc;
}

export async function downloadPdfReport(data = {}) {
  const generatedAt = data.generatedAt instanceof Date && !Number.isNaN(data.generatedAt.getTime())
    ? data.generatedAt
    : new Date();
  const logoDataUrl = data.logoDataUrl || await loadImageDataUrl(data.logoUrl);
  const doc = buildPdfReport({ ...data, generatedAt, logoDataUrl });
  const filename = buildReportFilename('pdf', generatedAt);
  doc.save(filename);
  return filename;
}
