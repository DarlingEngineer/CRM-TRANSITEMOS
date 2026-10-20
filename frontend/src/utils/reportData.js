import {
  PRIORITY_ORDER,
  STATUS_ORDER,
  normalizeStatus,
} from './chartTheme';

// =========================================================
// Modelo y formatos compartidos por todas las exportaciones.
// Una sola fuente de verdad evita que Excel, PDF y CSV
// muestren cifras o textos diferentes.
// =========================================================

export const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export const RESOLVED_STATUSES = new Set(['Resuelto', 'Cerrado']);

export const REPORT_META = {
  system: 'CRM TRANSITEMOS',
  entity: 'TRANSITEMOS',
  title: 'Reporte de Gestión de Tickets',
  subtitle: 'Sistema de Gestión de Solicitudes',
  filenameBase: 'reporte_tickets_TRANSITEMOS',
};

const dateTimeFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const numberFormatter = new Intl.NumberFormat('es-CO');
const decimalFormatter = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const percentFormatter = new Intl.NumberFormat('es-CO', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value) {
  const date = parseDate(value);
  return date ? dateTimeFormatter.format(date) : '—';
}

export function formatDate(value) {
  const date = parseDate(value);
  return date ? dateFormatter.format(date) : '—';
}

export function formatNumber(value, fallback = '—') {
  const number = Number(value);
  return Number.isFinite(number) ? numberFormatter.format(number) : fallback;
}

export function formatDecimal(value, fallback = '—') {
  const number = Number(value);
  return Number.isFinite(number) ? decimalFormatter.format(number) : fallback;
}

export function formatPercent(value, fallback = '—') {
  const number = Number(value);
  return Number.isFinite(number) ? percentFormatter.format(number) : fallback;
}

export function formatHours(value, fallback = '—') {
  const number = Number(value);
  return Number.isFinite(number) ? `${decimalFormatter.format(number)} h` : fallback;
}

