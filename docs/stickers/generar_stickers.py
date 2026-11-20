"""
Stickers de agradecimiento para WhatsApp de AIRCONSOLUTION SERVICES SAC.

Cada sticker: 512 × 512 px, fondo transparente, WebP de menos de 100 KB (requisito de WhatsApp),
con el logo de la empresa y un aire acondicionado sonriente como personaje.

Uso:  python3 docs/stickers/generar_stickers.py <logo-transparente.png> <carpeta-salida>
Requiere Node con Playwright (Chromium) para dibujar y Pillow para convertir a WebP.
"""
import base64
import io
import json
import pathlib
import subprocess
import sys
import zipfile

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
FONTS = ROOT / "frontend/node_modules/@fontsource"
logo_path = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)


def b64(p: pathlib.Path) -> str:
    return base64.b64encode(p.read_bytes()).decode()


LOGO = f"data:image/png;base64,{b64(logo_path)}"
FONT = "".join(
    f"@font-face{{font-family:'Poppins';font-weight:{w};src:url(data:font/woff2;base64,"
    f"{b64(FONTS / 'poppins/files' / f'poppins-latin-{w}-normal.woff2')}) format('woff2');}}"
    for w in (600, 800)
)

# ---------- Dibujitos (SVG) ----------
NAVY, BLUE, SKY, ORANGE, PINK = "#0d1b2e", "#1e88e5", "#5fb4ff", "#f5821f", "#ff8fab"


def ac(mood="smile", x=0, y=0, s=1.0):
    """Aire acondicionado split con carita. mood: smile | wink | happy."""
    eyes = {
        "smile": '<circle cx="62" cy="40" r="7" fill="#0d1b2e"/><circle cx="118" cy="40" r="7" fill="#0d1b2e"/>'
                 '<circle cx="64" cy="37" r="2.4" fill="#fff"/><circle cx="120" cy="37" r="2.4" fill="#fff"/>',
        "wink": '<circle cx="62" cy="40" r="7" fill="#0d1b2e"/><circle cx="64" cy="37" r="2.4" fill="#fff"/>'
                '<path d="M110 41 q8 -8 16 0" stroke="#0d1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>',
        "happy": '<path d="M54 42 q8 -10 16 0" stroke="#0d1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>'
                 '<path d="M110 42 q8 -10 16 0" stroke="#0d1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>',
    }[mood]
    return f"""<g transform="translate({x},{y}) scale({s})">
  <rect x="0" y="0" width="180" height="92" rx="26" fill="#fff" stroke="{NAVY}" stroke-width="6"/>
  <rect x="14" y="66" width="152" height="14" rx="7" fill="#dceeff" stroke="{NAVY}" stroke-width="4"/>
  <line x1="30" y1="73" x2="150" y2="73" stroke="{BLUE}" stroke-width="3" stroke-linecap="round" stroke-dasharray="10 8"/>
  <circle cx="160" cy="20" r="5" fill="#3ddc84"/>
  {eyes}
  <ellipse cx="44" cy="54" rx="9" ry="5.5" fill="{PINK}" opacity=".75"/>
  <ellipse cx="136" cy="54" rx="9" ry="5.5" fill="{PINK}" opacity=".75"/>
  <path d="M78 50 q12 13 24 0" stroke="#0d1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>
  <g stroke="{SKY}" stroke-width="6" fill="none" stroke-linecap="round">
    <path d="M45 102 q-8 14 0 28"/><path d="M90 102 q-8 14 0 28"/><path d="M135 102 q-8 14 0 28"/>
  </g>
</g>"""


def heart(x, y, s=1.0, c="#ff4d6d"):
    return (f'<path transform="translate({x},{y}) scale({s})" d="M0 -8 C-10 -24 -34 -12 -24 8 L0 30 L24 8 '
            f'C34 -12 10 -24 0 -8Z" fill="{c}" stroke="#fff" stroke-width="4"/>')


def sparkle(x, y, s=1.0, c=ORANGE):
    return (f'<path transform="translate({x},{y}) scale({s})" d="M0 -22 C3 -6 6 -3 22 0 C6 3 3 6 0 22 '
            f'C-3 6 -6 3 -22 0 C-6 -3 -3 -6 0 -22Z" fill="{c}"/>')


def snow(x, y, s=1.0, c=SKY):
    arms = "".join(
        f'<g transform="rotate({a})"><line x1="0" y1="0" x2="0" y2="-20"/><line x1="0" y1="-12" x2="-6" y2="-18"/>'
        f'<line x1="0" y1="-12" x2="6" y2="-18"/></g>' for a in range(0, 360, 60))
    return (f'<g transform="translate({x},{y}) scale({s})" stroke="{c}" stroke-width="4" '
            f'stroke-linecap="round" fill="none">{arms}</g>')


def star(x, y, s=1.0, c="#ffc93c"):
    return (f'<path transform="translate({x},{y}) scale({s})" d="M0 -24 L7 -8 L24 -7 L11 4 L15 21 L0 12 '
            f'L-15 21 L-11 4 L-24 -7 L-7 -8Z" fill="{c}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>')


