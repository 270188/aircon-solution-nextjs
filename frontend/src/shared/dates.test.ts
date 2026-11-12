import { describe, expect, it } from 'vitest';

import { buildIcs, fromIsoDate, longDate, prettyTime, toIsoDate } from './dates';

describe('dates', () => {
  it('convierte fechas locales a ISO sin desfase de zona horaria', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toIsoDate(fromIsoDate('2026-12-31'))).toBe('2026-12-31');
  });

  it('muestra la fecha en español', () => {
    expect(longDate('2026-11-12')).toBe('jueves 12 de noviembre');
  });

  it('muestra la hora en formato de 12 horas', () => {
    expect(prettyTime('08:00')).toBe('8:00 a. m.');
    expect(prettyTime('12:00')).toBe('12:00 p. m.');
    expect(prettyTime('17:30')).toBe('5:30 p. m.');
  });

  it('genera un evento de calendario de 2 horas', () => {
    const ics = buildIcs({ code: 'ACS-ABC123', date: '2026-11-12', time: '09:00', title: 'Mantenimiento', address: 'Av. Perú, Lima' });
    expect(ics).toContain('DTSTART;TZID=America/Lima:20261112T090000');
    expect(ics).toContain('DTEND;TZID=America/Lima:20261112T110000');
    expect(ics).toContain('UID:ACS-ABC123@airconsolutionsac.com');
  });
});