export function displayValue(value, fallback = '—') {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

export function buildReportFilename(extension, date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `_${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `${REPORT_META.filenameBase}_${stamp}.${extension}`;
}

export function downloadBlob(filename, blob) {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return filename;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

export async function loadImageDataUrl(url) {
  if (!url || typeof fetch !== 'function' || typeof FileReader === 'undefined') return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function ticketKey(ticket, index) {
  if (ticket == null || typeof ticket !== 'object') return `row-${index}`;
  if (ticket.id != null) return `id-${ticket.id}`;
  return `${ticket.title || ''}|${ticket.created_at || ''}|${index}`;
}

function dedupeTickets(tickets) {
  const seen = new Set();
  const result = [];
  tickets.forEach((ticket, index) => {
    if (ticket == null || typeof ticket !== 'object') return;
    const key = ticketKey(ticket, index);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(ticket);
  });
  return result;
}

export function summarizeTickets(tickets = []) {
  const list = Array.isArray(tickets) ? dedupeTickets(tickets) : [];
  const byStatus = {};
  const byPriority = {};
  const byArea = {};
  let hoursSum = 0;
  let resolvedCount = 0;

  list.forEach((ticket) => {
    const status = normalizeStatus(ticket.status) || 'Sin estado';
    const priority = displayValue(ticket.priority, 'Sin prioridad');
    const area = displayValue(ticket.area, 'Sin área');

    byStatus[status] = (byStatus[status] || 0) + 1;
    byPriority[priority] = (byPriority[priority] || 0) + 1;
    byArea[area] = (byArea[area] || 0) + 1;

    if (RESOLVED_STATUSES.has(status)) {
      const created = parseDate(ticket.created_at);
      const updated = parseDate(ticket.updated_at);
      const hours = created && updated ? (updated.getTime() - created.getTime()) / 3600000 : NaN;
      if (Number.isFinite(hours) && hours >= 0) {
        hoursSum += hours;
        resolvedCount += 1;
      }
    }
  });

  const openTickets = list.filter((ticket) => !RESOLVED_STATUSES.has(normalizeStatus(ticket.status)));
  const oldestOpen = [...openTickets]
    .sort((a, b) => {
      const dateA = parseDate(a.created_at)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const dateB = parseDate(b.created_at)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    })
    .slice(0, 8);

  const createdDates = list
    .map((ticket) => parseDate(ticket.created_at))
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    total: list.length,
    byStatus,
    byPriority,
    byArea,
    openCount: openTickets.length,
    resolvedCount,
    avgHours: resolvedCount ? hoursSum / resolvedCount : null,
    oldestOpen,
    period: createdDates.length
      ? { from: createdDates[0], to: createdDates[createdDates.length - 1] }
      : null,
  };
}

function sortTickets(tickets) {
  return [...tickets].sort((a, b) => {
    const idA = Number(a.id);
    const idB = Number(b.id);
    if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) return idB - idA;
    const dateA = parseDate(a.created_at)?.getTime() ?? 0;
    const dateB = parseDate(b.created_at)?.getTime() ?? 0;
    return dateB - dateA;
  });
}

function uniqueAreaRows(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const area = displayValue(row?.area, 'Sin área');
    const total = Number(row?.total);
    if (!Number.isFinite(total)) return;
    map.set(area, (map.get(area) || 0) + total);
  });
  return [...map.entries()]
    .map(([area, total]) => ({ area, total }))
    .sort((a, b) => b.total - a.total || a.area.localeCompare(b.area, 'es'));
}

function uniqueMonthRows(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const year = Number(row?.year);
    const month = Number(row?.month);
    const total = Number(row?.total);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return;
    if (!Number.isFinite(total)) return;
    const key = `${year}-${month}`;
    map.set(key, { year, month, total: (map.get(key)?.total || 0) + total });
  });
  return [...map.values()].sort((a, b) => a.year - b.year || a.month - b.month);
}

export function buildReportModel(data = {}) {
  const tickets = sortTickets(dedupeTickets(Array.isArray(data.tickets) ? data.tickets : []));
  const summary = summarizeTickets(tickets);
  const generatedAt = data.generatedAt instanceof Date && !Number.isNaN(data.generatedAt.getTime())
    ? data.generatedAt
    : new Date();

  const distributionRows = (order, counts) => {
    const known = order.map((name) => ({
      name,
      total: Number(counts[name] || 0),
      pct: summary.total ? Number(counts[name] || 0) / summary.total : 0,
    }));
    const extras = Object.keys(counts)
      .filter((name) => !order.includes(name))
      .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b, 'es'))
      .map((name) => ({
        name,
        total: Number(counts[name] || 0),
        pct: summary.total ? Number(counts[name] || 0) / summary.total : 0,
      }));
    return [...known, ...extras];
  };

  const statusRows = distributionRows(STATUS_ORDER, summary.byStatus);
  const priorityRows = distributionRows(PRIORITY_ORDER, summary.byPriority);

  const areaSource = Array.isArray(data.porArea) && data.porArea.length
    ? data.porArea
    : Object.entries(summary.byArea).map(([area, total]) => ({ area, total }));
  const areaBase = uniqueAreaRows(areaSource);
  const areaTotal = areaBase.reduce((total, row) => total + row.total, 0);
  const areaRows = areaBase.map((row) => ({
    ...row,
    pct: areaTotal ? row.total / areaTotal : 0,
  }));

  const monthRows = uniqueMonthRows(Array.isArray(data.porMes) ? data.porMes : []).map((row) => ({
    ...row,
    label: `${MESES_CORTOS[row.month - 1]} ${row.year}`,
    longLabel: `${MESES_LARGOS[row.month - 1]} ${row.year}`,
  }));
  const monthTotal = monthRows.reduce((total, row) => total + row.total, 0);
  let cumulative = 0;
  const monthSeries = monthRows.map((row) => {
    cumulative += row.total;
    return { ...row, cumulative };
  });

  const metricAvg = Number(data.tiempo?.average_hours);
  const metricResolved = Number(data.tiempo?.resolved_tickets_count);
  const avgHours = Number.isFinite(metricAvg) ? metricAvg : summary.avgHours;
  const resolvedCount = Number.isFinite(metricResolved) ? metricResolved : summary.resolvedCount;

  const scopeNote = displayValue(
    data.scopeNote,
    tickets.length
      ? `Se incluyen ${formatNumber(summary.total)} ticket(s) disponibles en el sistema.`
      : 'No hay tickets para incluir en el reporte.',
  );

  return {
    meta: REPORT_META,
    generatedAt,
    tickets,
    summary,
    statusRows,
    priorityRows,
    areaRows,
    monthRows: monthSeries,
    areaTotal,
    monthTotal,
    avgHours,
    resolvedCount,
    openCount: summary.openCount,
    total: summary.total,
    period: summary.period,
    scopeNote,
  };
}
