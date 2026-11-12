import { useEffect, useMemo, useState } from 'react';

import { ApiError, api, describeError, type AdminBooking, type Page, type Quote, type QuoteRequest, type QuoteStatus, type QuoteSummary } from '../../core/api';
import { ui } from '../../core/ui';
import { dmy, download, money, qty } from '../../shared/format';
import { Icon } from '../../shared/Icon';
import { lineTotals, lineTotalsPlusIgv, splitTotal } from '../../shared/peru';
import { ItemsEditor, type ItemRow } from './ItemsEditor';

const STATUS_LABEL: Record<QuoteStatus, string> = { PENDIENTE: 'Pendiente', ACEPTADA: 'Aceptada', RECHAZADA: 'Rechazada', VENCIDA: 'Vencida' };
const STATUSES: QuoteStatus[] = ['PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'VENCIDA'];
const emptyItems = (): ItemRow[] => [{ description: '', quantity: 1, unitPrice: 0 }];
const emptyCustomer = { name: '', doc: '', contact: '', phone: '', email: '', address: '' };

interface Props {
  auth: string;
  fromBooking: AdminBooking | null;
  onUnauthorized: () => void;
  /** El usuario pidió facturar una cotización. */
  onBill: (q: Quote) => void;
}

/** Pestaña "Cotizaciones" del panel: crear, ver, descargar en Excel y pasar a factura. */
export function Quotes({ auth, fromBooking, onUnauthorized, onBill }: Props) {
  const [list, setList] = useState<Page<QuoteSummary> | null>(null);
  const [view, setView] = useState<Quote | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [formError, setFormError] = useState('');

  const [customer, setCustomer] = useState(emptyCustomer);
  const [validDays, setValidDays] = useState(15);
  const [notes, setNotes] = useState('');
  const [bookingId, setBookingId] = useState<number | null>(null);
  /** Por defecto los precios se escriben sin IGV y el sistema suma el 18 %. */
  const [includesIgv, setIncludesIgv] = useState(false);
  const [items, setItems] = useState<ItemRow[]>(emptyItems);

  const fail = (e: unknown, toast = true) => {
    if (e instanceof ApiError && e.status === 401) return onUnauthorized();
    if (toast) ui.toast('error', 'Error', describeError(e).message);
  };
  const load = (page: number) => api.quotes(auth, page).then(setList, fail);

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const reset = () => {
    setCustomer(emptyCustomer);
    setValidDays(15);
    setNotes('');
    setBookingId(null);
    setIncludesIgv(false);
    setItems(emptyItems());
    setFormError('');
  };

  useEffect(() => {
    if (!fromBooking) return;
    reset();
    setBookingId(fromBooking.id);
    setCustomer({
      ...emptyCustomer,
      name: fromBooking.name,
      phone: fromBooking.phone,
      email: fromBooking.email ?? '',
      address: [fromBooking.address, fromBooking.district].filter(Boolean).join(', '),
    });
    setItems([{ description: fromBooking.service, quantity: 1, unitPrice: 0 }]);
    setFormOpen(true);
  }, [fromBooking]);

  const totals = useMemo(() => {
    if (includesIgv) {
      return splitTotal(items.reduce((acc, it) => acc + lineTotals(Number(it.quantity) || 0, Number(it.unitPrice) || 0).total, 0));
    }
    return items.reduce(
      (acc, it) => {
        const t = lineTotalsPlusIgv(Number(it.quantity) || 0, Number(it.unitPrice) || 0);
        return { subtotal: acc.subtotal + t.subtotal, igv: acc.igv + t.igv, total: acc.total + t.total };
      },
      { subtotal: 0, igv: 0, total: 0 },
    );
  }, [items, includesIgv]);

  const setField = (k: keyof typeof emptyCustomer) => (e: React.ChangeEvent<HTMLInputElement>) => setCustomer((c) => ({ ...c, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name.trim()) return setFormError('Ingresa el nombre del cliente.');
    if (items.some((it) => !it.description.trim() || !(Number(it.quantity) > 0) || !(Number(it.unitPrice) > 0))) {
      return setFormError('Cada ítem necesita descripción, cantidad y precio mayor a 0.');
    }
    setFormError('');
    const t = (s: string) => s.trim() || null;
    const body: QuoteRequest = {
      customerDoc: t(customer.doc),
      customerName: customer.name.trim(),
      customerContact: t(customer.contact),
      customerPhone: t(customer.phone),
      customerEmail: t(customer.email),
      customerAddress: t(customer.address),
      bookingId,
      validDays: Number(validDays) || 15,
      pricesIncludeIgv: includesIgv,
      notes: t(notes),
      items: items.map((it) => ({ description: it.description.trim(), quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
    };
    setSaving(true);
    try {
      const q = await api.createQuote(auth, body);
      setFormOpen(false);
      setView(q);
      load(0);
      ui.toast('success', `Cotización ${q.code} creada`, 'Ya puedes descargarla en Excel.');
    } catch (err) {
      setFormError(describeError(err).message);
      fail(err, false);
    } finally {
      setSaving(false);
    }
  };

  const open = (id: number) => api.quote(auth, id).then(setView, fail);

  const setStatus = (q: Quote, status: QuoteStatus) =>
    api.quoteStatus(auth, q.id, status).then((updated) => {
      setView(updated);
      load(list?.page ?? 0);
    }, fail);

  const downloadExcel = async (id: number, code: string) => {
    setDownloading(id);
    try {
      download(await api.quoteExcel(auth, id), `Cotizacion-${code}.xlsx`);
    } catch (err) {
      fail(err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="c-quotes" style={{ display: 'contents' }}>
      <div className="head">
        <div>
          <h2>Cotizaciones</h2>
          <p className="muted">Crea presupuestos para tus clientes y descárgalos en Excel con el logo de la empresa.</p>
        </div>
        <button className="btn btn-primary btn-sm" type="button" onClick={() => { reset(); setFormOpen(true); }}>
          <Icon name="ticket" size={16} /> Nueva cotización
        </button>
      </div>

      {list && (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th className="num">Total</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {list.items.map((q) => (
                  <tr key={q.id}>
                    <td><strong>{q.code}</strong><small>Válida hasta {dmy(q.validUntil)}</small></td>
                    <td>{dmy(q.issueDate)}</td>
                    <td>{q.customerName}</td>
                    <td className="num">S/ {money(q.total)}</td>
                    <td><span className={`pill q-${q.status}`}>{STATUS_LABEL[q.status]}</span></td>
                    <td className="actions">
                      <button type="button" className="link" onClick={() => open(q.id)}>Ver</button>
                      <button type="button" className="link" disabled={downloading === q.id} onClick={() => downloadExcel(q.id, q.code)}>Excel</button>
                    </td>
                  </tr>
                ))}
                {list.items.length === 0 && (
                  <tr><td colSpan={6} className="empty">Aún no hay cotizaciones. Crea la primera con “Nueva cotización”.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {list.totalPages > 1 && (
            <div className="pager">
              <button className="btn btn-outline btn-sm" type="button" disabled={list.page === 0} onClick={() => load(list.page - 1)}>Anterior</button>
              <span>{list.page + 1} / {list.totalPages}</span>
              <button className="btn btn-outline btn-sm" type="button" disabled={list.page + 1 >= list.totalPages} onClick={() => load(list.page + 1)}>Siguiente</button>
            </div>
          )}
        </>
      )}

      {formOpen && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="q-form-title" onClick={() => setFormOpen(false)}>
          <form className="sheet card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <div className="sheet-head">
              <h3 id="q-form-title">Nueva cotización</h3>
              <button type="button" className="x" onClick={() => setFormOpen(false)} aria-label="Cerrar"><Icon name="close" /></button>
            </div>

            <fieldset>
              <legend>Cliente</legend>
              <div className="grid2">
                <label className="lbl">Nombre o razón social<input name="qName" value={customer.name} onChange={setField('name')} maxLength={200} /></label>
                <label className="lbl">RUC / DNI (opcional)<input name="qDoc" value={customer.doc} onChange={setField('doc')} maxLength={15} inputMode="numeric" /></label>
                <label className="lbl">Atención a (opcional)<input name="qContact" value={customer.contact} onChange={setField('contact')} maxLength={120} /></label>
                <label className="lbl">Teléfono<input name="qPhone" value={customer.phone} onChange={setField('phone')} maxLength={20} inputMode="tel" /></label>
                <label className="lbl">Correo<input name="qEmail" type="email" value={customer.email} onChange={setField('email')} maxLength={160} /></label>
                <label className="lbl">Dirección<input name="qAddress" value={customer.address} onChange={setField('address')} maxLength={250} /></label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Detalle</legend>
              <ItemsEditor items={items} onChange={setItems} includesIgv={includesIgv} onIncludesIgvChange={setIncludesIgv} totals={totals} prefix="q" />
            </fieldset>

            <div className="grid2">
              <label className="lbl">Validez (días)<input name="qValid" type="number" min={1} max={90} value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} /></label>
              <label className="lbl">Condiciones (opcional; si lo dejas vacío se usan las de siempre)
                <input name="qNotes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1500} placeholder="Forma de pago, garantía, plazos..." />
              </label>
            </div>

            {formError && <p className="form-error" role="alert">{formError}</p>}

            <div className="sheet-foot">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setFormOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent btn-sm" disabled={saving}>
                {saving ? <><span className="spinner"></span> Guardando...</> : 'Crear cotización'}
              </button>
            </div>
          </form>
        </div>
      )}

      {view && (
        <div className="modal" role="dialog" aria-modal="true" aria-label={`Cotización ${view.code}`} onClick={() => setView(null)}>
          <div className="viewer" onClick={(e) => e.stopPropagation()}>
            <div className="viewer-bar">
              <label className="status-select">Estado
                <select value={view.status} onChange={(e) => setStatus(view, e.target.value as QuoteStatus)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </label>
              <div className="bar-actions">
                <button className="btn btn-primary btn-sm" type="button" disabled={downloading === view.id} onClick={() => downloadExcel(view.id, view.code)}>
                  <Icon name="download" size={16} /> Descargar Excel
                </button>
                <button className="btn btn-outline btn-sm" type="button" onClick={() => { onBill(view); setView(null); }}>
                  <Icon name="ticket" size={16} /> Facturar
                </button>
                <button type="button" className="x" onClick={() => setView(null)} aria-label="Cerrar"><Icon name="close" /></button>
              </div>
            </div>
            <article className="paper">
              <header className="p-head">
                <div className="issuer">
                  <img src="/images/logo.jpg" alt="" width={64} height={64} />
                  <div><strong>AIRCONSOLUTION SERVICES SAC</strong><span>RUC 20616633733</span></div>
                </div>
                <div className="box"><strong>COTIZACIÓN</strong><span>{view.code}</span></div>
              </header>
              <section className="p-client">
                <div><span>Cliente:</span> {view.customerName}</div>
                <div><span>Fecha:</span> {dmy(view.issueDate)}</div>
                {view.customerDoc && <div><span>RUC / DNI:</span> {view.customerDoc}</div>}
                <div><span>Válida hasta:</span> {dmy(view.validUntil)}</div>
              </section>
              <table className="p-items">
                <thead>
                  <tr><th>Cant.</th><th>Descripción</th><th className="num">P. unit. {view.pricesIncludeIgv ? '(inc. IGV)' : '(sin IGV)'}</th><th className="num">Importe</th></tr>
                </thead>
                <tbody>
                  {view.items.map((it) => (
                    <tr key={it.lineNo}>
                      <td>{qty(it.quantity)}</td>
                      <td>{it.description}</td>
                      <td className="num">{money(it.unitPrice)}</td>
                      <td className="num">{money(view.pricesIncludeIgv ? it.total : it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-foot">
                <div className="words"><p>{view.totalInWords}</p></div>
                <dl>
                  <div><dt>Op. gravada</dt><dd>S/ {money(view.subtotal)}</dd></div>
                  <div><dt>IGV 18 %</dt><dd>S/ {money(view.igv)}</dd></div>
                  <div className="grand"><dt>Total</dt><dd>S/ {money(view.total)}</dd></div>
                </dl>
              </div>
            </article>
          </div>
        </div>
      )}
    </div>
  );
}
