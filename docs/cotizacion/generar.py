"""
Genera la plantilla de cotización de AIRCONSOLUTION SERVICES SAC (A4) en HTML y PDF.

Uso:  python3 docs/cotizacion/generar.py <logo-transparente.png> <carpeta-salida> [datos.json]

Sin datos.json se genera la plantilla de ejemplo. Con datos.json (ver ejemplo-datos.json) se genera
la cotización real; el total en letras se calcula solo.
Requiere Node con Playwright y Chromium (a-pdf.cjs convierte el HTML a PDF).
"""
import base64
import datetime as dt
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
FONTS = ROOT / "frontend/node_modules/@fontsource"

logo_path = pathlib.Path(sys.argv[1])
out_dir = pathlib.Path(sys.argv[2])
out_dir.mkdir(parents=True, exist_ok=True)


def b64(path: pathlib.Path) -> str:
    return base64.b64encode(path.read_bytes()).decode()


def font(family: str, weight: int) -> str:
    f = FONTS / family / "files" / f"{family}-latin-{weight}-normal.woff2"
    name = family.capitalize()
    return (
        f"@font-face{{font-family:'{name}';font-weight:{weight};font-style:normal;"
        f"src:url(data:font/woff2;base64,{b64(f)}) format('woff2');}}"
    )


LOGO = f"data:image/png;base64,{b64(logo_path)}"
FONT_CSS = "".join(
    [font("inter", w) for w in (400, 500, 600, 700)] + [font("poppins", w) for w in (600, 700, 800)]
)

# --- Datos: los de ejemplo, o los del archivo JSON si se indica ---
D = {
    "archivo": "cotizacion-airconsolution",
    "numero": "COT-2026-0001",
    "fecha": "2026-11-20",
    "validez_dias": 15,
    "ruc_empresa": "20616633733",
    "cliente": {"nombre": "EMPRESA CLIENTE S.A.C.", "documento": "20XXXXXXXXX",
                "atencion": "Sr(a). Nombre del contacto", "direccion": "Av. Ejemplo 123, Lima",
                "telefono": "9XX XXX XXX"},
    "items": [
        ["Suministro e instalación de equipo split inverter 12\u00a0000\u00a0BTU",
         "Incluye 3 m de tubería de cobre aislada, soporte para condensadora, desagüe y puesta en marcha.",
         2, "und", 1850.00],
        ["Mantenimiento preventivo de equipo split (12\u00a0000\u00a0–\u00a024\u00a0000\u00a0BTU)",
         "Lavado de evaporador y condensadora, limpieza de filtros, revisión de presiones y conexiones.",
         4, "und", 120.00],
        ["Instalación de punto eléctrico independiente",
         "Cableado desde tablero con llave termomagnética 2×20 A y canaleta.", 2, "und", 180.00],
    ],
}
if len(sys.argv) > 3:
    D.update(json.loads(pathlib.Path(sys.argv[3]).read_text(encoding="utf-8")))

UNIDADES = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE", "DIEZ",
            "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO",
            "DIECINUEVE", "VEINTE", "VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO",
            "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"]
DECENAS = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
CENTENAS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS",
            "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"]


def _cientos(n: int) -> str:
    if n == 100:
        return "CIEN"
    c, r = divmod(n, 100)
    if r < 30:
        resto = UNIDADES[r]
    else:
        d, u = divmod(r, 10)
        resto = DECENAS[d] + (f" Y {UNIDADES[u]}" if u else "")
    return " ".join(x for x in (CENTENAS[c], resto) if x)


def en_letras(monto: float) -> str:
    """Monto en soles escrito en letras, como en los comprobantes: «… CON 20/100 SOLES»."""
    entero, cent = divmod(round(monto * 100), 100)
    if entero == 0:
        texto = "CERO"
    else:
        millones, resto = divmod(entero, 1_000_000)
        miles, cientos = divmod(resto, 1000)
        partes = []
        if millones:
            partes.append("UN MILLÓN" if millones == 1 else f"{_cientos(millones)} MILLONES")
        if miles:
            partes.append("MIL" if miles == 1 else f"{_cientos(miles)} MIL")
        if cientos:
            partes.append(_cientos(cientos))
        texto = " ".join(partes).replace("VEINTIUNO MIL", "VEINTIÚN MIL").replace("UNO MIL", "UN MIL")
    return f"{texto} CON {cent:02d}/100 SOLES"


