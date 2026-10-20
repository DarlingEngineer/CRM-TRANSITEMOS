import ExcelJS from 'exceljs';
import {
  buildReportFilename,
  buildReportModel,
  displayValue,
  downloadBlob,
  formatDateTime,
  parseDate,
} from './reportData';
import {
  PRIORITY_BADGES,
  STATUS_BADGES,
  normalizeStatus,
} from './chartTheme';

// =========================================================
// Exportación XLSX institucional.
// El libro se genera en el navegador y se descarga sin
// intervención del backend.
// =========================================================

const COLORS = {
  brand: '0B4F78',
  brandDark: '083A58',
  blue: '2A78D6',
  ink: '1E293B',
  muted: '64748B',
  line: 'D9E2EC',
  soft: 'F4F8FC',
  rowAlt: 'F8FAFC',
  white: 'FFFFFF',
};

const FONT_NAME = 'Calibri';
const NUM_FMT_INTEGER = '#,##0';
const NUM_FMT_PERCENT = '0.0%';
const NUM_FMT_DATE = 'dd/mm/yyyy hh:mm';
const NUM_FMT_HOURS = '0.0 "h"';

const argb = (hex) => `FF${hex.replace('#', '').toUpperCase()}`;
const solidFill = (hex) => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: argb(hex) },
});

const thinBorder = {
  style: 'thin',
  color: { argb: argb(COLORS.line) },
};

const allBorders = {
  top: thinBorder,
  left: thinBorder,
  bottom: thinBorder,
  right: thinBorder,
};

function font(size = 10, bold = false, color = COLORS.ink, italic = false) {
  return {
    name: FONT_NAME,
    size,
    bold,
    italic,
    color: { argb: argb(color) },
  };
}

function alignment(horizontal = 'left', vertical = 'middle', wrapText = false) {
  return { horizontal, vertical, wrapText };
}

function applyFill(ws, top, left, bottom, right, hex) {
  for (let row = top; row <= bottom; row += 1) {
    for (let col = left; col <= right; col += 1) {
      ws.getCell(row, col).fill = solidFill(hex);
    }
  }
}

function applyBorders(ws, top, left, bottom, right) {
  for (let row = top; row <= bottom; row += 1) {
    for (let col = left; col <= right; col += 1) {
      ws.getCell(row, col).border = allBorders;
    }
  }
}

function mergeAndStyle(ws, top, left, bottom, right, value, style = {}, fillColor = null) {
  ws.mergeCells(top, left, bottom, right);
  const cell = ws.getCell(top, left);
  cell.value = value;
  if (style.font) cell.font = style.font;
  if (style.alignment) cell.alignment = style.alignment;
  if (style.numFmt) cell.numFmt = style.numFmt;
  if (style.border) cell.border = style.border;
  if (fillColor) applyFill(ws, top, left, bottom, right, fillColor);
  if (style.border) applyBorders(ws, top, left, bottom, right);
  return cell;
}

function writeInstitutionalHeader(ws, model, lastCol, title) {
  mergeAndStyle(
    ws,
    1,
    1,
    1,
    lastCol,
    'TRANSITEMOS',
    {
      font: font(20, true, COLORS.white),
      alignment: alignment('left', 'middle'),
    },
    COLORS.brand,
  );
  ws.getRow(1).height = 30;

  // La segunda fila combina identidad a la izquierda y fecha a la derecha.
  applyFill(ws, 2, 1, 2, lastCol, COLORS.brand);
  const split = Math.max(2, Math.ceil(lastCol / 2));
  mergeAndStyle(
    ws,
    2,
    1,
    2,
    split,
    'CRM de Gestión de Solicitudes',
    {
      font: font(9, false, COLORS.white),
      alignment: alignment('left', 'middle'),
    },
  );
  mergeAndStyle(
    ws,
    2,
    split + 1,
    2,
    lastCol,
    `Generado: ${formatDateTime(model.generatedAt)}`,
    {
      font: font(9, false, COLORS.white),
      alignment: alignment('right', 'middle'),
    },
  );
  ws.getRow(2).height = 18;

  mergeAndStyle(
    ws,
    3,
    1,
    3,
    lastCol,
    title,
    {
      font: font(12, true, COLORS.white),
      alignment: alignment('left', 'middle'),
    },
    COLORS.brand,
  );
  ws.getRow(3).height = 22;

  const scopeRow = 4;
  mergeAndStyle(
    ws,
    scopeRow,
    1,
    scopeRow,
    lastCol,
    model.scopeNote,
    {
      font: font(8.5, false, COLORS.white),
      alignment: alignment('left', 'middle'),
    },
    COLORS.brandDark,
  );
  ws.getRow(scopeRow).height = 19;

  applyFill(ws, 5, 1, 5, lastCol, COLORS.blue);
  ws.getRow(5).height = 3;

  return 6;
}

