"""
Certificado de mantenimiento de aire acondicionado de AIRCONSOLUTION SERVICES SAC (A4, PDF con sello de agua).

Uso:  python3 docs/certificado/generar_certificado.py <logo-transparente.png> <carpeta-salida> <datos.json>

datos.json:
{
  "archivo": "certificado-cliente", "numero": "CERT-2026-0001",
  "fecha_emision": "2026-11-24", "fecha_servicio": "2026-11-23", "proximo_meses": 6,  (0 u omitido: sin próximo mantenimiento)
  "cliente": {"nombre": "...", "ruc": "...", "direccion": "..."},
  "equipos": [["Ubicación", "Marca", "Tipo", "Capacidad"], ...],   (o "cantidad_equipos": 2 si no hay detalle)
  "trabajos": ["Limpieza de filtros", ...],
  "comprobante": "Factura electrónica E001-3",
  "firmante": "Clever Molina Pardo", "cargo": "Gerente",
  "firma_png": "/ruta/firma.png"   (opcional: firma escaneada con fondo transparente)
}
Requiere Node con Playwright (usa ../cotizacion/a-pdf.cjs).
"""
import base64
import datetime as dt
import html
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
FONTS = ROOT / "frontend/node_modules/@fontsource"
logo_path, out_dir, datos = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3])
out_dir.mkdir(parents=True, exist_ok=True)
D = json.loads(datos.read_text(encoding="utf-8"))
E = html.escape


def b64(p):
    return base64.b64encode(pathlib.Path(p).read_bytes()).decode()


def font(family, w):
    f = FONTS / family / "files" / f"{family}-latin-{w}-normal.woff2"
    return (f"@font-face{{font-family:'{family.capitalize()}';font-weight:{w};"
            f"src:url(data:font/woff2;base64,{b64(f)}) format('woff2');}}")


MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre",
         "octubre", "noviembre", "diciembre"]


def larga(d):
    return f"{d.day} de {MESES[d.month - 1]} de {d.year}"


