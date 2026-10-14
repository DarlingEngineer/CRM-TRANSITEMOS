import { STATUS_ORDER, PRIORITY_ORDER } from './chartTheme';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const RESOLVED = new Set(['Resuelto', 'Cerrado']);

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function summarizeTickets(tickets = []) {
  const list = Array.isArray(tickets) ? tickets : [];
  const byStatus = {};
  const byPriority = {};
  const byArea = {};
  let hoursSum = 0;
  let resolvedCount = 0;

  list.forEach((t) => {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    byArea[t.area] = (byArea[t.area] || 0) + 1;
    if (RESOLVED.has(t.status)) {
      const h = (new Date(t.updated_at) - new Date(t.created_at)) / 3600000;
      if (Number.isFinite(h) && h >= 0) { hoursSum += h; resolvedCount += 1; }
    }
  });

  const openCount = list.filter((t) => !RESOLVED.has(t.status)).length;
  const oldestOpen = list
    .filter((t) => !RESOLVED.has(t.status))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(0, 8);

  return {
    total: list.length,
    byStatus,
    byPriority,
    byArea,
    openCount,
    resolvedCount,
    avgHours: resolvedCount ? hoursSum / resolvedCount : null,
    oldestOpen,
  };
}

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRows(rows) {
  return rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
}

export function buildDetailedCsv(data) {
  const { tickets = [], porMes = [], porArea = [], porPrioridad = [] } = data || {};
  const s = summarizeTickets(tickets);
  const lines = [];

  lines.push('REPORTE DE TICKETS — TRANSITEMOS');
  lines.push(csvRows([['Generado', formatDateTime(new Date().toISOString())]]));
  lines.push('');

  lines.push('RESUMEN GENERAL');
  lines.push(csvRows([
    ['Indicador', 'Valor'],
    ['Total de tickets', s.total],
    ['Tickets abiertos', s.openCount],
    ['Tickets resueltos/cerrados', s.resolvedCount],
    ['Tiempo promedio de resolución (horas)', s.avgHours != null ? s.avgHours.toFixed(2) : 'N/A'],
  ]));
  lines.push('');

  lines.push('TICKETS POR ESTADO');
  lines.push(csvRows([['Estado', 'Total'], ...STATUS_ORDER.map((st) => [st, s.byStatus[st] || 0])]));
  lines.push('');

  lines.push('TICKETS POR PRIORIDAD');
  lines.push(csvRows([
    ['Prioridad', 'Total'],
    ...PRIORITY_ORDER.map((p) => [p, (porPrioridad.find((x) => x.name === p)?.total) ?? (s.byPriority[p] || 0)]),
  ]));
  lines.push('');

  lines.push('TICKETS POR ÁREA');
  lines.push(csvRows([['Área', 'Total'], ...[...porArea].sort((a, b) => b.total - a.total).map((a) => [a.area, a.total])]));
  lines.push('');

  lines.push('EVOLUCIÓN MENSUAL');
  lines.push(csvRows([['Año', 'Mes', 'Total'], ...porMes.map((m) => [m.year, MESES[m.month - 1] || m.month, m.total])]));
  lines.push('');

  if (s.oldestOpen.length) {
    lines.push('TICKETS ABIERTOS MÁS ANTIGUOS');
    lines.push(csvRows([
      ['ID', 'Título', 'Prioridad', 'Estado', 'Área', 'Creado'],
      ...s.oldestOpen.map((t) => [t.id, t.title, t.priority, t.status, t.area, formatDateTime(t.created_at)]),
    ]));
    lines.push('');
  }

  lines.push('DETALLE DE TICKETS');
  lines.push(csvRows([
    ['ID', 'Título', 'Prioridad', 'Estado', 'Área', 'Descripción', 'Actualizado por', 'Creado', 'Actualizado'],
    ...[...tickets].sort((a, b) => b.id - a.id).map((t) => [
      t.id, t.title, t.priority, t.status, t.area, t.body || '', t.updated_by || '', formatDateTime(t.created_at), formatDateTime(t.updated_at),
    ]),
  ]));

  return lines.join('\r\n');
}

export function downloadCsv(filename, content) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
