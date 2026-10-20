import React from 'react';

export default function ChartCard({
  title,
  description,
  children,
  footer,
  style,
  icon: Icon,
  meta,
  tone = 'brand',
}) {
  return (
    <section className={`chart-card chart-card--${tone}`} style={style}>
      <header className="chart-card__header">
        {Icon && (
          <span className="chart-card__icon" aria-hidden="true">
            <Icon size={17} />
          </span>
        )}
        <div className="chart-card__heading">
          <div className="chart-card__title-row">
            <h3 className="chart-card__title">{title}</h3>
            {meta && <span className="chart-card__meta">{meta}</span>}
          </div>
          {description && <p className="chart-card__desc">{description}</p>}
        </div>
      </header>
      <div className="chart-card__body">{children}</div>
      {footer && <div className="chart-card__footer">{footer}</div>}
    </section>
  );
}