def wrench(x, y, s=1.0):
    """Llave de boca: mango y cabeza circular con la boca abierta."""
    return (f'<g transform="translate({x},{y}) scale({s}) rotate(40)">'
            f'<rect x="-7" y="0" width="14" height="62" rx="7" fill="{ORANGE}" stroke="{NAVY}" stroke-width="4"/>'
            f'<circle cx="0" cy="-6" r="20" fill="{ORANGE}" stroke="{NAVY}" stroke-width="4"/>'
            f'<rect x="-7" y="-30" width="14" height="22" rx="3" fill="#fff" stroke="{NAVY}" stroke-width="4"/>'
            f'<circle cx="0" cy="48" r="4" fill="#fff"/></g>')


def check(x, y, s=1.0):
    return (f'<g transform="translate({x},{y}) scale({s})"><circle r="26" fill="#2bb673" stroke="#fff" stroke-width="5"/>'
            f'<path d="M-12 0 l8 9 l16 -18" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" '
            f'stroke-linejoin="round"/></g>')


def bag(x, y, s=1.0):
    return (f'<g transform="translate({x},{y}) scale({s})"><path d="M-12 -14 a12 12 0 0 1 24 0" stroke="{NAVY}" '
            f'stroke-width="5" fill="none"/><rect x="-24" y="-14" width="48" height="44" rx="9" fill="{ORANGE}" '
            f'stroke="{NAVY}" stroke-width="5"/>{heart(0, 4, .45, "#fff")}</g>')


def sun(x, y, s=1.0):
    rays = "".join(f'<line transform="rotate({a})" x1="0" y1="-30" x2="0" y2="-40"/>' for a in range(0, 360, 45))
    return (f'<g transform="translate({x},{y}) scale({s})"><g stroke="#ffb703" stroke-width="5" stroke-linecap="round">'
            f'{rays}</g><circle r="22" fill="#ffc93c"/><path d="M-8 4 q8 8 16 0" stroke="{NAVY}" stroke-width="3.5" '
            f'fill="none" stroke-linecap="round"/><circle cx="-7" cy="-4" r="2.6" fill="{NAVY}"/>'
            f'<circle cx="7" cy="-4" r="2.6" fill="{NAVY}"/></g>')


def van(x, y, s=1.0):
    return (f'<g transform="translate({x},{y}) scale({s})"><rect x="-56" y="-30" width="76" height="44" rx="8" '
            f'fill="#fff" stroke="{NAVY}" stroke-width="5"/><path d="M20 -18 h22 l16 18 v14 h-38Z" fill="{BLUE}" '
            f'stroke="{NAVY}" stroke-width="5" stroke-linejoin="round"/><rect x="28" y="-12" width="14" height="10" '
            f'rx="2" fill="#dceeff"/><circle cx="-34" cy="16" r="10" fill="{NAVY}"/><circle cx="34" cy="16" r="10" '
            f'fill="{NAVY}"/><circle cx="-34" cy="16" r="4" fill="#fff"/><circle cx="34" cy="16" r="4" fill="#fff"/>'
            f'{snow(-18, -8, .55, BLUE)}<g stroke="{SKY}" stroke-width="4" stroke-linecap="round">'
            f'<line x1="-84" y1="-14" x2="-66" y2="-14"/><line x1="-92" y1="0" x2="-66" y2="0"/></g></g>')


# Cada sticker: texto (línea 1, línea 2 destacada), colores del fondo y dibujitos.
STICKERS = [
    ("gracias-por-su-compra", "¡Gracias por", "su compra!", ("#e8f3ff", "#fff1e3"),
     ac("happy", 148, 134, 1.2) + bag(418, 205, 1.1) + heart(86, 170, .8) + sparkle(420, 130, .8) + snow(76, 250, .9)),
    ("gracias-por-su-instalacion", "¡Gracias por", "su instalación!", ("#e8f3ff", "#e9fbf2"),
     ac("wink", 148, 134, 1.2) + wrench(420, 190, 1.0) + sparkle(84, 160, .9) + snow(78, 255, .9) + star(420, 290, .7)),
    ("gracias-por-su-preferencia", "¡Gracias por", "su preferencia!", ("#fff0f4", "#e8f3ff"),
     ac("happy", 148, 134, 1.2) + heart(81, 175, 1.0) + heart(420, 160, .8, "#ff8fab") + heart(420, 265, .6)
     + sparkle(96, 270, .7)),
    ("gracias-por-confiar", "¡Gracias por", "confiar en nosotros!", ("#fff7e0", "#e8f3ff"),
     ac("smile", 148, 134, 1.2) + star(84, 175, 1.1) + star(420, 165, .9) + sparkle(420, 270, .7) + heart(81, 270, .55)),
    ("equipo-instalado", "¡Equipo", "instalado!", ("#e9fbf2", "#e8f3ff"),
     ac("happy", 148, 134, 1.2) + check(420, 175, .95) + snow(78, 180, 1.0) + snow(86, 268, .7) + sparkle(420, 275, .7)),
    ("mantenimiento-listo", "¡Mantenimiento", "listo!", ("#e8f3ff", "#f1ecff"),
     ac("wink", 148, 134, 1.2) + sparkle(78, 170, 1.1, SKY) + sparkle(420, 160, .9) + sparkle(420, 260, .6, SKY)
     + check(84, 268, .7)),
    ("vamos-en-camino", "¡Vamos", "en camino!", ("#e8f3ff", "#fff1e3"),
     van(256, 215, 1.75) + sparkle(420, 140, .7) + snow(76, 140, .8)),
    ("disfrute-el-fresquito", "¡Disfrute", "el fresquito!", ("#e3f6ff", "#fff8e1"),
     ac("happy", 148, 134, 1.2) + sun(418, 172, .8) + snow(76, 170, 1.0) + snow(420, 275, .7) + snow(84, 270, .7)),
]


