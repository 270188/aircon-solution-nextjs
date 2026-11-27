// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Base de datos simulada: solo entiende las consultas de la tabla de intentos fallidos. */
const failures: { ip: string; at: number }[] = [];
vi.mock('@neondatabase/serverless', () => ({
  neon: () => async (query: string, params: unknown[] = []) => {
    const q = query.replace(/\s+/g, ' ').trim();
    if (q.startsWith('create ')) return [];
    if (q.startsWith('select count(*) filter')) {
      const since = Date.now() - Number(params[1]) * 60_000;
      const recent = failures.filter((f) => f.at > since);
      return [{ mine: recent.filter((f) => f.ip === params[0]).length, total: recent.length }];
    }
    if (q.startsWith('insert into admin_login_failures')) {
      failures.push({ ip: String(params[0]), at: Date.now() });
      return [];
    }
    if (q.startsWith('delete from admin_login_failures where ip')) {
      for (let i = failures.length - 1; i >= 0; i--) if (failures[i].ip === params[0]) failures.splice(i, 1);
      return [];
    }
    if (q.startsWith('delete from admin_login_failures where failed_at')) return [];
    throw new Error('Consulta no simulada: ' + q);
  },
}));

process.env.DATABASE_URL = 'postgresql://prueba';
process.env.ADMIN_USERS = 'admin:clave-correcta-larga';
const { default: handler } = await import('./api.mts');

const login = (password: string, ip = '200.48.1.1') =>
  handler(new Request('https://airconsolutionsac.com/api/v1/admin/me', {
    headers: { authorization: 'Basic ' + btoa(`admin:${password}`), 'x-nf-client-connection-ip': ip },
  }));

describe('bloqueo de intentos fallidos del panel', () => {
  beforeEach(() => {
    failures.length = 0;
  });

  it('bloquea una IP tras 10 claves equivocadas, aunque luego ponga la correcta', async () => {
    for (let i = 0; i < 10; i++) expect((await login('mala' + i)).status).toBe(401);
    const res = await login('clave-correcta-larga');
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('900');
    expect((await res.json()).detail).toContain('Demasiados intentos');
  });

  it('no afecta a otra IP y un ingreso correcto limpia los intentos', async () => {
    for (let i = 0; i < 9; i++) await login('mala', '1.1.1.1');
    expect((await login('clave-correcta-larga', '2.2.2.2')).status).toBe(200);
    expect((await login('clave-correcta-larga', '1.1.1.1')).status).toBe(200);
    expect(failures.filter((f) => f.ip === '1.1.1.1')).toHaveLength(0);
  });

  it('bloquea el ingreso con clave si hay 50 fallos entre muchas IPs', async () => {
    for (let i = 0; i < 50; i++) await login('mala', `10.0.0.${i}`);
    expect((await login('clave-correcta-larga', '9.9.9.9')).status).toBe(429);
  });

  it('los intentos viejos (más de 15 minutos) ya no cuentan', async () => {
    for (let i = 0; i < 10; i++) failures.push({ ip: '3.3.3.3', at: Date.now() - 16 * 60_000 });
    expect((await login('clave-correcta-larga', '3.3.3.3')).status).toBe(200);
  });
});