function startPageSetup(ws, { orientation = 'portrait', printArea, printTitlesRow } = {}) {
  ws.views = [{ showGridLines: false }];
  ws.pageSetup.paperSize = 9;
  ws.pageSetup.orientation = orientation;
  ws.pageSetup.fitToPage = true;
  ws.pageSetup.fitToWidth = 1;
  ws.pageSetup.fitToHeight = 0;
  ws.pageSetup.horizontalCentered = true;
  ws.pageSetup.printGridLines = false;
  ws.pageSetup.margins = {
    left: 0.35,
    right: 0.35,
    top: 0.55,
    bottom: 0.55,
    header: 0.2,
    footer: 0.2,
  };
  if (printArea) ws.pageSetup.printArea = printArea;
  if (printTitlesRow) ws.pageSetup.printTitlesRow = printTitlesRow;
  ws.headerFooter.oddHeader = '';
  ws.headerFooter.oddFooter = '&LCRM Transitemos&CReporte de Gestión de Tickets&RPágina &P de &N';
}

function addKpi(ws, top, left, right, value, label, hint, color, isNumeric = true) {
  const bottom = top + 2;
  const valueCell = mergeAndStyle(
    ws,
    top,
    left,
    bottom - 2,
    right,
    value,
    {
      font: font(isNumeric ? 20 : 17, true, COLORS.brandDark),
      alignment: alignment('center', 'middle'),
    },
    COLORS.soft,
  );
  if (isNumeric) valueCell.numFmt = NUM_FMT_INTEGER;

  mergeAndStyle(
    ws,
    top + 1,
    left,
    top + 1,
    right,
    label,
    {
      font: font(8, true, COLORS.muted),
      alignment: alignment('center', 'middle'),
    },
    COLORS.soft,
  );

  mergeAndStyle(
    ws,
    top + 2,
    left,
    top + 2,
    right,
    hint,
    {
      font: font(8, false, COLORS.muted, true),
      alignment: alignment('center', 'middle'),
    },
    COLORS.soft,
  );

  applyBorders(ws, top, left, bottom, right);
  for (let col = left; col <= right; col += 1) {
    ws.getCell(top, col).border = {
      ...allBorders,
      top: { style: 'medium', color: { argb: argb(color) } },
    };
  }
  ws.getRow(top).height = 24;
  ws.getRow(top + 1).height = 16;
  ws.getRow(top + 2).height = 16;
}

function tableHeader(ws, row, startCol, headers) {
  headers.forEach((header, index) => {
    const cell = ws.getCell(row, startCol + index);
    cell.value = header;
    cell.font = font(8.5, true, COLORS.white);
    cell.fill = solidFill(COLORS.brand);
    cell.alignment = alignment('center', 'middle', true);
    cell.border = allBorders;
  });
  ws.getRow(row).height = 22;
}

function tableRow(ws, row, startCol, values, options = {}) {
  const { pctIndex = -1, moneyIndex = -1 } = options;
  values.forEach((value, index) => {
    const cell = ws.getCell(row, startCol + index);
    cell.value = value;
    cell.font = font(8.5, false, COLORS.ink);
    cell.alignment = alignment(index === 0 ? 'left' : 'center', 'middle', true);
    cell.border = allBorders;
    if (index === pctIndex) cell.numFmt = NUM_FMT_PERCENT;
    if (index === moneyIndex) cell.numFmt = NUM_FMT_INTEGER;
    if (row % 2 === 0) cell.fill = solidFill(COLORS.rowAlt);
  });
}

function tableEmpty(ws, row, startCol, endCol, text = 'Sin datos disponibles.') {
  mergeAndStyle(
    ws,
    row,
    startCol,
    row,
    endCol,
    text,
    {
      font: font(8.5, false, COLORS.muted, true),
      alignment: alignment('center', 'middle'),
    },
    COLORS.white,
  );
  applyBorders(ws, row, startCol, row, endCol);
  ws.getRow(row).height = 24;
}

