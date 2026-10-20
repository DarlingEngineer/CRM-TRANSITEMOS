import React from 'react';
import { CHART_INK } from '../utils/chartTheme';

const numberFormatter = new Intl.NumberFormat('es-CO');

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? numberFormatter.format(number) : String(value ?? '');
}

/**
 * Tooltip común para las gráficas del CRM.
 * Mantiene el mismo lenguaje visual en Dashboard y Reportes.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  total,
  unit = 'ticket',
  showPercent = false,
}) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const value = Number(entry?.value) || 0;
  const title = label ?? entry?.payload?.name ?? entry?.name;
  const color = entry?.payload?.fill || entry?.color || entry?.stroke || CHART_INK.brand;
  const unitLabel = `${unit}${value === 1 ? '' : 's'}`;
  const percent = total ? (value / total) * 100 : null;

  return (
    <div className="chart-tooltip">
      {title && <p className="chart-tooltip__head">{title}</p>}
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__dot" style={{ background: color }} aria-hidden="true" />
        <strong className="chart-tooltip__value">{formatNumber(value)}</strong>
        <span className="chart-tooltip__unit">{unitLabel}</span>
        {showPercent && percent != null && (
          <span className="chart-tooltip__pct">
            {percent.toFixed(1).replace('.', ',')}%
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Etiqueta de categoría con truncado y texto completo al pasar el cursor.
 * Evita que nombres de área largos se superpongan o se corten.
 */
export function CategoryTick({ x, y, payload, maxChars = 17 }) {
  const fullText = String(payload?.value ?? '');
  const text = fullText.length > maxChars
    ? `${fullText.slice(0, maxChars - 1).trimEnd()}…`
    : fullText;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-8}
        y={0}
        dy={4}
        textAnchor="end"
        fill={CHART_INK.muted}
        fontSize={11}
        fontWeight={500}
      >
        {text}
        <title>{fullText}</title>
      </text>
    </g>
  );
}
