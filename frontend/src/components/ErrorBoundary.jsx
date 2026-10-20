import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Se mantiene el registro en consola para diagnóstico local.
    console.error('Error de render en la aplicación:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="route-loading" role="alert">
        <div className="card" style={{ maxWidth: 460, padding: 28, textAlign: 'center' }}>
          <AlertTriangle size={30} style={{ color: '#b45309', marginBottom: 10 }} />
          <h1 className="page-title" style={{ fontSize: '1.15rem' }}>Algo salió mal</h1>
          <p className="page-subtitle" style={{ margin: '8px auto 18px' }}>
            La pantalla no pudo cargarse. Recarga la página para continuar; si el problema
            persiste, comunícate con el administrador del sistema.
          </p>
          <button type="button" className="btn btn--primary" onClick={this.handleReload}>
            Recargar página
          </button>
        </div>
      </div>
    );
  }
}