function buildSummarySheet(workbook, model) {
  const ws = workbook.addWorksheet('Resumen ejecutivo');
  ws.properties.tabColor = { argb: argb(COLORS.brand) };
  ws.columns = [
    { width: 27 },
    { width: 13 },
    { width: 15 },
    { width: 3 },
    { width: 27 },
    { width: 13 },
    { width: 15 },
  ];

  let row = writeInstitutionalHeader(ws, model, 7, 'REPORTE DE GESTIÓN DE TICKETS');

  mergeAndStyle(
    ws,
    row,
    1,
    row,
    7,
    'Resumen ejecutivo',
    {
      font: font(16, true, COLORS.brand),
      alignment: alignment('left', 'middle'),
    },
  );
  ws.getRow(row).height = 28;
  row += 1;

  const periodText = model.period
    ? `Periodo de los datos: ${formatDateTime(model.period.from)} — ${formatDateTime(model.period.to)}`
    : 'Periodo de los datos: sin fechas válidas.';
  mergeAndStyle(
    ws,
    row,
    1,
    row,
    7,
    `${periodText} · ${formatDateTime(model.generatedAt)}`,
    {
      font: font(8.5, false, COLORS.muted),
      alignment: alignment('left', 'middle'),
    },
  );
  ws.getRow(row).height = 18;
  row += 2;

  addKpi(ws, row, 1, 3, model.total, 'TOTAL DE TICKETS', 'Registros incluidos', COLORS.brand);
  addKpi(
    ws,
    row,
    5,
    7,
    model.avgHours != null ? Number(model.avgHours) : '—',
    'TIEMPO PROMEDIO',
    'Horas de resolución o cierre',
    COLORS.blue,
    model.avgHours != null,
  );
  if (model.avgHours != null) ws.getCell(row, 5).numFmt = NUM_FMT_HOURS;
  row += 4;

  addKpi(ws, row, 1, 3, model.openCount, 'TICKETS ABIERTOS', 'Pendientes de cierre', COLORS.brand);
  addKpi(
    ws,
    row,
    5,
    7,
    model.resolvedCount,
    'RESUELTOS / CERRADOS',
    'Con atención finalizada',
    COLORS.blue,
  );
  row += 4;

  mergeAndStyle(ws, row, 1, row, 3, 'Distribución por estado', {
    font: font(11, true, COLORS.brand),
    alignment: alignment('left', 'middle'),
  });
  mergeAndStyle(ws, row, 5, row, 7, 'Distribución por prioridad', {
    font: font(11, true, COLORS.brand),
    alignment: alignment('left', 'middle'),
  });
  ws.getRow(row).height = 22;
  row += 1;

  tableHeader(ws, row, 1, ['Estado', 'Total', 'Participación']);
  tableHeader(ws, row, 5, ['Prioridad', 'Total', 'Participación']);
  row += 1;

  const distributionRows = Math.max(model.statusRows.length, model.priorityRows.length);
  for (let index = 0; index < distributionRows; index += 1) {
    const status = model.statusRows[index];
    const priority = model.priorityRows[index];
    if (status) {
      tableRow(ws, row, 1, [status.name, status.total, status.pct], { pctIndex: 2 });
      const badge = STATUS_BADGES[normalizeStatus(status.name)];
      if (badge) {
        const cell = ws.getCell(row, 1);
        cell.fill = solidFill(badge.bg);
        cell.font = font(8.5, true, badge.text);
      }
    }
    if (priority) {
      tableRow(ws, row, 5, [priority.name, priority.total, priority.pct], { pctIndex: 2 });
      const badge = PRIORITY_BADGES[priority.name];
      if (badge) {
        const cell = ws.getCell(row, 5);
        cell.fill = solidFill(badge.bg);
        cell.font = font(8.5, true, badge.text);
      }
    }
    ws.getRow(row).height = 19;
    row += 1;
  }
  row += 1;

  mergeAndStyle(ws, row, 1, row, 3, 'Tickets por área', {
    font: font(11, true, COLORS.brand),
    alignment: alignment('left', 'middle'),
  });
  mergeAndStyle(ws, row, 5, row, 7, 'Evolución mensual', {
    font: font(11, true, COLORS.brand),
    alignment: alignment('left', 'middle'),
  });
  ws.getRow(row).height = 22;
  row += 1;

  tableHeader(ws, row, 1, ['Área', 'Tickets', 'Participación']);
  tableHeader(ws, row, 5, ['Mes', 'Tickets', 'Acumulado']);
  row += 1;

  const detailRows = Math.max(model.areaRows.length, model.monthRows.length);
  if (detailRows === 0) {
    tableEmpty(ws, row, 1, 3);
    tableEmpty(ws, row, 5, 7);
  } else {
    for (let index = 0; index < detailRows; index += 1) {
      const area = model.areaRows[index];
      const month = model.monthRows[index];
      if (area) {
        tableRow(ws, row, 1, [area.area, area.total, area.pct], { pctIndex: 2 });
      }
      if (month) {
        tableRow(ws, row, 5, [month.longLabel, month.total, month.cumulative], { moneyIndex: 1 });
        ws.getCell(row, 7).numFmt = NUM_FMT_INTEGER;
      }
      const areaLines = area ? estimateLines(area.area, 27) : 1;
      ws.getRow(row).height = Math.max(19, areaLines * 12 + 4);
      row += 1;
    }
  }

  row += 2;
  mergeAndStyle(
    ws,
    row,
    1,
    row,
    7,
    `Fuente: ${model.meta.system} · ${model.meta.subtitle} · Generado el ${formatDateTime(model.generatedAt)}.`,
    {
      font: font(8, false, COLORS.muted, true),
      alignment: alignment('left', 'middle'),
    },
  );

  startPageSetup(ws, {
    orientation: 'portrait',
    printArea: `A1:G${row}`,
  });

  return ws;
}