def sticker_html(slug, l1, l2, bg, art):
    long = len(l2) > 15
    return f"""<div class="st" id="{slug}">
  <div class="card" style="background:linear-gradient(160deg,{bg[0]} 0%,#ffffff 55%,{bg[1]} 100%)">
    <svg class="art" viewBox="0 0 512 330" width="512" height="330">{art}</svg>
    <div class="txt"><span class="l1">{l1}</span><span class="l2{' long' if long else ''}">{l2}</span></div>
    <div class="brand">AIRCON<b>SOLUTION</b></div>
  </div>
  <div class="logo"><img src="{LOGO}" alt=""></div>
</div>"""


HTML = f"""<!doctype html><html><head><meta charset="utf-8"><style>
{FONT}
html,body{{margin:0;background:transparent}}
.st{{position:relative;width:512px;height:512px;margin:0 0 8px}}
.card{{position:absolute;inset:22px;border-radius:64px;border:11px solid #fff;
  box-shadow:0 0 0 3px rgba(13,27,46,.10), 0 10px 18px rgba(13,27,46,.22);overflow:hidden}}
.art{{position:absolute;left:-11px;top:-30px}}
.txt{{position:absolute;left:0;right:0;bottom:66px;text-align:center;font-family:'Poppins';line-height:1.02}}
.l1{{display:block;font-weight:800;font-size:38px;color:{NAVY}}}
.l2{{display:block;font-weight:800;font-size:46px;color:{ORANGE};
  text-shadow:0 3px 0 #fff, 0 -2px 0 #fff, 2px 0 0 #fff, -2px 0 0 #fff}}
.l2.long{{font-size:37px}}
.brand{{position:absolute;left:0;right:0;bottom:24px;text-align:center;font-family:'Poppins';font-weight:800;
  font-size:19px;letter-spacing:2px;color:{NAVY}}}
.brand b{{color:{ORANGE}}}
.logo{{position:absolute;left:8px;top:8px;width:104px;height:104px;border-radius:50%;background:#fff;
  box-shadow:0 4px 10px rgba(13,27,46,.25);display:grid;place-items:center}}
.logo img{{width:86px}}
</style></head><body>
{''.join(sticker_html(*s) for s in STICKERS)}
</body></html>"""

html_path = out / "stickers.html"
html_path.write_text(HTML, encoding="utf-8")

# Dibuja cada sticker con fondo transparente (Chromium vía Node).
script = out / "_render.cjs"
script.write_text("""
const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
(async () => {
  const [html, dir, ids] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  await p.goto(pathToFileURL(html).href);
  await p.evaluate(() => document.fonts.ready);
  for (const id of JSON.parse(ids)) {
    await (await p.$('#' + id)).screenshot({ path: `${dir}/${id}.png`, omitBackground: true });
  }
  await b.close();
})();
""")
ids = [s[0] for s in STICKERS]
subprocess.run(["node", str(script), str(html_path), str(out), json.dumps(ids)], check=True)
script.unlink()
html_path.unlink()

# WebP para WhatsApp (< 100 KB) e ícono de la bandeja del paquete (96 × 96).
for slug in ids:
    png = out / f"{slug}.png"
    im = Image.open(png).convert("RGBA").resize((512, 512))
    for q in (90, 82, 74, 66):
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() < 100_000:
            break
    (out / f"{slug}.webp").write_bytes(buf.getvalue())
    print(f"{slug}: {buf.tell() // 1024} KB")

tray = Image.open(logo_path).convert("RGBA")
tray.thumbnail((96, 96), Image.LANCZOS)
canvas = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
canvas.alpha_composite(tray, ((96 - tray.width) // 2, (96 - tray.height) // 2))
canvas.save(out / "icono-paquete-96.png")

with zipfile.ZipFile(out / "stickers-airconsolution.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for slug in ids:
        z.write(out / f"{slug}.png", f"png/{slug}.png")
        z.write(out / f"{slug}.webp", f"whatsapp-webp/{slug}.webp")
    z.write(out / "icono-paquete-96.png", "icono-paquete-96.png")
print("listo")
