import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as { id: string } | null,
  // Por usuario: promesa con el resultado de profiles.role y de is_super_admin
  profiles: {} as Record<string, Promise<{ data: any; error: any }>>,
  superAdmin: {} as Record<string, Promise<{ data: any; error: any }>>,
  calls: { profiles: 0, rpc: 0 },
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: (_col: string, id: string) => ({
          single: () => {
            mocks.calls.profiles++;
            return mocks.profiles[id];
          },
        }),
      }),
    }),
    rpc: () => {
      mocks.calls.rpc++;
      return mocks.superAdmin[mocks.user!.id];
    },
  },
}));

import { PermissionsProvider, usePermissionsState } from './PermissionsContext';

// Registra TODOS los renders (también los intermedios) para detectar permisos filtrados de otro usuario.
const rendered: { user: string | undefined; text: string }[] = [];
const Probe = () => {
  const { role, isSuperAdmin, loading, error } = usePermissionsState();
  const value = `${role}|${isSuperAdmin}|${loading}|${error ?? ''}`;
  rendered.push({ user: mocks.user?.id, text: value });
  return <div data-testid="p">{value}</div>;
};
const text = () => screen.getByTestId('p').textContent;
const ok = (data: any) => Promise.resolve({ data, error: null });
const never = () => new Promise<any>(() => {});

beforeEach(() => {
  rendered.length = 0;
  mocks.user = null;
  mocks.profiles = {};
  mocks.superAdmin = {};
  mocks.calls = { profiles: 0, rpc: 0 };
});

describe('PermissionsProvider', () => {
  it('sin usuario: consultor, sin consultas', () => {
    render(
      <PermissionsProvider>
        <Probe />
      </PermissionsProvider>
    );
    expect(text()).toBe('consultor|false|false|');
    expect(mocks.calls).toEqual({ profiles: 0, rpc: 0 });
  });

  it('carga rol y super admin con UNA consulta de cada tipo aunque haya varios consumidores', async () => {
    mocks.user = { id: 'a' };
    mocks.profiles.a = ok({ role: 'admin' });
    mocks.superAdmin.a = ok(true);
    render(
      <PermissionsProvider>
        <Probe />
        <Probe />
        <Probe />
      </PermissionsProvider>
    );
    await waitFor(() => expect(screen.getAllByTestId('p')[0].textContent).toBe('admin|true|false|'));
    expect(mocks.calls).toEqual({ profiles: 1, rpc: 1 });
  });

  it('error al leer el perfil: consultor y con error (falla cerrado)', async () => {
    mocks.user = { id: 'a' };
    mocks.profiles.a = Promise.resolve({ data: null, error: { message: 'boom' } });
    mocks.superAdmin.a = ok(true);
    render(
      <PermissionsProvider>
        <Probe />
      </PermissionsProvider>
    );
    await waitFor(() => expect(text()).toBe('consultor|true|false|Error al cargar permisos'));
  });

  it('un rol desconocido no concede admin', async () => {
    mocks.user = { id: 'a' };
    mocks.profiles.a = ok({ role: 'root' });
    mocks.superAdmin.a = ok(false);
    render(
      <PermissionsProvider>
        <Probe />
      </PermissionsProvider>
    );
    await waitFor(() => expect(text()).toBe('consultor|false|false|'));
  });

  it('al cambiar de usuario nunca se reutilizan los permisos del anterior', async () => {
    mocks.user = { id: 'a' };
    mocks.profiles.a = ok({ role: 'admin' });
    mocks.superAdmin.a = ok(true);
    mocks.profiles.b = never(); // la carga del usuario B queda pendiente
    mocks.superAdmin.b = never();

    const { rerender } = render(
      <PermissionsProvider>
        <Probe />
      </PermissionsProvider>
    );
    await waitFor(() => expect(text()).toBe('admin|true|false|'));

    mocks.user = { id: 'b' };
    rerender(
      <PermissionsProvider>
        <Probe />
      </PermissionsProvider>
    );
    expect(text()).toBe('consultor|false|true|');
    // Ningún render del usuario B (ni el primero, antes de que corra el efecto) pudo ver los permisos de A.
    const forB = rendered.filter((r) => r.user === 'b');
    expect(forB.length).toBeGreaterThan(0);
    expect(forB.every((r) => r.text === 'consultor|false|true|')).toBe(true);
  });
});
