import React from 'react';
import { AlertCircle, CheckCircle2, Inbox } from 'lucide-react';
import { STATUS_BADGES, PRIORITY_BADGES, normalizeStatus } from '../utils/chartTheme';

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert--error" role="alert">
      <AlertCircle size={16} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert--success" role="status">
      <CheckCircle2 size={16} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function Loading({ text = 'Cargando información del servidor…' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

export function EmptyState({ icon, message = 'Sin registros', hint }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        {icon || <Inbox size={22} />}
      </div>
      <p className="empty-state__title">{message}</p>
      {hint && <p className="empty-state__hint">{hint}</p>}
    </div>
  );
}

// Los colores salen de la paleta compartida con las gráficas y el PDF.
export const STATUS_COLORS = STATUS_BADGES;
export const PRIORITY_COLORS = PRIORITY_BADGES;

export function StatusBadge({ status }) {
  const theme = STATUS_COLORS[normalizeStatus(status)] || { bg: '#f1f5f9', text: '#475569' };
  return (
    <span className="badge" style={{ background: theme.bg, color: theme.text }}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const theme = PRIORITY_COLORS[priority] || { bg: '#f1f5f9', text: '#475569' };
  return (
    <span className="badge" style={{ background: theme.bg, color: theme.text }}>
      {priority}
    </span>
  );
}