function estimateLines(text, width) {
  const raw = String(text ?? '');
  if (!raw) return 1;
  return raw.split(/\r?\n/).reduce((total, line) => total + Math.max(1, Math.ceil(line.length / Math.max(width, 1))), 0);
}

function rowHeightForTicket(ticket) {
  const lines = Math.max(
    estimateLines(ticket.title, 46),
    estimateLines(ticket.area, 30),
    estimateLines(ticket.body, 72),
    estimateLines(ticket.updated_by, 24),
  );
  return Math.min(409, Math.max(19, lines * 12 + 4));
}

// ExcelJS serializa las fechas con sus componentes UTC. Se trasladan
// los componentes locales para que Excel muestre la misma hora que el PDF.
function toExcelDate(value) {
  const date = parseDate(value);
  if (!date) return null;
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ));
}

function writeTicketSheet(workbook, model, { name, title, tickets, includeDescription = true }) {
  const ws = workbook.addWorksheet(name);
  ws.properties.tabColor = { argb: argb(includeDescription ? COLORS.blue : COLORS.brand) };
  ws.columns = includeDescription
    ? [
        { width: 8 },
        { width: 46 },
        { width: 15 },
        { width: 16 },
        { width: 30 },
        { width: 70 },
        { width: 24 },
        { width: 20 },
        { width: 20 },
      ]
    : [
        { width: 8 },
        { width: 48 },
        { width: 15 },
        { width: 16 },
        { width: 30 },
        { width: 20 },
        { width: 16 },
      ];

  const lastCol = includeDescription ? 9 : 7;
  let row = writeInstitutionalHeader(ws, model, lastCol, title);
  const headerRow = row;

  const headers = includeDescription
    ? ['ID', 'Título', 'Prioridad', 'Estado', 'Área', 'Descripción', 'Actualizado por', 'Creado', 'Actualizado']
    : ['ID', 'Título', 'Prioridad', 'Estado', 'Área', 'Creado', 'Días desde creación'];
  tableHeader(ws, headerRow, 1, headers);

  const lastRow = headerRow + tickets.length;
  if (!tickets.length) {
    tableEmpty(ws, headerRow + 1, 1, lastCol, 'No hay registros para los criterios del reporte.');
    ws.pageSetup.printArea = `A1:${String.fromCharCode(64 + lastCol)}${headerRow + 1}`;
  } else {
    tickets.forEach((ticket, index) => {
      const current = headerRow + 1 + index;
      const created = parseDate(ticket.created_at);
      const excelCreated = toExcelDate(ticket.created_at);
      const excelUpdated = toExcelDate(ticket.updated_at);
      const status = normalizeStatus(displayValue(ticket.status));
      const priority = displayValue(ticket.priority);

      if (includeDescription) {
        tableRow(ws, current, 1, [
          ticket.id,
          displayValue(ticket.title),
          priority,
          status,
          displayValue(ticket.area),
          displayValue(ticket.body),
          displayValue(ticket.updated_by),
          excelCreated || '—',
          excelUpdated || '—',
        ]);
        [8, 9].forEach((col) => {
          const cell = ws.getCell(current, col);
          if (cell.value instanceof Date) cell.numFmt = NUM_FMT_DATE;
        });
      } else {
        const days = created
          ? Math.max(0, Math.floor((model.generatedAt.getTime() - created.getTime()) / 86400000))
          : '—';
        tableRow(ws, current, 1, [
          ticket.id,
          displayValue(ticket.title),
          priority,
          status,
          displayValue(ticket.area),
          excelCreated || '—',
          days,
        ]);
        const dateCell = ws.getCell(current, 6);
        if (dateCell.value instanceof Date) dateCell.numFmt = NUM_FMT_DATE;
        if (Number.isFinite(days)) ws.getCell(current, 7).numFmt = NUM_FMT_INTEGER;
      }

      const statusBadge = STATUS_BADGES[status];
      if (statusBadge) {
        const cell = ws.getCell(current, 4);
        cell.fill = solidFill(statusBadge.bg);
        cell.font = font(8.5, true, statusBadge.text);
      }
      const priorityBadge = PRIORITY_BADGES[priority];
      if (priorityBadge) {
        const cell = ws.getCell(current, 3);
        cell.fill = solidFill(priorityBadge.bg);
        cell.font = font(8.5, true, priorityBadge.text);
      }

      ws.getRow(current).height = includeDescription ? rowHeightForTicket(ticket) : 26;
    });

    ws.autoFilter = {
      from: { row: headerRow, column: 1 },
      to: { row: lastRow, column: lastCol },
    };
    ws.views = [{ state: 'frozen', ySplit: headerRow, showGridLines: false }];
    ws.pageSetup.printTitlesRow = `${headerRow}:${headerRow}`;
    ws.pageSetup.printArea = `A1:${String.fromCharCode(64 + lastCol)}${lastRow}`;
  }

  startPageSetup(ws, {
    orientation: 'landscape',
    printArea: ws.pageSetup.printArea,
    printTitlesRow: ws.pageSetup.printTitlesRow,
  });
  if (tickets.length) {
    ws.views = [{ state: 'frozen', ySplit: headerRow, showGridLines: false }];
    ws.autoFilter = {
      from: { row: headerRow, column: 1 },
      to: { row: lastRow, column: lastCol },
    };
  }

  return ws;
}

