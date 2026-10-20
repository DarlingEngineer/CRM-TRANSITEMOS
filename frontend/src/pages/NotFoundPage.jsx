import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="route-loading">
      <div className="card" style={{ maxWidth: 440, padding: '34px 30px', textAlign: 'center' }}>
        <p className="page-header__eyebrow" style={{ marginBottom: 4 }}>Error 404</p>
        <h1 className="page-title" style={{ fontSize: '2.6rem', letterSpacing: '-0.04em' }}>404</h1>
        <p className="page-subtitle" style={{ margin: '10px auto 22px' }}>
          La página que buscas no existe o fue movida a otra ubicación.
        </p>
        <Link to="/dashboard" className="btn btn--primary">
          <ArrowLeft size={16} aria-hidden="true" />
          Volver al dashboard
        </Link>
      </div>
    </div>
  );
}
