import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  role: { role: 'consultor', loading: false, error: null as string | null },
  auth: { user: null as unknown, loading: false },
}));

vi.mock('@/hooks/useRole', () => ({ useRole: () => mocks.role }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => mocks.auth }));

import { AdminOnly, RoleGuard } from './RoleGuard';
import { ProtectedRoute } from './ProtectedRoute';

beforeEach(() => {
  mocks.role = { role: 'consultor', loading: false, error: null };
  mocks.auth = { user: null, loading: false };
});

describe('RoleGuard / AdminOnly', () => {
  it('un admin ve el contenido', () => {
    mocks.role = { role: 'admin', loading: false, error: null };
    render(<AdminOnly>secreto</AdminOnly>);
    expect(screen.getByText('secreto')).toBeInTheDocument();
  });

  it('un consultor no ve el contenido de admin', () => {
    render(<AdminOnly>secreto</AdminOnly>);
    expect(screen.queryByText('secreto')).not.toBeInTheDocument();
  });

  it('falla cerrado mientras carga el rol', () => {
    mocks.role = { role: 'admin', loading: true, error: null };
    render(<AdminOnly>secreto</AdminOnly>);
    expect(screen.queryByText('secreto')).not.toBeInTheDocument();
  });

  it('falla cerrado si hubo error al cargar permisos, aunque el rol parezca admin', () => {
    mocks.role = { role: 'admin', loading: false, error: 'Error al cargar permisos' };
    render(<AdminOnly>secreto</AdminOnly>);
    expect(screen.queryByText('secreto')).not.toBeInTheDocument();
  });

  it('muestra el aviso cuando se pide y no hay permiso', () => {
    render(<AdminOnly showMessage>secreto</AdminOnly>);
    expect(screen.getByText(/requiere permisos de administrador/i)).toBeInTheDocument();
  });

  it('muestra el fallback si existe', () => {
    render(
      <RoleGuard fallback={<span>sin acceso</span>}>
        secreto
      </RoleGuard>
    );
    expect(screen.getByText('sin acceso')).toBeInTheDocument();
  });
});

describe('ProtectedRoute', () => {
  const renderAt = () =>
    render(
      <MemoryRouter initialEntries={['/privado']}>
        <Routes>
          <Route path="/privado" element={<ProtectedRoute>contenido privado</ProtectedRoute>} />
          <Route path="/auth" element={<div>pantalla de login</div>} />
        </Routes>
      </MemoryRouter>
    );

  it('sin sesión redirige a /auth', () => {
    renderAt();
    expect(screen.getByText('pantalla de login')).toBeInTheDocument();
    expect(screen.queryByText('contenido privado')).not.toBeInTheDocument();
  });

  it('con sesión muestra el contenido', () => {
    mocks.auth = { user: { id: 'u1' }, loading: false };
    renderAt();
    expect(screen.getByText('contenido privado')).toBeInTheDocument();
  });

  it('mientras verifica la sesión no muestra contenido ni redirige', () => {
    mocks.auth = { user: null, loading: true };
    renderAt();
    expect(screen.getByText(/verificando autenticación/i)).toBeInTheDocument();
    expect(screen.queryByText('contenido privado')).not.toBeInTheDocument();
    expect(screen.queryByText('pantalla de login')).not.toBeInTheDocument();
  });
});
