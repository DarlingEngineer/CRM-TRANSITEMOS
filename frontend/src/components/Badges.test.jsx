import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge, PriorityBadge } from './Feedback';

describe('Badges', () => {
  it('StatusBadge muestra el estado con color correcto', () => {
    render(<StatusBadge status="Abierto" />);
    const el = screen.getByText('Abierto');
    expect(el).toBeInTheDocument();
    expect(el).toHaveStyle({ background: '#e3effc' });
  });

  it('PriorityBadge muestra la prioridad', () => {
    render(<PriorityBadge priority="Urgente" />);
    expect(screen.getByText('Urgente')).toBeInTheDocument();
  });

  it('StatusBadge desconocido usa color gris', () => {
    render(<StatusBadge status="Otro" />);
    expect(screen.getByText('Otro')).toHaveStyle({ background: '#f1f5f9' });
  });
});






