import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from './secureLogger';

afterEach(() => vi.restoreAllMocks());

describe('secureLogger', () => {
  it('redacta campos sensibles (también anidados) y deja los demás', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.debug('login', {
      password: 'secreto',
      email: 'a@b.cl',
      rut: '1-9',
      accessToken: 'abc',
      nombre: 'Ana',
      nested: { token: 't', ok: 1 },
    });
    const logged = spy.mock.calls[0][1];
    expect(logged).toMatchObject({
      password: '[REDACTED]',
      email: '[REDACTED]',
      rut: '[REDACTED]',
      accessToken: '[REDACTED]',
      nombre: 'Ana',
      nested: { token: '[REDACTED]', ok: 1 },
    });
    expect(JSON.stringify(logged)).not.toContain('secreto');
  });

  it('no modifica el objeto original', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const data = { password: 'x' };
    logger.debug('m', data);
    expect(data.password).toBe('x');
  });

  it('sanitiza también dentro de arreglos', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.debug('m', [{ password: 'x' }, { ok: 1 }]);
    expect(spy.mock.calls[0][1]).toEqual([{ password: '[REDACTED]' }, { ok: 1 }]);
  });
});
