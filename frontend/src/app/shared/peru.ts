/** RUC de 11 dígitos con dígito verificador correcto (mismo algoritmo que el backend). */
export function isValidRuc(ruc: string): boolean {
  if (!/^(10|15|17|20)\d{9}$/.test(ruc)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(ruc[i]), 0);
  let check = 11 - (sum % 11);
  if (check === 10) check = 0;
  if (check === 11) check = 1;
  return check === Number(ruc[10]);
}

export function isValidDni(dni: string): boolean {
  return /^\d{8}$/.test(dni);
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Cálculo de una línea con precio que incluye IGV 18 % (igual que el backend). */
export function lineTotals(quantity: number, unitPrice: number): { subtotal: number; igv: number; total: number } {
  const total = round2(round2(unitPrice) * round2(quantity));
  const subtotal = round2(total / 1.18);
  return { subtotal, igv: round2(total - subtotal), total };
}