ITEMS = [tuple(x) for x in D["items"]]
# Una partida con precio null (p. ej. materiales que se cotizan al instalar) sale como «Por definir»
# y no suma al total.
subtotal = sum(q * p for _, _, q, _, p in ITEMS if p is not None)
# "igv": false → sin IGV (no se muestra ni se suma).
CON_IGV = D.get("igv", True)
igv = round(subtotal * 0.18, 2) if CON_IGV else 0.0
total = round(subtotal + igv, 2)
fecha = dt.date.fromisoformat(D["fecha"])
valida = fecha + dt.timedelta(days=int(D["validez_dias"]))
C = {k: html.escape(str(v)) for k, v in D["cliente"].items()}
E = html.escape


def NB(text: str) -> str:
    """Mantiene juntos los números con espacio de miles y su unidad (p. ej. «12 000 BTU»)."""
    text = re.sub(r"(\d) (\d{3})", "\\1\u00a0\\2", text)
    return re.sub(r"(\d) (BTU|A|m|V)\b", "\\1\u00a0\\2", text)


def money(v: float) -> str:
    return f"S/ {v:,.2f}"


rows = "\n".join(
    f"""<tr>
      <td class="n">{i:02d}</td>
      <td class="desc"><strong>{NB(E(t))}</strong><span>{NB(E(d)).replace(chr(10), "<br>")}</span></td>
      <td class="c">{q if isinstance(q, str) else format(q, "g")}</td><td class="c">{E(u)}</td>
      <td class="r">{money(p) if p is not None else "Por definir"}</td><td class="r b">{money(q * p) if p is not None else "—"}</td>
    </tr>"""
    for i, (t, d, q, u, p) in enumerate(ITEMS, 1)
)

# "compacto": true junta las filas para que una cotización con muchas partidas entre en una sola hoja.
COMPACTO = """
tbody td { padding: 1.2mm 3mm; }
td.desc span { margin-top: 0; font-size: 7.8pt; }
main { gap: 2.6mm; }
.card { padding: 2.6mm 5mm; }
.kv { gap: .3mm 2mm; font-size: 8.4pt; }
.term { padding: 2mm 3mm; line-height: 1.3; }
.sum { margin-top: -1mm; }
""" if D.get("compacto") else ""

