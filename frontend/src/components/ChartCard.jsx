import React from 'react';

export default function ChartCard({ title, description, children, footer, style }) {
  return (
    <section className="chart-card" style={style}>
      <header>
        <h3 className="chart-card__title">{title}</h3>
        {description && <p className="chart-card__desc">{description}</p>}
      </header>
      <div className="chart-card__body">{children}</div>
      {footer && <div className="chart-card__footer">{footer}</div>}
    </section>
  );
}
