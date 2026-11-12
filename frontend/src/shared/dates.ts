export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const WEEKDAYS_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
export const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Fecha local en formato ISO (YYYY-MM-DD), sin desfases de zona horaria. */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fromIsoDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "martes 12 de noviembre" */
export function longDate(iso: string): string {
  const d = fromIsoDate(iso);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

/** "14:00" -> "2:00 p. m." */
export function prettyTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'p. m.' : 'a. m.';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Archivo .ics para que el cliente agregue la cita a su calendario. */
export function buildIcs(opts: { code: string; date: string; time: string; title: string; address: string }): string {
  const [y, mo, d] = opts.date.split('-');
  const [h, mi] = opts.time.split(':').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${y}${mo}${d}T${pad(h)}${pad(mi)}00`;
  const end = `${y}${mo}${d}T${pad(h + 2)}${pad(mi)}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AIRCONSOLUTION SERVICES SAC//Reservas//ES',
    'BEGIN:VEVENT',
    `UID:${opts.code}@airconsolutionsac.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=America/Lima:${start}`,
    `DTEND;TZID=America/Lima:${end}`,
    `SUMMARY:${opts.title} - AIRCONSOLUTION SERVICES SAC`,
    `LOCATION:${opts.address.replace(/[,;]/g, ' ')}`,
    `DESCRIPTION:Código de reserva ${opts.code}. Consultas al WhatsApp +51 985 899 731.`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
