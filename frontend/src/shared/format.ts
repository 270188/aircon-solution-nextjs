/** Formatos de número y fecha equivalentes a los pipes de Angular que usaba el panel. */
export const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const qty = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

/** "2026-11-08" → "08/11/2026" */
export function dmy(iso: string): string {
  const d = iso.length <= 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Fecha y hora local: "08/11/2026 23:25" */
export function dmyHm(iso: string): string {
  const d = new Date(iso);
  return `${dmy(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