def mas_meses(d, n):
    m = d.month - 1 + n
    y, m = d.year + m // 12, m % 12 + 1
    dias = [31, 29 if y % 4 == 0 and (y % 100 or y % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    return dt.date(y, m, min(d.day, dias[m - 1]))


LOGO = f"data:image/png;base64,{b64(logo_path)}"
FONT_CSS = "".join([font("inter", w) for w in (400, 500, 600, 700)] + [font("poppins", w) for w in (600, 700, 800)])
emision = dt.date.fromisoformat(D["fecha_emision"])
servicio = dt.date.fromisoformat(D["fecha_servicio"])
MESES_PROX = int(D.get("proximo_meses") or 0)  # 0 o ausente: no se muestra el próximo mantenimiento
proximo = mas_meses(servicio, MESES_PROX) if MESES_PROX else None
C = D["cliente"]
NOMBRES = ["", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"]
n_eq = len(D["equipos"]) if D.get("equipos") else int(D["cantidad_equipos"])
n_txt = f"{NOMBRES[n_eq]} ({n_eq:02d})" if n_eq <= 10 else str(n_eq)
eq_txt = "equipo" if n_eq == 1 else "equipos"

if D.get("equipos"):
    filas = "".join(f"<tr><td class='n'>{i:02d}</td>" + "".join(f"<td>{E(str(x))}</td>" for x in e) + "</tr>"
                    for i, e in enumerate(D["equipos"], 1))
    equipos = (f"<table><thead><tr><th>N.°</th><th>Ubicación</th><th>Marca</th><th>Tipo</th><th>Capacidad</th></tr></thead>"
               f"<tbody>{filas}</tbody></table>")
else:
    equipos = ""

trabajos = "".join(f"<li>{E(t)}</li>" for t in D["trabajos"])
PROX = (f'<div class="box next"><div class="k">Próximo mantenimiento</div><div class="v">{MESES[proximo.month - 1].capitalize()} de {proximo.year}</div>'
        f'<div class="s">Recomendado cada {MESES_PROX} meses</div></div>') if proximo else ""
FIRMA = (f'<img class="firma" src="data:image/png;base64,{b64(D["firma_png"])}" alt="Firma">'
         if D.get("firma_png") else "")
dir_cli = f"<dt>Dirección</dt><dd>{E(C['direccion'])}</dd>" if C.get("direccion") else ""

HTML = f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Certificado {E(D["numero"])} · AIRCONSOLUTION SERVICES SAC</title>
<style>
{FONT_CSS}
@page {{ size: A4; margin: 0; }}
:root {{ --navy:#0d1b2e; --navy2:#152a45; --blue:#1e88e5; --orange:#f5821f; --ink:#1d2733; --muted:#5d6b7a; --line:#e3e8ef; --green:#1e8f55; }}
* {{ box-sizing:border-box; margin:0; padding:0; }}
body {{ font-family:'Inter',sans-serif; color:var(--ink); font-size:10pt; line-height:1.5; -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
.page {{ position:relative; width:210mm; height:297mm; overflow:hidden; display:flex; flex-direction:column; }}
.wm {{ position:absolute; inset:0; display:grid; place-items:center; z-index:0; }}
.wm img {{ width:150mm; opacity:.07; transform:rotate(-12deg); }}
.page > *:not(.wm):not(.frame) {{ position:relative; z-index:1; }}
.frame {{ position:absolute; inset:6mm; border:1.2mm solid var(--navy); border-radius:4mm; z-index:2; pointer-events:none; }}
.frame::after {{ content:''; position:absolute; inset:1.6mm; border:.35mm solid var(--orange); border-radius:2.6mm; }}
header {{ margin:6mm 6mm 0; border-radius:4mm 4mm 0 0; background:linear-gradient(120deg,var(--navy),var(--navy2) 62%,#1b3d66);
  color:#fff; padding:8mm 12mm 7mm; display:flex; align-items:center; gap:5mm; }}
header::after {{ content:''; position:absolute; left:0; right:0; bottom:-2mm; height:2mm; background:linear-gradient(90deg,var(--blue),var(--orange)); }}
.mark {{ width:24mm; height:24mm; border-radius:50%; background:#fff; display:grid; place-items:center; flex:none; box-shadow:0 0 0 1.2mm rgba(255,255,255,.12); }}
.mark img {{ width:20mm; }}
.brand h1 {{ font-family:'Poppins'; font-weight:800; font-size:17pt; line-height:1.05; }}
.brand h1 span {{ color:var(--orange); }}
.brand .tag {{ font-family:'Poppins'; font-weight:600; font-size:7pt; letter-spacing:2.6px; color:#9fc4ee; margin-top:1.4mm; }}
.brand .ruc {{ font-size:8pt; color:#cfd9e6; margin-top:1.8mm; }}
main {{ padding:6mm 18mm 0; flex:1; display:flex; flex-direction:column; }}
.title {{ text-align:center; }}
.title .k {{ font-family:'Poppins'; font-weight:600; font-size:9pt; letter-spacing:5px; color:var(--blue); }}
.title h2 {{ font-family:'Poppins'; font-weight:800; font-size:25pt; letter-spacing:2px; color:var(--navy); line-height:1.15; margin-top:1mm; }}
.title h2 span {{ color:var(--orange); }}
.title .num {{ display:inline-block; margin-top:2.5mm; background:var(--orange); color:#fff; font-family:'Poppins'; font-weight:700; font-size:9.5pt; padding:1.2mm 4.5mm; border-radius:10mm; }}
.lead {{ margin-top:4.5mm; font-size:10.6pt; text-align:justify; }}
.lead b {{ color:var(--navy); }}
.card {{ margin-top:3.6mm; border:1px solid var(--line); border-radius:3mm; padding:3.6mm 5mm; background:rgba(255,255,255,.85); }}
.card h3 {{ font-family:'Poppins'; font-weight:700; font-size:8pt; letter-spacing:1.6px; color:var(--blue); text-transform:uppercase;
  margin-bottom:2.4mm; display:flex; align-items:center; gap:2mm; }}
.card h3::before {{ content:''; width:5mm; height:.8mm; border-radius:1mm; background:linear-gradient(90deg,var(--blue),var(--orange)); }}
.kv {{ display:grid; grid-template-columns:34mm 1fr; gap:.8mm 3mm; font-size:9.4pt; }}
.kv dt {{ color:var(--muted); }} .kv dd {{ font-weight:600; }}
table {{ width:100%; border-collapse:collapse; font-size:9pt; }}
th {{ background:var(--navy); color:#fff; font-family:'Poppins'; font-weight:600; font-size:7.8pt; text-align:left; padding:1.6mm 2.4mm; }}
td {{ padding:1.6mm 2.4mm; border-bottom:1px solid var(--line); }} td.n {{ color:var(--muted); }}
ul {{ list-style:none; columns:2; column-gap:6mm; font-size:9.3pt; }}
li {{ break-inside:avoid; padding-left:5.5mm; position:relative; margin-bottom:1.1mm; }}
li::before {{ content:'✔'; position:absolute; left:0; color:var(--green); font-weight:700; }}
.result {{ margin-top:3.6mm; display:grid; grid-template-columns:1fr 1fr; gap:4mm; }}
.box {{ border-radius:3mm; padding:3.4mm 5mm; }}
.result.solo {{ grid-template-columns:1fr; }}
.ok {{ background:#eaf8f0; border:1px solid #bfe6cf; }} .next {{ background:#fff4e5; border:1px solid #fbd9b0; }}
.box .k {{ font-family:'Poppins'; font-weight:700; font-size:7.6pt; letter-spacing:1.4px; text-transform:uppercase; }}
.ok .k {{ color:var(--green); }} .next .k {{ color:#c2610a; }}
.box .v {{ font-family:'Poppins'; font-weight:700; font-size:11.5pt; color:var(--navy); margin-top:.6mm; }}
.box .s {{ font-size:8.4pt; color:var(--muted); }}
.place {{ margin-top:auto; padding-top:4mm; text-align:right; font-size:9.8pt; }}
.sign {{ margin:{'1mm' if FIRMA else '15mm'} 0 0 auto; width:78mm; text-align:center; }}
.sign .firma {{ display:block; height:24mm; margin:0 auto -1.5mm; }}
.sign .line {{ border-top:.4mm solid var(--navy); padding-top:2mm; }}
.sign b {{ font-family:'Poppins'; font-size:11pt; color:var(--navy); display:block; }}
.sign span {{ font-size:9pt; color:var(--muted); display:block; }}
footer {{ margin:5mm 6mm 6mm; border-radius:0 0 4mm 4mm; background:var(--navy); color:#cfd9e6; font-size:8pt; padding:3.6mm 12mm;
  display:flex; justify-content:space-between; gap:4mm; }}
footer b {{ color:#fff; }}
</style></head><body><div class="page">
<div class="wm"><img src="{LOGO}" alt=""></div><div class="frame"></div>
<header><div class="mark"><img src="{LOGO}" alt=""></div><div class="brand">
  <h1>AIRCON<span>SOLUTION</span> SERVICES S.A.C.</h1><div class="tag">AIRE ACONDICIONADO EN LIMA</div>
  <div class="ruc">RUC 20616633733 · Calle 20 Mz. 28 Lt. 17, A.H. Laura Caller, Los Olivos, Lima</div></div></header>
<main>
  <div class="title"><div class="k">AIRCONSOLUTION SERVICES S.A.C. OTORGA EL PRESENTE</div>
    <h2>CERTIFICADO DE <span>MANTENIMIENTO</span></h2><div class="num">N.° {E(D["numero"])}</div></div>
  <p class="lead">Certificamos que el <b>{larga(servicio)}</b> se realizó el <b>mantenimiento preventivo de {n_txt} {eq_txt} de aire
    acondicionado</b> de propiedad de <b>{E(C["nombre"])}</b>, con RUC <b>{E(C["ruc"])}</b>, ejecutado por personal técnico
    calificado de nuestra empresa, quedando los equipos <b>operativos y en buen estado de funcionamiento</b>.</p>
  <div class="card"><h3>Datos del servicio</h3><dl class="kv">
    <dt>Cliente</dt><dd>{E(C["nombre"])}</dd><dt>RUC</dt><dd>{E(C["ruc"])}</dd>{dir_cli}
    <dt>Servicio</dt><dd>Mantenimiento preventivo de {n_txt} {eq_txt} de aire acondicionado</dd>
    <dt>Fecha del servicio</dt><dd>{servicio:%d/%m/%Y}</dd>
    {f"<dt>Comprobante</dt><dd>{E(D['comprobante'])}</dd>" if D.get("comprobante") else ""}</dl></div>
  {f'<div class="card"><h3>Equipos atendidos</h3>{equipos}</div>' if equipos else ""}
  <div class="card"><h3>Trabajos realizados</h3><ul>{trabajos}</ul></div>
  <div class="result{'' if proximo else ' solo'}">
    <div class="box ok"><div class="k">Estado final</div><div class="v">✔ Equipos operativos</div><div class="s">Funcionamiento verificado al término del servicio</div></div>
    {PROX}
  </div>
  <p class="place">Lima, {larga(emision)}</p>
  <div class="sign">{FIRMA}<div class="line"><b>{E(D["firmante"])}</b><span>{E(D["cargo"])}</span><span>AIRCONSOLUTION SERVICES S.A.C.</span></div></div>
</main>
<footer><span><b>Teléfonos:</b> 985 899 731 · 990 073 634</span><span><b>Correo:</b> aircon82@gmail.com</span><span><b>Web:</b> airconsolutionsac.com</span></footer>
</div></body></html>"""

h = out_dir / f"{D['archivo']}.html"
h.write_text(HTML, encoding="utf-8")
subprocess.run(["node", str(ROOT / "docs/cotizacion/a-pdf.cjs"), str(h), str(out_dir)], check=True)
print("ok", out_dir / f"{D['archivo']}.pdf")
