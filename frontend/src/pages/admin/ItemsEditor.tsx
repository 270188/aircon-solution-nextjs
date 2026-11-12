import { money } from '../../shared/format';
import { Icon } from '../../shared/Icon';
import { lineTotals, lineTotalsPlusIgv } from '../../shared/peru';

export interface ItemRow {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Props {
  items: ItemRow[];
  onChange: (items: ItemRow[]) => void;
  includesIgv: boolean;
  onIncludesIgvChange: (v: boolean) => void;
  totals: { subtotal: number; igv: number; total: number };
  /** Prefijo de los nombres de campos (para no repetir ids entre formularios). */
  prefix: string;
}

/** Detalle editable de ítems con elección de IGV y totales en vivo (lo usan facturas y cotizaciones). */
export function ItemsEditor({ items, onChange, includesIgv, onIncludesIgvChange, totals, prefix }: Props) {
  const update = (i: number, field: keyof ItemRow, value: string) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, [field]: field === 'description' ? value : Number(value) } : it)));

  /** Importe de la línea tal como se muestra: con IGV si los precios lo incluyen, sin IGV si no. */
  const amount = (it: ItemRow) => {
    const q = Number(it.quantity) || 0;
    const p = Number(it.unitPrice) || 0;
    return includesIgv ? lineTotals(q, p).total : lineTotalsPlusIgv(q, p).subtotal;
  };

  return (
    <>
      <div className="toggle" role="radiogroup" aria-label="Cálculo del IGV">
        <button type="button" role="radio" aria-checked={!includesIgv} className={!includesIgv ? 'on' : ''} onClick={() => onIncludesIgvChange(false)}>
          Precios sin IGV (+18 %)
        </button>
        <button type="button" role="radio" aria-checked={includesIgv} className={includesIgv ? 'on' : ''} onClick={() => onIncludesIgvChange(true)}>
          Precios con IGV
        </button>
      </div>
      <div className="items">
        {items.map((it, i) => (
          <div key={i} className="item-row">
            <input className="desc" name={`${prefix}d${i}`} value={it.description} onChange={(e) => update(i, 'description', e.target.value)} placeholder="Descripción del servicio" maxLength={250} aria-label="Descripción" />
            <input className="qty" name={`${prefix}q${i}`} type="number" min="0.01" step="0.01" value={it.quantity} onChange={(e) => update(i, 'quantity', e.target.value)} aria-label="Cantidad" />
            <input
              className="price"
              name={`${prefix}p${i}`}
              type="number"
              min="0.01"
              step="0.01"
              value={it.unitPrice}
              onChange={(e) => update(i, 'unitPrice', e.target.value)}
              aria-label={includesIgv ? 'Precio unitario con IGV' : 'Valor unitario sin IGV'}
            />
            <span className="line-total">S/ {money(amount(it))}</span>
            <button type="button" className="x" onClick={() => onChange(items.length > 1 ? items.filter((_, idx) => idx !== i) : items)} disabled={items.length === 1} aria-label="Quitar ítem">
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
        <button type="button" className="link add" onClick={() => onChange([...items, { description: '', quantity: 1, unitPrice: 0 }])}>+ Agregar ítem</button>
      </div>
      <dl className="sums">
        <div><dt>Op. gravada</dt><dd>S/ {money(totals.subtotal)}</dd></div>
        <div><dt>IGV (18 %)</dt><dd>S/ {money(totals.igv)}</dd></div>
        <div className="grand"><dt>Total</dt><dd>S/ {money(totals.total)}</dd></div>
      </dl>
    </>
  );
}
