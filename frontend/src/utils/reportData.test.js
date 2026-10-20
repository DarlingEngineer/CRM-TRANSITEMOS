import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import {
  buildReportFilename,
  buildReportModel,
  formatDateTime,
  formatHours,
  formatPercent,
} from './reportData';
import { buildExcelBuffer, buildExcelWorkbook } from './reportExcel';
import { buildPdfReport } from './reportPdf';

const generatedAt = new Date('2026-10-20T14:35:00.000Z');

const tickets = [
  {
    id: 2,
    title: 'Actualización de datos del contribuyente',
    body: 'Se requiere corregir la dirección y el correo electrónico. Información con ñ, á, é, í, ó, ú.',
    priority: 'Media',
    status: 'Resuelto',
    area: 'Atención al Ciudadano',
    updated_by: 'jperez',
    created_at: '2026-10-02T08:00:00.000Z',
    updated_at: '2026-10-02T14:00:00.000Z',
  },
  {
    id: 1,
    title: 'Error al radicar formulario de traspaso',
    body: 'El sistema muestra un error al adjuntar el documento de identidad.',
    priority: 'Urgente',
    status: 'Abierto',
    area: 'Registro Automotor',
    updated_by: null,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 2,
    title: 'Actualización de datos del contribuyente',
    body: 'Duplicado que no debe aparecer dos veces.',
    priority: 'Media',
    status: 'Resuelto',
    area: 'Atención al Ciudadano',
    updated_by: 'jperez',
    created_at: '2026-10-02T08:00:00.000Z',
    updated_at: '2026-10-02T14:00:00.000Z',
  },
];

const reportData = {
  tickets,
  porMes: [
    { year: 2026, month: 9, total: 3 },
    { year: 2026, month: 10, total: 2 },
  ],
  porArea: [
    { area: 'Atención al Ciudadano', total: 1 },
    { area: 'Registro Automotor', total: 1 },
  ],
  porPrioridad: [{ name: 'Urgente', total: 1 }, { name: 'Media', total: 1 }],
  tiempo: { average_hours: 6, resolved_tickets_count: 1 },
  generatedAt,
};

describe('modelo compartido de reportes', () => {
  it('elimina duplicados y calcula totales reales', () => {
    const model = buildReportModel(reportData);
    expect(model.total).toBe(2);
    expect(model.openCount).toBe(1);
    expect(model.resolvedCount).toBe(1);
    expect(model.avgHours).toBe(6);
    expect(model.statusRows.find((row) => row.name === 'Abierto')?.total).toBe(1);
    expect(model.statusRows.find((row) => row.name === 'Resuelto')?.total).toBe(1);
    expect(model.priorityRows.find((row) => row.name === 'Urgente')?.total).toBe(1);
    expect(model.areaRows).toHaveLength(2);
    expect(model.areaRows.reduce((sum, row) => sum + row.total, 0)).toBe(2);
    expect(model.monthRows.at(-1)?.cumulative).toBe(5);
  });

  it('conserva tildes y genera nombres descriptivos', () => {
    const model = buildReportModel(reportData);
    expect(model.tickets[0].title).toContain('Actualización');
    expect(model.areaRows[0].area).toBe('Atención al Ciudadano');
    expect(buildReportFilename('xlsx', generatedAt)).toMatch(
      /^reporte_tickets_TRANSITEMOS_\d{4}-\d{2}-\d{2}_\d{4}\.xlsx$/,
    );
    expect(formatDateTime('2026-10-20T14:35:00.000Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(formatHours(18.4)).toBe('18,4 h');
    expect(formatPercent(0.5)).toContain('50');
  });

});

describe('exportación Excel', () => {
  it('crea resumen, detalle y abiertos con formatos y filtros', async () => {
    const { workbook, model } = await buildExcelWorkbook(reportData);
    expect(model.total).toBe(2);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Resumen ejecutivo',
      'Detalle de tickets',
      'Tickets abiertos',
    ]);

    const summary = workbook.getWorksheet('Resumen ejecutivo');
    expect(summary.getCell('A1').value).toBe('TRANSITEMOS');
    expect(summary.getCell('A4').value).toContain('Se incluyen 2 ticket');
    expect(summary.getCell('A9').value).toBe(2);
    expect(summary.getCell('A9').numFmt).toBe('#,##0');

    const detail = workbook.getWorksheet('Detalle de tickets');
    expect(detail.getCell('A6').value).toBe('ID');
    expect(detail.getCell('A7').value).toBe(2);
    expect(detail.getCell('F7').value).toContain('dirección');
    expect(detail.getCell('H7').value).toBeInstanceOf(Date);
    expect(detail.autoFilter.from.row).toBe(6);
    expect(detail.autoFilter.to.row).toBe(8);
    expect(detail.views[0].state).toBe('frozen');
    expect(detail.pageSetup.orientation).toBe('landscape');
    expect(detail.pageSetup.printTitlesRow).toBe('6:6');

    const open = workbook.getWorksheet('Tickets abiertos');
    expect(open.getCell('A6').value).toBe('ID');
    expect(open.getCell('A7').value).toBe(1);
    expect(open.getCell('D7').value).toBe('Abierto');
    expect(open.getCell('G7').value).toBeTypeOf('number');
  });

  it('produce un archivo xlsx que puede volver a abrirse', async () => {
    const { buffer } = await buildExcelBuffer(reportData);
    expect(buffer.byteLength).toBeGreaterThan(1000);
    const loaded = new ExcelJS.Workbook();
    await loaded.xlsx.load(buffer);
    expect(loaded.worksheets).toHaveLength(3);
    expect(loaded.getWorksheet('Detalle de tickets')?.getCell('A6').value).toBe('ID');
  });
});

describe('exportación PDF', () => {
  it('genera un PDF institucional con resumen y detalle', () => {
    const doc = buildPdfReport(reportData);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    const buffer = doc.output('arraybuffer');
    expect(buffer.byteLength).toBeGreaterThan(2000);
    const header = new TextDecoder().decode(new Uint8Array(buffer).slice(0, 5));
    expect(header).toBe('%PDF-');
  });

  it('genera un PDF con mensaje claro cuando no hay registros', () => {
    const doc = buildPdfReport({ ...reportData, tickets: [], porArea: [], porMes: [], tiempo: null });
    expect(doc.getNumberOfPages()).toBe(1);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(1000);
  });
});
