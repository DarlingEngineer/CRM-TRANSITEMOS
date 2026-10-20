// =========================================================
// Paleta única de gráficas y reportes (pantalla + PDF).
// Validada para daltonismo (protanopia/deuteranopia) y
// contraste sobre fondo blanco. Si se cambia un color,
// cambiarlo aquí y no en cada página.
// =========================================================

// Estados: colores categóricos (cada estado es una identidad distinta).
export const STATUS_ORDER = ['Abierto', 'En proceso', 'Resuelto', 'Cerrado'];
export const STATUS_COLORS = {
  Abierto: '#2a78d6',      // azul
  'En proceso': '#eda100', // ámbar
  Resuelto: '#1baf7a',     // verde agua
  Cerrado: '#4a3aa7',      // violeta
};

// Prioridades: escala ordinal de un solo tono (más oscuro = más urgente).
export const PRIORITY_ORDER = ['Baja', 'Media', 'Alta', 'Urgente'];
export const PRIORITY_COLORS = {
  Baja: '#86b6ef',
  Media: '#3987e5',
  Alta: '#1c5cab',
  Urgente: '#0d366b',
};

// Serie única (tickets por mes, por área, tiempo de resolución).
export const SERIES_COLOR = '#2a78d6';

// Tintes suaves para las insignias de las tablas.
export const STATUS_BADGES = {
  Abierto: { bg: '#e3effc', text: '#1c5cab' },
  'En proceso': { bg: '#fdf1d6', text: '#8a5a00' },
  Resuelto: { bg: '#dcf5ec', text: '#0f6b4a' },
  Cerrado: { bg: '#e9e6f7', text: '#4a3aa7' },
};

export const PRIORITY_BADGES = {
  Baja: { bg: '#e3effc', text: '#1c5cab' },
  Media: { bg: '#cde2fb', text: '#184f95' },
  Alta: { bg: '#1c5cab', text: '#ffffff' },
  Urgente: { bg: '#0d366b', text: '#ffffff' },
};

// Elementos de apoyo: ejes, cuadrícula y textos.
export const CHART_INK = {
  text: '#1e293b',
  muted: '#64748b',
  axis: '#cbd5e1',
  grid: '#e2e8f0',
  track: '#e2e8f0',
  brand: '#0b4f78',
};

export const AXIS_TICK = { fontSize: 11, fill: CHART_INK.muted, fontWeight: 500 };
export const VALUE_LABEL = { fontSize: 11, fill: '#0f172a', fontWeight: 700 };

// Cuadrícula y cursores suaves, comunes a todas las gráficas.
export const CHART_GRID = { stroke: '#e6eef7', strokeDasharray: '3 4' };
export const CHART_CURSOR = { fill: 'rgba(37, 99, 235, 0.055)' };
export const LINE_CURSOR = { stroke: '#94a3b8', strokeDasharray: '4 4' };

// Normaliza variantes como "En Proceso" o "in_progress".
const STATUS_ALIASES = {
  abierto: 'Abierto', open: 'Abierto',
  'en proceso': 'En proceso', in_progress: 'En proceso',
  resuelto: 'Resuelto', resolved: 'Resuelto',
  cerrado: 'Cerrado', closed: 'Cerrado',
};

export function normalizeStatus(status) {
  return STATUS_ALIASES[(status || '').toLowerCase()] || status;
}
