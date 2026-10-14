const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const STATUS_ORDER = ['Abierto', 'En proceso', 'Resuelto', 'Cerrado'];
const PRIORITY_ORDER = ['Urgente', 'Alta', 'Media', 'Baja'];
const RESOLVED = new Set(['Resuelto', 'Cerrado']);

const PRIORITY_COLORS = { Urgente: '#dc2626', Alta: '#ea580c', Media: '#2563eb', Baja: '#16a34a' };
const STATUS_COLORS = { Abierto: '#2563eb', 'En proceso': '#d97706', Resuelto: '#16a34a', Cerrado: '#64748b' };
const AREA_PALETTE = ['#0b4f78', '#1d78c8', '#38bdf8', '#0ea5e9', '#7dd3fc', '#a5d8ff', '#bae6fd', '#e0f2fe'];

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

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function table(headers, rows) {
  const head = headers.map((h) => `<th>${esc(h)}</th>`).join('');
  const body = rows.length
    ? rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${headers.length}" class="empty">Sin datos</td></tr>`;
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function barRows(items, colorFn) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return items.map((i) => `
    <div class="bar-row">
      <span class="bar-label">${esc(i.label)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${(i.value / max) * 100}%;background:${colorFn ? colorFn(i) : '#2563eb'}"></span></span>
      <span class="bar-value">${esc(i.value)}</span>
    </div>`).join('');
}

export function buildReportHtml(data) {
  const { tickets = [], porMes = [], porArea = [], porPrioridad = [], tiempo } = data || {};
  const s = summarizeTickets(tickets);
  const generated = formatDateTime(new Date().toISOString());
  const avg = tiempo?.average_hours ?? s.avgHours;

  const areaItems = [...porArea].sort((a, b) => b.total - a.total)
    .map((a, idx) => ({ label: a.area, value: a.total, color: AREA_PALETTE[idx % AREA_PALETTE.length] }));

  const kpis = [
    { label: 'Total de tickets', value: s.total, color: '#2563eb' },
    { label: 'Abiertos', value: s.openCount, color: '#0ea5e9' },
    { label: 'Resueltos / cerrados', value: s.resolvedCount, color: '#16a34a' },
    { label: 'Promedio resolución', value: avg != null ? `${Number(avg).toFixed(1)} h` : 'N/A', color: '#d97706' },
  ];

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Reporte de Tickets — TRANSITEMOS</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; background: #f1f5f9; }
  .page { max-width: 960px; margin: 0 auto; padding: 32px; background: #fff; }
  header { border-radius: 12px; padding: 24px 28px; color: #fff; background: linear-gradient(120deg, #0b4f78, #2563eb 60%, #38bdf8); }
  header h1 { margin: 0; font-size: 1.5rem; letter-spacing: .2px; }
  header p { margin: 4px 0 0; opacity: .9; font-size: .85rem; }
  .meta { margin-top: 10px; font-size: .78rem; opacity: .85; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 24px 0; }
  .kpi { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; background: #f8fafc; }
  .kpi .value { font-size: 1.5rem; font-weight: 800; }
  .kpi .label { font-size: .74rem; color: #64748b; text-transform: uppercase; letter-spacing: .4px; margin-top: 2px; }
  h2 { font-size: 1rem; margin: 26px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; color: #0b4f78; }
  table { width: 100%; border-collapse: collapse; font-size: .8rem; }
  th { background: #0b4f78; color: #fff; text-align: left; padding: 8px 10px; font-weight: 600; }
  td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  td.empty { text-align: center; color: #94a3b8; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .bar-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: .78rem; }
  .bar-label { width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar-track { flex: 1; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden; }
  .bar-fill { display: block; height: 100%; border-radius: 6px; }
  .bar-value { width: 34px; text-align: right; font-weight: 700; }
  footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: .72rem; text-align: center; }
  .toolbar { position: sticky; top: 0; padding: 10px 32px; background: #0b4f78; text-align: right; }
  .toolbar button { background: #fff; color: #0b4f78; border: 0; padding: 8px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; }
  @media print { .toolbar { display: none; } body { background: #fff; } .page { padding: 0; max-width: none; } }
</style>
</head>
<body>
  <div class="toolbar"><button onclick="window.print()">🖨️ Guardar / Imprimir PDF</button></div>
  <div class="page">
    <header>
      <h1>Reporte de Gestión de Tickets</h1>
      <p>CRM Transitemos · Sistema de soporte interno</p>
      <div class="meta">Generado el ${esc(generated)} · ${s.total} ticket(s) incluido(s)</div>
    </header>

    <div class="kpis">
      ${kpis.map((k) => `<div class="kpi"><div class="value" style="color:${k.color}">${esc(k.value)}</div><div class="label">${esc(k.label)}</div></div>`).join('')}
    </div>

    <div class="grid2">
      <div>
        <h2>Distribución por estado</h2>
        ${barRows(STATUS_ORDER.map((st) => ({ label: st, value: s.byStatus[st] || 0, color: STATUS_COLORS[st] })))}
      </div>
      <div>
        <h2>Distribución por prioridad</h2>
        ${barRows(PRIORITY_ORDER.map((p) => ({ label: p, value: porPrioridad.find((x) => x.name === p)?.total ?? (s.byPriority[p] || 0), color: PRIORITY_COLORS[p] })))}
      </div>
    </div>

    <h2>Tickets por área</h2>
    ${areaItems.length ? barRows(areaItems, (i) => i.color) : '<p class="empty">Sin datos</p>'}

    <h2>Evolución mensual</h2>
    ${table(['Año', 'Mes', 'Total'], porMes.map((m) => [m.year, MESES[m.month - 1] || m.month, m.total]))}

    ${s.oldestOpen.length ? `
    <h2>Tickets abiertos más antiguos</h2>
    ${table(['ID', 'Título', 'Prioridad', 'Estado', 'Área', 'Creado'],
      s.oldestOpen.map((t) => [t.id, t.title, t.priority, t.status, t.area, formatDateTime(t.created_at)]))}` : ''}

    <h2>Detalle de tickets (${tickets.length})</h2>
    ${table(
      ['ID', 'Título', 'Prioridad', 'Estado', 'Área', 'Descripción', 'Actualizado por', 'Creado', 'Actualizado'],
      [...tickets].sort((a, b) => b.id - a.id).map((t) => [
        t.id, t.title, t.priority, t.status, t.area, t.body || '', t.updated_by || '', formatDateTime(t.created_at), formatDateTime(t.updated_at),
      ]),
    )}

    <footer>Documento generado automáticamente por CRM Transitemos.</footer>
  </div>
</body>
</html>`;
}

export function openPrintableReport(data) {
  const win = window.open('', '_blank');
  if (!win) {
    window.alert('Permite las ventanas emergentes para generar el reporte.');
    return;
  }
  win.document.open();
  win.document.write(buildReportHtml(data));
  win.document.close();
  win.focus();
}
