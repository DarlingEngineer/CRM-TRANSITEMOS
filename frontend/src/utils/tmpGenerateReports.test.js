import fs from 'node:fs';
import { it } from 'vitest';
import { buildExcelWorkbook } from './reportExcel';
import { buildPdfReport } from './reportPdf';

const out = 'C:/Users/SISTEMAS/AppData/Local/Temp/opencode';
const statuses = ['Abierto', 'En proceso', 'Resuelto', 'Cerrado'];
const priorities = ['Baja', 'Media', 'Alta', 'Urgente'];
const areas = [
  'REGISTRO AUTOMOTOR',
  'ATENCIÓN AL CIUDADANO',
  'SISTEMAS',
  'TESORERÍA',
  'SECRETARÍA GENERAL',
];

const tickets = Array.from({ length: 130 }, (_, index) => {
  const status = statuses[index % statuses.length];
  const priority = priorities[(index * 3) % priorities.length];
  const area = areas[index % areas.length];
  const created = new Date(Date.UTC(2025, index % 12, (index % 27) + 1, 8 + (index % 8), 15));
  const updated = new Date(created.getTime() + (status === 'Abierto' ? 0 : (index + 1) * 3600000));
  const longText = index % 9 === 0
    ? 'Descripción extensa con tildes: atención, gestión, trámite, vehículo, ciudadanía. '.repeat(6)
    : `Solicitud de prueba ${index + 1} con información en español: ñ, á, é, í, ó, ú. Se requiere revisar el trámite y dar respuesta oportuna.`;
  return {
    id: index + 1,
    title: index % 7 === 0 ? `Actualización de datos del contribuyente y del vehículo ${index + 1}` : `Solicitud de gestión ${index + 1}`,
    body: longText,
    priority,
    status,
    area,
    user_id: (index % 4) + 1,
    updated_by: status === 'Abierto' ? null : 'jperez',
    created_at: created.toISOString(),
    updated_at: updated.toISOString(),
  };
});

const porMes = Array.from({ length: 12 }, (_, index) => ({
  year: 2026,
  month: index + 1,
  total: 5 + ((index * 7) % 19),
}));

const porArea = areas.map((area, index) => ({
  area,
  total: tickets.filter((ticket) => ticket.area === area).length + index,
}));

const data = {
  tickets,
  porMes,
  porArea,
  porPrioridad: [],
  tiempo: { average_hours: 18.4, resolved_tickets_count: 65 },
  generatedAt: new Date('2026-10-20T14:35:00.000Z'),
  scopeNote: `Se incluyen ${tickets.length} tickets disponibles en el sistema. Sin filtros adicionales.`,
};

it('genera archivos temporales para inspección', async () => {
  const { workbook } = await buildExcelWorkbook(data);
  await workbook.xlsx.writeFile(`${out}/reporte-prueba.xlsx`);
  const pdf = buildPdfReport(data);
  fs.writeFileSync(`${out}/reporte-prueba.pdf`, Buffer.from(pdf.output('arraybuffer')));

  const emptyWorkbook = await buildExcelWorkbook({
    tickets: [],
    porMes: [],
    porArea: [],
    porPrioridad: [],
    tiempo: null,
    generatedAt: new Date('2026-10-20T14:35:00.000Z'),
  });
  await emptyWorkbook.workbook.xlsx.writeFile(`${out}/reporte-vacio.xlsx`);
  const emptyPdf = buildPdfReport({
    tickets: [],
    porMes: [],
    porArea: [],
    porPrioridad: [],
    tiempo: null,
    generatedAt: new Date('2026-10-20T14:35:00.000Z'),
  });
  fs.writeFileSync(`${out}/reporte-vacio.pdf`, Buffer.from(emptyPdf.output('arraybuffer')));

  console.log(JSON.stringify({
    pdfPages: pdf.getNumberOfPages(),
    emptyPdfPages: emptyPdf.getNumberOfPages(),
  }));
});
