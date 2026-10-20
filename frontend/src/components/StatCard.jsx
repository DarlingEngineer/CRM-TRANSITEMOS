import React from 'react';

/**
 * Tarjeta de indicador (KPI).
 * Se renderiza como botón cuando recibe `onClick` para conservar accesibilidad.
 */
const numberFormatter = new Intl.NumberFormat('es-CO');

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
  onClick,
}) {
  const Tag = onClick ? 'button' : 'div';
  const displayValue = typeof value === 'number' ? numberFormatter.format(value) : value;

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`stat-card stat-card--${tone}`}
      onClick={onClick}
    >
      <span className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        {Icon && (
          <span className="stat-card__icon" aria-hidden="true">
            <Icon size={16} />
          </span>
        )}
      </span>
      <span className="stat-card__value">{displayValue}</span>
      {hint && <span className="stat-card__hint">{hint}</span>}
    </Tag>
  );
}