HTML = f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Cotización {E(D["numero"])} · AIRCONSOLUTION SERVICES SAC</title>
<style>
{FONT_CSS}
@page {{ size: A4; margin: 0; }}
:root {{
  --navy: #0d1b2e; --navy2: #152a45; --blue: #1e88e5; --sky: #e8f2fd;
  --orange: #f5821f; --orange2: #e06a0a; --ink: #1d2733; --muted: #5d6b7a; --line: #e3e8ef;
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ background: #fff; }}
body {{ font-family: 'Inter', sans-serif; color: var(--ink); font-size: 9.6pt; line-height: 1.45;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
.page {{ position: relative; width: 210mm; height: 297mm; overflow: hidden; display: flex; flex-direction: column; }}

/* Sello de agua: el logo grande y muy tenue en el centro de la hoja */
.watermark {{ position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; z-index: 0; }}
.watermark img {{ width: 150mm; opacity: .075; transform: rotate(-12deg); filter: saturate(.9); }}
.page > *:not(.watermark) {{ position: relative; z-index: 1; }}

/* Cabecera */
header {{ background: linear-gradient(120deg, var(--navy) 0%, var(--navy2) 62%, #1b3d66 100%); color: #fff;
  padding: 9mm 14mm 7.5mm; display: flex; justify-content: space-between; align-items: center; gap: 10mm; }}
header::after {{ content: ''; position: absolute; left: 0; right: 0; bottom: -2.2mm; height: 2.2mm;
  background: linear-gradient(90deg, var(--blue), var(--orange)); }}
.brand {{ display: flex; align-items: center; gap: 5mm; }}
.brand .mark {{ width: 25mm; height: 25mm; border-radius: 50%; background: #fff; display: grid; place-items: center;
  box-shadow: 0 0 0 1.2mm rgba(255,255,255,.12); }}
.brand .mark img {{ width: 21mm; }}
.brand h1 {{ font-family: 'Poppins'; font-weight: 800; font-size: 17pt; letter-spacing: .2px; line-height: 1.05; }}
.brand h1 span {{ color: var(--orange); }}
.brand .tag {{ font-family: 'Poppins'; font-weight: 600; font-size: 7pt; letter-spacing: 2.6px; color: #9fc4ee; margin-top: 1.6mm; }}
.brand .ruc {{ font-size: 8pt; color: #cfd9e6; margin-top: 2mm; }}
.doc {{ text-align: right; }}
.doc .label {{ font-family: 'Poppins'; font-weight: 800; font-size: 22pt; letter-spacing: 3px; line-height: 1; }}
.doc .num {{ display: inline-block; margin-top: 3mm; background: var(--orange); color: #fff; font-family: 'Poppins';
  font-weight: 700; font-size: 10pt; padding: 1.4mm 4mm; border-radius: 10mm; }}
.doc dl {{ margin-top: 3mm; display: grid; grid-template-columns: auto auto; gap: .6mm 3mm; font-size: 8.4pt; color: #d6e2f0; justify-content: end; }}
.doc dt {{ text-align: right; }} .doc dd {{ color: #fff; font-weight: 600; text-align: right; }}

main {{ padding: 7.5mm 14mm 0; flex: 1; display: flex; flex-direction: column; gap: 3.4mm; min-height: 0; }}

/* Datos del cliente y de la empresa */
.parties {{ display: grid; grid-template-columns: 1.25fr 1fr; gap: 5mm; }}
.card {{ border: 1px solid var(--line); border-radius: 3mm; padding: 3.4mm 5mm; background: rgba(255,255,255,.82); }}
.card h2 {{ font-family: 'Poppins'; font-weight: 700; font-size: 8pt; letter-spacing: 1.6px; color: var(--blue);
  text-transform: uppercase; margin-bottom: 2.4mm; display: flex; align-items: center; gap: 2mm; }}
.card h2::before {{ content: ''; width: 5mm; height: .8mm; border-radius: 1mm; background: linear-gradient(90deg, var(--blue), var(--orange)); }}
.card .name {{ font-family: 'Poppins'; font-weight: 700; font-size: 11pt; color: var(--navy); margin-bottom: 1.2mm; }}
.kv {{ display: grid; grid-template-columns: 22mm 1fr; gap: .8mm 2mm; font-size: 8.8pt; }}
.kv dt {{ color: var(--muted); }} .kv dd {{ font-weight: 500; }}

.intro {{ font-size: 9.2pt; color: var(--muted); }}
.intro strong {{ color: var(--ink); }}

/* Tabla de partidas */
table {{ width: 100%; border-collapse: separate; border-spacing: 0; font-size: 9pt; }}
thead th {{ background: var(--navy); color: #fff; font-family: 'Poppins'; font-weight: 600; font-size: 7.8pt;
  letter-spacing: .8px; text-transform: uppercase; padding: 2.4mm 3mm; text-align: left; white-space: nowrap; }}
thead th:first-child {{ border-radius: 2.4mm 0 0 2.4mm; }} thead th:last-child {{ border-radius: 0 2.4mm 2.4mm 0; }}
tbody td {{ padding: 2mm 3mm; border-bottom: 1px solid var(--line); vertical-align: top; background: rgba(255,255,255,.78); }}
tbody tr:nth-child(even) td {{ background: rgba(232,242,253,.55); }}
td.n {{ font-family: 'Poppins'; font-weight: 700; color: var(--orange); width: 9mm; }}
td.desc strong {{ display: block; font-weight: 600; color: var(--navy); }}
td.desc span {{ display: block; color: var(--muted); font-size: 8.2pt; margin-top: .6mm; }}
.c {{ text-align: center; }} .r {{ text-align: right; white-space: nowrap; }} .b {{ font-weight: 700; }}
th.c, th.r {{ text-align: center; }} th.r {{ text-align: right; }}

/* Totales */
.sum {{ display: grid; grid-template-columns: 1fr 72mm; gap: 6mm; align-items: start; }}
.words {{ border-left: 1mm solid var(--orange); background: rgba(254,243,232,.85); border-radius: 0 2mm 2mm 0;
  padding: 3mm 4mm; font-size: 8.6pt; }}
.words b {{ display: block; font-family: 'Poppins'; font-size: 7.4pt; letter-spacing: 1.4px; color: var(--orange2); margin-bottom: .8mm; }}
.totals {{ border: 1px solid var(--line); border-radius: 3mm; overflow: hidden; background: rgba(255,255,255,.88); }}
.totals div {{ display: flex; justify-content: space-between; padding: 2.2mm 4mm; font-size: 9pt; }}
.totals div + div {{ border-top: 1px solid var(--line); }}
.totals .grand {{ background: linear-gradient(110deg, var(--orange) 0%, var(--orange2) 100%); color: #fff;
  font-family: 'Poppins'; font-weight: 700; font-size: 12pt; padding: 3mm 4mm; border: 0; }}

/* Condiciones */
.terms {{ display: grid; grid-template-columns: 1.7fr 1fr 1fr 1fr; gap: 3mm; }}
.term {{ border-radius: 2.6mm; padding: 3mm 3.4mm; background: rgba(232,242,253,.8); }}
.term b {{ display: block; font-family: 'Poppins'; font-weight: 700; font-size: 7.4pt; letter-spacing: 1.2px;
  text-transform: uppercase; color: var(--blue); margin-bottom: .8mm; }}
.term span {{ font-size: 8.4pt; }}

.bottom {{ display: grid; grid-template-columns: 1fr 66mm; gap: 8mm; align-items: end; margin-top: auto; padding-bottom: 4mm; }}
.bank {{ font-size: 8.4pt; color: var(--muted); }}
.bank b {{ color: var(--navy); font-family: 'Poppins'; font-size: 8pt; letter-spacing: 1px; text-transform: uppercase; }}
.bank p {{ margin-top: 1mm; }}
.sign {{ text-align: center; font-size: 8.4pt; }}
.sign .line {{ border-top: 1.2px solid var(--navy); padding-top: 1.6mm; margin-top: 7mm; font-weight: 600; color: var(--navy); }}
.sign span {{ color: var(--muted); }}

footer {{ background: var(--navy); color: #cfd9e6; padding: 4.2mm 14mm; font-size: 8pt;
  display: flex; justify-content: space-between; gap: 4mm; }}
footer b {{ color: #fff; font-weight: 600; }}
footer .web {{ color: var(--orange); font-weight: 700; }}
{COMPACTO}
</style></head>
<body><div class="page">
  <div class="watermark"><img src="{LOGO}" alt=""></div>

  <header>
    <div class="brand">
      <div class="mark"><img src="{LOGO}" alt="Logo AIRCONSOLUTION"></div>
      <div>
        <h1>AIRCON<span>SOLUTION</span><br>SERVICES SAC</h1>
        <div class="tag">AIRE ACONDICIONADO EN LIMA</div>
        <div class="ruc">RUC {E(D["ruc_empresa"])}</div>
      </div>
    </div>
    <div class="doc">
      <div class="label">COTIZACIÓN</div>
      <div class="num">N.° {E(D["numero"])}</div>
      <dl>
        <dt>Fecha de emisión</dt><dd>{fecha:%d/%m/%Y}</dd>
        <dt>Válida hasta</dt><dd>{valida:%d/%m/%Y}</dd>
        <dt>Moneda</dt><dd>Soles (PEN)</dd>
      </dl>
    </div>
  </header>

  <main>
    <section class="parties">
      <div class="card">
        <h2>Cliente</h2>
        <div class="name">{C["nombre"]}</div>
        <dl class="kv">
          {"<dt>RUC / DNI</dt><dd>" + C["documento"] + "</dd>" if C.get("documento") else ""}
          {"" if not C.get("atencion") else "<dt>Atención</dt><dd>" + C["atencion"] + "</dd>"}
          {"<dt>Dirección</dt><dd>" + C["direccion"] + "</dd>" if C.get("direccion") else ""}
          {"<dt>Teléfono</dt><dd>" + C["telefono"] + "</dd>" if C.get("telefono") else ""}
        </dl>
      </div>
      <div class="card">
        <h2>Emitido por</h2>
        <dl class="kv">
          <dt>Dirección</dt><dd>Calle 20 Mz. 28 Lt. 17 A.H. Laura Caller, Los Olivos, Lima</dd>
          <dt>Teléfonos</dt><dd>985 899 731 · 990 073 634</dd>
          <dt>Correo</dt><dd>aircon82@gmail.com</dd>
          <dt>Web</dt><dd>airconsolutionsac.com</dd>
        </dl>
      </div>
    </section>

    <p class="intro">De nuestra consideración: por medio de la presente le hacemos llegar nuestra propuesta
      para los trabajos solicitados.{" <strong>Precios sin IGV; el IGV (18 %) se suma al final.</strong>" if CON_IGV else ""}</p>

    <table>
      <thead><tr>
        <th>N.°</th><th>Descripción</th><th class="c">Cant.</th><th class="c">Und.</th>
        <th class="r">P. unitario</th><th class="r">Importe</th>
      </tr></thead>
      <tbody>
{rows}
      </tbody>
    </table>

    <section class="sum">
      <div class="words"><b>SON</b>{en_letras(total)}</div>
      <div class="totals">
{f"""        <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
        <div><span>IGV (18 %)</span><strong>{money(igv)}</strong></div>""" if CON_IGV else ""}
        <div class="grand"><span>TOTAL</span><span>{money(total)}</span></div>
      </div>
    </section>

    <section class="terms">
      <div class="term"><b>Forma de pago</b><span>{E(D.get("forma_pago", "60 % de adelanto y 40 % al terminar. Venta de equipos: 100 % adelantado"))}</span></div>
      <div class="term"><b>Plazo</b><span>3 días hábiles desde la aprobación</span></div>
      <div class="term"><b>Garantía</b><span>Por escrito, según el trabajo y los repuestos</span></div>
      <div class="term"><b>Validez</b><span>{int(D["validez_dias"])} días calendario desde la emisión</span></div>
    </section>

    <section class="bottom">
      <div class="bank">
        <b>Datos para el pago</b>
        <p>BCP · Cuenta en Soles: <strong>1933184590074</strong></p>
        <p>CCI: <strong>00219300318459007410</strong></p>
        <p>Titular: {E(D.get("titular", "AIRCONSOLUTION SERVICES SAC"))} · RUC {E(D["ruc_empresa"])}</p>
      </div>
      <div class="sign">
        <div class="line">AIRCONSOLUTION SERVICES SAC</div>
        <span>Firma y sello</span>
      </div>
    </section>
  </main>

  <footer>
    <span><b>AIRCONSOLUTION SERVICES SAC</b> · Instalación, mantenimiento y reparación · Emergencias 24/7</span>
    <span class="web">airconsolutionsac.com</span>
  </footer>
</div></body></html>
"""

html_path = out_dir / f"{D['archivo']}.html"
html_path.write_text(HTML, encoding="utf-8")

import subprocess  # noqa: E402

# Convierte a PDF con Chromium (Playwright de Node, ya instalado en el equipo).
subprocess.run(["node", str(pathlib.Path(__file__).with_name("a-pdf.cjs")), str(html_path), str(out_dir)], check=True)

print(f"subtotal {subtotal:.2f} igv {igv:.2f} total {total:.2f}")
