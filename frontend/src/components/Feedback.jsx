import React from 'react';

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

export const STATUS_COLORS = {
  'Abierto': { bg: '#ede9fe', text: '#6d28d9' },
  'En proceso': { bg: '#ffedd5', text: '#c2410c' },
  'En Proceso': { bg: '#ffedd5', text: '#c2410c' },
  'Resuelto': { bg: '#d1fae5', text: '#065f46' },
  'Cerrado': { bg: '#f1f5f9', text: '#475569' },
};

export const PRIORITY_COLORS = {
  'Baja': { bg: '#d1fae5', text: '#065f46' },
  'Media': { bg: '#fef9c3', text: '#854d0e' },
  'Alta': { bg: '#fee2e2', text: '#b91c1c' },
  'Urgente': { bg: '#ede9fe', text: '#6d28d9' },
};

export function StatusBadge({ status }) {
  const theme = STATUS_COLORS[status] || { bg: '#f1f5f9', text: '#475569' };
  return (
    <span style={{ background: theme.bg, color: theme.text, padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const theme = PRIORITY_COLORS[priority] || { bg: '#d1fae5', text: '#065f46' };
  return (
    <span style={{ background: theme.bg, color: theme.text, padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {priority}
    </span>
  );
}







