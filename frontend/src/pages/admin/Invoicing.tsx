import { useEffect, useMemo, useState } from 'react';

import {
  ApiError,
  api,
  describeError,
  type AdminBooking,
  type Invoice,
  type InvoiceRequest,
  type InvoiceStatus,
  type InvoiceSummary,
  type InvoiceType,
  type InvoicingSettings,
  type Page,
  type Quote,
} from '../../core/api';
import { business } from '../../core/site.data';
import { ui } from '../../core/ui';
import { dmy, money, qty } from '../../shared/format';
import { Icon } from '../../shared/Icon';
import { isValidDni, isValidRuc, lineTotals, lineTotalsPlusIgv } from '../../shared/peru';
import { ItemsEditor, type ItemRow } from './ItemsEditor';

type DocType = '6' | '1' | '4' | '-';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  BORRADOR: 'Borrador',
  ACEPTADA: 'Aceptada por SUNAT',
  RECHAZADA: 'Rechazada',
  ERROR_ENVIO: 'Error de envío',
  ANULADA: 'Anulada',
};
const DOC_LABEL: Record<string, string> = { '6': 'RUC', '1': 'DNI', '4': 'C.E.', '-': 'Sin documento' };
const emptyItems = (): ItemRow[] => [{ description: '', quantity: 1, unitPrice: 0 }];

interface Props {
  auth: string;
  /** Reserva desde la que se pidió "Facturar" (prellena el formulario). */
  fromBooking: AdminBooking | null;
  /** Cotización aceptada que se quiere facturar. */
  fromQuote: Quote | null;
  onUnauthorized: () => void;
}