export async function buildExcelWorkbook(data = {}) {
  const generatedAt = data.generatedAt instanceof Date && !Number.isNaN(data.generatedAt.getTime())
    ? data.generatedAt
    : new Date();
  const model = buildReportModel({ ...data, generatedAt });
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CRM Transitemos';
  workbook.lastModifiedBy = 'CRM Transitemos';
  workbook.created = generatedAt;
  workbook.modified = generatedAt;
  workbook.company = 'TRANSITEMOS';
  workbook.subject = 'Reporte de Gestión de Tickets';
  workbook.title = 'Reporte de Gestión de Tickets — TRANSITEMOS';
  workbook.description = model.scopeNote;
  workbook.keywords = 'TRANSITEMOS, CRM, tickets, reporte';

  buildSummarySheet(workbook, model);

  const openTickets = model.tickets
    .filter((ticket) => !['Resuelto', 'Cerrado'].includes(normalizeStatus(ticket.status)))
    .sort((a, b) => {
      const dateA = parseDate(a.created_at)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const dateB = parseDate(b.created_at)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });

  writeTicketSheet(workbook, model, {
    name: 'Detalle de tickets',
    title: 'DETALLE DE TICKETS',
    tickets: model.tickets,
    includeDescription: true,
  });

  writeTicketSheet(workbook, model, {
    name: 'Tickets abiertos',
    title: 'TICKETS ABIERTOS POR ANTIGÜEDAD',
    tickets: openTickets,
    includeDescription: false,
  });

  return { workbook, model };
}

export async function buildExcelBuffer(data = {}) {
  const { workbook, model } = await buildExcelWorkbook(data);
  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, model };
}

export async function downloadExcelReport(data = {}) {
  const { buffer, model } = await buildExcelBuffer(data);
  const filename = buildReportFilename('xlsx', model.generatedAt);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  return downloadBlob(filename, blob);
}
