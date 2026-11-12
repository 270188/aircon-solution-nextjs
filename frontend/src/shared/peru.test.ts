import { describe, expect, it } from 'vitest';

import { isValidDni, isValidRuc, lineTotals, lineTotalsPlusIgv, splitTotal } from './peru';

describe('peru', () => {
  it('valida el RUC con su dígito verificador', () => {
    expect(isValidRuc('20616633733')).toBe(true);
    expect(isValidRuc('20616633734')).toBe(false);
    expect(isValidDni('45678912')).toBe(true);
  });

  it('calcula el IGV con y sin IGV incluido', () => {
    expect(lineTotals(2, 118)).toEqual({ subtotal: 200, igv: 36, total: 236 });
    expect(lineTotalsPlusIgv(2, 100)).toEqual({ subtotal: 200, igv: 36, total: 236 });
    expect(splitTotal(630.5)).toEqual({ subtotal: 534.32, igv: 96.18, total: 630.5 });
  });
});