/** Pestaña "Facturación" del panel: emitir, ver, imprimir, enviar a SUNAT y anular comprobantes. */
export function Invoicing({ auth, fromBooking, fromQuote, onUnauthorized }: Props) {
  const [settings, setSettings] = useState<InvoicingSettings | null>(null);
  const [list, setList] = useState<Page<InvoiceSummary> | null>(null);
  const [view, setView] = useState<Invoice | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  // ---- formulario ----
  const [type, setTypeState] = useState<InvoiceType>('BOLETA');
  const [docType, setDocType] = useState<DocType>('1');
  const [docNumber, setDocNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [observations, setObservations] = useState('');
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [items, setItems] = useState<ItemRow[]>(emptyItems);
  /** Por defecto los precios se escriben sin IGV y el sistema suma el 18 %. */
  const [includesIgv, setIncludesIgv] = useState(false);
  const [formError, setFormError] = useState('');

  const fail = (e: unknown, toast = true) => {
    if (e instanceof ApiError && e.status === 401) return onUnauthorized();
    if (toast) ui.toast('error', 'Error', describeError(e).message);
  };

  const load = (page: number) => api.invoices(auth, page).then(setList, fail);

  useEffect(() => {
    api.invoicingSettings(auth).then(setSettings, fail);
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const resetForm = () => {
    setTypeState('BOLETA');
    setDocType('1');
    setDocNumber('');
    setCustomerName('');
    setCustomerAddress('');
    setCustomerEmail('');
    setObservations('');
    setBookingId(null);
    setIncludesIgv(false);
    setItems(emptyItems());
    setFormError('');
  };

  const setType = (t: InvoiceType) => {
    setTypeState(t);
    if (t === 'FACTURA') setDocType('6');
    else setDocType((d) => (d === '6' ? '1' : d));
  };

  useEffect(() => {
    if (!fromBooking) return;
    resetForm();
    setBookingId(fromBooking.id);
    setCustomerName(fromBooking.name);
    setCustomerAddress([fromBooking.address, fromBooking.district].filter(Boolean).join(', '));
    setCustomerEmail(fromBooking.email ?? '');
    setItems([{ description: `${fromBooking.service} - Reserva ${fromBooking.code}`, quantity: 1, unitPrice: 0 }]);
    setFormOpen(true);
  }, [fromBooking]);

  useEffect(() => {
    if (!fromQuote) return;
    resetForm();
    const doc = (fromQuote.customerDoc ?? '').trim();
    if (isValidRuc(doc)) {
      setType('FACTURA');
      setDocNumber(doc);
    } else if (isValidDni(doc)) {
      setDocNumber(doc);
    }
    setBookingId(fromQuote.bookingId);
    setCustomerName(fromQuote.customerName);
    setCustomerAddress(fromQuote.customerAddress ?? '');
    setCustomerEmail(fromQuote.customerEmail ?? '');
    setObservations(`Según cotización ${fromQuote.code}`);
    // Se respeta cómo se cotizó: con o sin IGV.
    setIncludesIgv(fromQuote.pricesIncludeIgv);
    setItems(fromQuote.items.map((it) => ({ description: it.description, quantity: it.quantity, unitPrice: it.unitPrice })));
    setFormOpen(true);
  }, [fromQuote]);

  const line = (it: ItemRow) => {
    const q = Number(it.quantity) || 0;
    const p = Number(it.unitPrice) || 0;
    return includesIgv ? lineTotals(q, p) : lineTotalsPlusIgv(q, p);
  };
  const totals = useMemo(
    () => items.reduce((acc, it) => {
      const t = line(it);
      return { subtotal: acc.subtotal + t.subtotal, igv: acc.igv + t.igv, total: acc.total + t.total };
    }, { subtotal: 0, igv: 0, total: 0 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, includesIgv],
  );

  const docHint = () => {
    const n = docNumber.trim();
    if (!n) return '';
    if (docType === '6') return isValidRuc(n) ? '✓ RUC válido' : 'RUC no válido';
    if (docType === '1') return isValidDni(n) ? '✓ DNI válido' : 'El DNI tiene 8 dígitos';
    return '';
  };

  const validate = (): string => {
    const doc = docNumber.trim();
    if (type === 'FACTURA') {
      if (!isValidRuc(doc)) return 'Para emitir factura ingresa un RUC válido de 11 dígitos.';
      if (!customerAddress.trim()) return 'Para emitir factura ingresa la dirección fiscal del cliente.';
    } else {
      if (docType === '1' && !isValidDni(doc)) return 'El DNI debe tener 8 dígitos.';
      if (docType === '6' && !isValidRuc(doc)) return 'El RUC no es válido.';
      if (docType === '-' && totals.total >= 700) return 'Para boletas desde S/ 700 debes indicar el DNI del cliente.';
    }
    if (!customerName.trim()) return 'Ingresa el nombre o razón social del cliente.';
    if (items.some((it) => !it.description.trim() || !(Number(it.quantity) > 0) || !(Number(it.unitPrice) > 0))) {
      return 'Cada ítem necesita descripción, cantidad y precio mayor a 0.';
    }
    return '';
  };

  const notifyResult = (inv: Invoice) => {
    if (inv.status === 'ACEPTADA') ui.toast('success', `${inv.fullNumber} aceptado`, inv.sunatDescription ?? undefined);
    else if (inv.status === 'BORRADOR') ui.toast('info', `${inv.fullNumber} guardado como borrador`, 'No fue enviado a SUNAT.');
    else ui.toast('error', `${inv.fullNumber}: ${STATUS_LABEL[inv.status]}`, inv.sunatDescription ?? undefined);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    setFormError(error);
    if (error) return;
    const body: InvoiceRequest = {
      type,
      customerDocType: docType,
      customerDocNumber: docType === '-' ? null : docNumber.trim(),
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim() || null,
      customerEmail: customerEmail.trim() || null,
      bookingId,
      observations: observations.trim() || null,
      pricesIncludeIgv: includesIgv,
      items: items.map((it) => ({ description: it.description.trim(), quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
    };
    setSaving(true);
    try {
      const inv = await api.createInvoice(auth, body);
      setFormOpen(false);
      setView(inv);
      load(0);
      notifyResult(inv);
    } catch (err) {
      setFormError(describeError(err).message);
      fail(err, false);
    } finally {
      setSaving(false);
    }
  };

  const open = (s: InvoiceSummary) => api.invoice(auth, s.id).then(setView, fail);

  const send = async (id: number) => {
    setBusyId(id);
    try {
      const inv = await api.sendInvoice(auth, id);
      if (view?.id === id) setView(inv);
      load(list?.page ?? 0);
      notifyResult(inv);
    } catch (err) {
      fail(err);
    } finally {
      setBusyId(null);
    }
  };

  const voidInvoice = async (id: number) => {
    const reason = prompt('Motivo de la anulación (por ejemplo: error en el RUC del cliente):');
    if (!reason?.trim()) return;
    setBusyId(id);
    try {
      const inv = await api.voidInvoice(auth, id, reason.trim());
      if (view?.id === id) setView(inv);
      load(list?.page ?? 0);
      ui.toast('success', `${inv.fullNumber} anulado`);
    } catch (err) {
      fail(err);
    } finally {
      setBusyId(null);
    }
  };

  const print = () => {
    document.body.classList.add('printing-invoice');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-invoice');
    }, 50);
  };

  const canSend = (s: { status: InvoiceStatus }) => !!settings?.electronicEnabled && ['BORRADOR', 'ERROR_ENVIO', 'RECHAZADA'].includes(s.status);
  const hint = docHint();

  return (
    <div className="c-invoicing" style={{ display: 'contents' }}>
      {settings && !settings.electronicEnabled && (
        <div className="notice">
          <Icon name="bolt" size={20} />
          <p>
            <strong>Modo borrador.</strong> Los comprobantes se numeran y calculan correctamente, pero{' '}
            <strong>todavía no se envían a SUNAT</strong> y no tienen validez tributaria. Para emitirlos de forma electrónica, conecta tu
            cuenta de Nubefact (variables <code>NUBEFACT_URL</code> y <code>NUBEFACT_TOKEN</code> en Render).
          </p>
        </div>
      )}

      <div className="head">
        <div>
          <h2>Comprobantes</h2>
          {settings && (
            <p className="muted">
              {settings.issuer.businessName} · RUC {settings.issuer.ruc} · Series {settings.seriesFactura} / {settings.seriesBoleta}
            </p>
          )}
        </div>
        <button className="btn btn-primary btn-sm" type="button" onClick={() => { resetForm(); setFormOpen(true); }}>
          <Icon name="ticket" size={16} /> Nuevo comprobante
        </button>
      </div>

      {list && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Número</th><th>Fecha</th><th>Cliente</th><th className="num">Total</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {list.items.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.fullNumber}</strong><small>{s.type === 'FACTURA' ? 'Factura' : 'Boleta'}</small></td>
                    <td>{dmy(s.issueDate)}</td>
                    <td>{s.customerName}{s.customerDocNumber && <small>{s.customerDocNumber}</small>}</td>
                    <td className="num">S/ {money(s.total)}</td>
                    <td><span className={`pill ${s.status}`}>{STATUS_LABEL[s.status]}</span></td>
                    <td className="actions">
                      <button type="button" className="link" onClick={() => open(s)}>Ver</button>
                      {canSend(s) && <button type="button" className="link" disabled={busyId === s.id} onClick={() => send(s.id)}>Enviar a SUNAT</button>}
                      {s.pdfUrl && <a className="link" href={s.pdfUrl} target="_blank" rel="noopener">PDF</a>}
                    </td>
                  </tr>
                ))}
                {list.items.length === 0 && (
                  <tr><td colSpan={6} className="empty">Aún no hay comprobantes. Crea el primero con “Nuevo comprobante”.</td></tr>
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

      {/* ===== Formulario de nuevo comprobante ===== */}
      {formOpen && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="inv-form-title" onClick={() => setFormOpen(false)}>
          <form className="sheet card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <div className="sheet-head">
              <h3 id="inv-form-title">Nuevo comprobante</h3>
              <button type="button" className="x" onClick={() => setFormOpen(false)} aria-label="Cerrar"><Icon name="close" /></button>
            </div>

            <div className="toggle" role="radiogroup" aria-label="Tipo de comprobante">
              <button type="button" role="radio" aria-checked={type === 'BOLETA'} className={type === 'BOLETA' ? 'on' : ''} onClick={() => setType('BOLETA')}>Boleta</button>
              <button type="button" role="radio" aria-checked={type === 'FACTURA'} className={type === 'FACTURA' ? 'on' : ''} onClick={() => setType('FACTURA')}>Factura</button>
            </div>

            <fieldset>
              <legend>Cliente</legend>
              <div className="grid2">
                <label className="lbl">Tipo de documento
                  <select name="docType" value={docType} onChange={(e) => setDocType(e.target.value as DocType)} disabled={type === 'FACTURA'}>
                    <option value="6">RUC</option>
                    {type === 'BOLETA' && (
                      <>
                        <option value="1">DNI</option>
                        <option value="4">Carné de extranjería</option>
                        <option value="-">Sin documento (menos de S/ 700)</option>
                      </>
                    )}
                  </select>
                </label>
                {docType !== '-' && (
                  <label className="lbl">Número
                    <input name="docNumber" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} inputMode="numeric" maxLength={docType === '6' ? 11 : 12} autoComplete="off" />
                    <span className={`hint${hint.startsWith('✓') ? ' ok' : ''}`}>{hint}</span>
                  </label>
                )}
              </div>
              <label className="lbl">{type === 'FACTURA' ? 'Razón social' : 'Nombre completo'}
                <input name="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={200} />
              </label>
              <div className="grid2">
                <label className="lbl">Dirección {type === 'FACTURA' ? 'fiscal' : '(opcional)'}
                  <input name="customerAddress" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} maxLength={250} />
                </label>
                <label className="lbl">Correo (opcional)
                  <input name="customerEmail" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} maxLength={160} />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Detalle</legend>
              <ItemsEditor items={items} onChange={setItems} includesIgv={includesIgv} onIncludesIgvChange={setIncludesIgv} totals={totals} prefix="" />
            </fieldset>

            <label className="lbl">Observaciones (opcional)
              <input name="observations" value={observations} onChange={(e) => setObservations(e.target.value)} maxLength={500} />
            </label>

            {formError && <p className="form-error" role="alert">{formError}</p>}

            <div className="sheet-foot">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setFormOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent btn-sm" disabled={saving}>
                {saving ? <><span className="spinner"></span> Emitiendo...</> : settings?.electronicEnabled ? 'Emitir y enviar a SUNAT' : 'Guardar borrador'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== Vista / impresión del comprobante ===== */}
      {view && (
        <div className="modal" role="dialog" aria-modal="true" aria-label={`${view.title} ${view.fullNumber}`} onClick={() => setView(null)}>
          <div className="viewer" onClick={(e) => e.stopPropagation()}>
            <div className="viewer-bar">
              <span className={`pill ${view.status}`}>{STATUS_LABEL[view.status]}</span>
              <div className="bar-actions">
                {view.pdfUrl && <a className="btn btn-outline btn-sm" href={view.pdfUrl} target="_blank" rel="noopener"><Icon name="download" size={16} /> PDF oficial</a>}
                {canSend(view) && <button className="btn btn-primary btn-sm" type="button" disabled={busyId === view.id} onClick={() => send(view.id)}>Enviar a SUNAT</button>}
                <button className="btn btn-outline btn-sm" type="button" onClick={print}><Icon name="download" size={16} /> Imprimir / PDF</button>
                {view.status !== 'ANULADA' && (
                  <button className="btn btn-outline btn-sm danger" type="button" disabled={busyId === view.id} onClick={() => voidInvoice(view.id)}>Anular</button>
                )}
                <button type="button" className="x" onClick={() => setView(null)} aria-label="Cerrar"><Icon name="close" /></button>
              </div>
            </div>
            {view.sunatDescription && <p className="sunat">{view.sunatDescription}</p>}

            <article className="paper invoice-print">
              {(view.status === 'BORRADOR' || view.status === 'ANULADA') && (
                <div className="watermark">{view.status === 'ANULADA' ? 'ANULADO' : 'BORRADOR – NO VÁLIDO ANTE SUNAT'}</div>
              )}
              <header className="p-head">
                <div className="issuer">
                  <img src="/images/logo.jpg" alt="" width={64} height={64} />
                  <div>
                    <strong>{view.issuer.businessName}</strong>
                    <span>{view.issuer.address}</span>
                    <span>Tel. {business.phoneDisplay} · {business.email}</span>
                  </div>
                </div>
                <div className="box">
                  <span>R.U.C. {view.issuer.ruc}</span>
                  <strong>{view.title}</strong>
                  <span>{view.fullNumber}</span>
                </div>
              </header>

              <section className="p-client">
                <div><span>Fecha de emisión:</span> {dmy(view.issueDate)}</div>
                <div><span>Moneda:</span> Soles (PEN)</div>
                <div><span>{view.type === 'FACTURA' ? 'Razón social' : 'Cliente'}:</span> {view.customerName}</div>
                <div><span>{DOC_LABEL[view.customerDocType] ?? view.customerDocType}:</span> {view.customerDocNumber ?? '-'}</div>
                {view.customerAddress && <div className="wide"><span>Dirección:</span> {view.customerAddress}</div>}
              </section>

              <table className="p-items">
                <thead><tr><th>Cant.</th><th>Unidad</th><th>Descripción</th><th className="num">V. unit. (sin IGV)</th><th className="num">Valor venta</th></tr></thead>
                <tbody>
                  {view.items.map((it) => (
                    <tr key={it.lineNo}>
                      <td>{qty(it.quantity)}</td>
                      <td>Servicio</td>
                      <td>{it.description}</td>
                      <td className="num">{money(it.unitValue)}</td>
                      <td className="num">{money(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-foot">
                <div className="words">
                  <p>{view.totalInWords}</p>
                  {view.observations && <p className="obs">Obs.: {view.observations}</p>}
                  {view.hash && <p className="obs">Código hash: {view.hash}</p>}
                  <p className="legal">
                    Representación impresa de la {view.title.toLowerCase()}.
                    {view.status === 'ACEPTADA' && ' Consulte su validez en www.sunat.gob.pe'}
                  </p>
                </div>
                <dl>
                  <div><dt>Op. gravada</dt><dd>S/ {money(view.subtotal)}</dd></div>
                  <div><dt>IGV 18 %</dt><dd>S/ {money(view.igv)}</dd></div>
                  <div className="grand"><dt>Importe total</dt><dd>S/ {money(view.total)}</dd></div>
                </dl>
              </div>
            </article>
          </div>
        </div>
      )}
    </div>
  );
}
