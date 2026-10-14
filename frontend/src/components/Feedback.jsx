import React from 'react';
import { STATUS_BADGES, PRIORITY_BADGES, normalizeStatus } from '../utils/chartTheme';

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{ background: '#f8d7da', color: '#842029', border: '1px solid #f5c2c7', padding: '10px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.82rem', textAlign: 'center', fontWeight: 500 }}>
      ⚠️ {message}
    </div>
  );
}

export function Loading({ text = 'Cargando información del servidor...' }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#0b4f78', fontWeight: 600 }}>
      {text}
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{ background: '#d1e7dd', color: '#0f5132', border: '1px solid #badbcc', padding: '10px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.82rem', textAlign: 'center', fontWeight: 500 }}>
      ✅ {message}
    </div>
  );
}

export function EmptyState({ icon = '📭', message = 'Sin registros' }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
      <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{message}</div>
    </div>
  );
}

// Los colores salen de la paleta compartida con las gráficas y el PDF.
export const STATUS_COLORS = STATUS_BADGES;
export const PRIORITY_COLORS = PRIORITY_BADGES;

export function StatusBadge({ status }) {
  const theme = STATUS_COLORS[normalizeStatus(status)] || { bg: '#f1f5f9', text: '#475569' };
  return (
    <span style={{ background: theme.bg, color: theme.text, padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const theme = PRIORITY_COLORS[priority] || { bg: '#f1f5f9', text: '#475569' };
  return (
    <span style={{ background: theme.bg, color: theme.text, padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {priority}
    </span>
  );
}







