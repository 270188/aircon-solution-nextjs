"""
Miniaturas (portadas) de los videos de AIRCONSOLUTION SERVICES SAC para YouTube, TikTok y Reels.

Genera para cada video:
  - <nombre>-vertical.jpg    1080 × 1920 (Shorts, TikTok, Reels)
  - <nombre>-horizontal.jpg  1280 × 720  (miniatura clásica de YouTube, < 2 MB)

Uso:  python3 docs/video/miniaturas.py <logo.png> <carpeta-salida>
"""
import pathlib
import subprocess
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import motor as m  # noqa: E402

logo_png, out = sys.argv[1], pathlib.Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
LOGO = f"data:image/png;base64,{m.b64(logo_png)}"

CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter';color:#fff;background:#0d1b2e}
.t{position:relative;overflow:hidden;
  background:radial-gradient(circle at 85% 8%,rgba(245,130,31,.55),transparent 42%),
             radial-gradient(circle at 5% 95%,rgba(30,136,229,.6),transparent 50%),linear-gradient(160deg,#0d1b2e,#16365c)}
.v{width:540px;height:960px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 30px 90px}
.h{width:640px;height:360px;display:grid;grid-template-columns:1.15fr .85fr;align-items:center;padding:24px 28px 24px 34px;gap:10px}
.h .txt{text-align:left}
.big{font-family:'Poppins';font-weight:800;line-height:1.02;letter-spacing:-.5px;text-shadow:0 6px 0 rgba(0,0,0,.25)}
.v .big{font-size:66px}
.h .big{font-size:44px}
.o{color:#f5821f} .s{color:#5fb4ff} .y{color:#ffc93c} .r{color:#ff6b6e}
.sub{font-family:'Poppins';font-weight:800;display:inline-block;background:#f5821f;color:#fff;border-radius:16px;transform:rotate(-2deg)}
.v .sub{font-size:30px;padding:12px 22px;margin-top:26px}
.h .sub{font-size:20px;padding:8px 14px;margin-top:14px}
.art{display:grid;place-items:center}
.logo{position:absolute;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 8px 24px rgba(0,0,0,.4)}
.v .logo{left:22px;top:22px;width:96px;height:96px} .v .logo img{width:80px}
.h .logo{right:16px;bottom:14px;width:62px;height:62px} .h .logo img{width:52px}
.bar{position:absolute;left:0;right:0;bottom:0;height:70px;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,.35);font-family:'Poppins';font-weight:800;font-size:22px;letter-spacing:1px}
.bar b{color:#f5821f}
.chip{font-family:'Poppins';font-weight:800;border-radius:14px;padding:10px 16px}
.cnv{background:rgba(255,255,255,.14);border:3px solid rgba(255,255,255,.5)} .inv{background:#1e88e5}
.vs{display:flex;align-items:center;gap:12px;justify-content:center;font-family:'Poppins';font-weight:800}
.five{font-family:'Poppins';font-weight:800;line-height:.9;color:#f5821f;text-shadow:0 10px 30px rgba(245,130,31,.5)}
.emo{display:flex;gap:10px;justify-content:center}
.pill{font-family:'Poppins';font-weight:800;border-radius:14px;background:#1e88e5}
.warn{line-height:1}
.photo{border-radius:20px;overflow:hidden;border:5px solid #fff;box-shadow:0 14px 34px rgba(0,0,0,.5);transform:rotate(3deg)}
.photo img{display:block;width:100%;height:100%;object-fit:cover}
"""

FOTO_INST = m.foto("condensadoras-coldpoint")


def bloques(tipo):
    """Devuelve (texto vertical, arte vertical, texto horizontal, arte horizontal)."""
    if tipo == "verano":
        return (
            '<div class="big">¡PREPÁRATE<br>PARA EL<br><span class="y">VERANO!</span> ☀️</div><div class="sub">Haz esto ANTES del calor</div>',
            f'<div style="margin-bottom:24px">{m.sol_svg(200)}</div>',
            '<div class="big">¡PREPÁRATE<br>PARA EL <span class="y">VERANO!</span></div><div class="sub">Haz esto ANTES del calor ☀️</div>',
            f'{m.sol_svg(150)}<div style="margin-top:-30px">{m.ac_svg("wink", 170)}</div>')
    if tipo == "btu":
        pills = lambda fs, pad: "".join(  # noqa: E731
            f'<div class="pill" style="font-size:{fs}px;padding:{pad};text-align:center">{b}&nbsp;BTU</div>'
            for b in ("12&nbsp;000", "18&nbsp;000", "24&nbsp;000"))
        return (
            '<div class="big">¿CUÁNTOS<br><span class="s">BTU</span><br>NECESITO? 🤔</div><div class="sub">Elígelo bien en 1 minuto</div>',
            f'<div style="margin-bottom:22px">{m.ac_svg("wink", 250)}</div>',
            '<div class="big">¿CUÁNTOS <span class="s">BTU</span><br>NECESITO? 🤔</div><div class="sub">Elígelo bien en 1 minuto</div>',
            f'<div style="display:grid;gap:10px;width:100%">{pills(26, "10px 0")}</div>')
    if tipo == "inverter":
        return (
            '<div class="big">¿INVERTER<br>O <span class="o">CONVEN-<br>CIONAL</span>?</div><div class="sub">¿Cuál ahorra más luz? 💡</div>',
            f'<div class="vs" style="font-size:24px;margin-bottom:26px"><span class="chip cnv">{m.ac_svg("tired", 150)}</span>'
            f'<span class="o" style="font-size:34px">VS</span><span class="chip inv">{m.ac_svg("happy", 150)}</span></div>',
            '<div class="big">¿INVERTER O<br><span class="o">CONVENCIONAL</span>?</div><div class="sub">¿Cuál ahorra más luz? 💡</div>',
            f'<div style="display:grid;gap:8px;justify-items:center"><span class="chip cnv" style="padding:6px 10px">{m.ac_svg("tired", 120)}</span>'
            f'<span class="o" style="font-family:Poppins;font-weight:800;font-size:24px">VS</span>'
            f'<span class="chip inv" style="padding:6px 10px">{m.ac_svg("happy", 120)}</span></div>')
    if tipo == "senales":
        emo = lambda fs: f'<div class="emo" style="font-size:{fs}px">👃💧🥵🔊💡</div>'  # noqa: E731
        return (
            f'<div class="five" style="font-size:210px">5</div><div class="big" style="font-size:52px">SEÑALES<br>de que tu aire<br>necesita <span class="o">ayuda</span> 🆘</div>'
            f'<div style="margin-top:24px">{emo(52)}</div>',
            '',
            '<div class="big"><span class="o">5 SEÑALES</span><br>de que tu aire<br>necesita ayuda 🆘</div><div class="sub">La 5 casi nadie la nota</div>',
            f'<div style="display:grid;justify-items:center;gap:10px">{m.ac_svg("tired", 190)}{emo(34)}</div>')
    if tipo == "instalacion":
        return (
            '<div class="warn" style="font-size:96px;margin-bottom:12px">⚠️</div><div class="big">NO INSTALES<br>CON <span class="r">CUALQUIERA</span></div>'
            '<div class="sub">Lo barato sale caro 💸</div>',
            f'<div class="photo" style="width:300px;height:220px;margin-bottom:30px"><img src="{FOTO_INST}" alt=""></div>',
            '<div class="big">⚠️ NO INSTALES<br>CON <span class="r">CUALQUIERA</span></div><div class="sub">Lo barato sale caro 💸</div>',
            f'<div class="photo" style="width:230px;height:250px"><img src="{FOTO_INST}" alt=""></div>')
    raise ValueError(tipo)


VIDEOS = [("preparate-para-el-verano", "verano"), ("cuantos-btu-necesito", "btu"),
          ("aire-inverter-o-convencional", "inverter"), ("senales-de-mantenimiento", "senales"),
          ("no-instales-con-cualquiera", "instalacion")]

piezas = []
for nombre, tipo in VIDEOS:
    tv, av, th, ah = bloques(tipo)
    piezas.append(f'''
<div class="t v" id="{nombre}-vertical"><div class="logo"><img src="{LOGO}" alt=""></div>{av}{tv}
  <div class="bar">AIRCON<b>SOLUTION</b>&nbsp;SERVICES SAC</div></div>
<div class="t h" id="{nombre}-horizontal"><div class="txt">{th}</div><div class="art">{ah}</div>
  <div class="logo"><img src="{LOGO}" alt=""></div></div>''')

HTML = f'<!doctype html><html><head><meta charset="utf-8"><style>{m.font_css()}{CSS}</style></head><body>{"".join(piezas)}</body></html>'

JS = """
const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
(async () => {
  const [html, dir, ids] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 700, height: 1000 }, deviceScaleFactor: 2 });
  await p.goto(pathToFileURL(html).href);
  await p.evaluate(() => document.fonts.ready);
  for (const id of JSON.parse(ids)) {
    await (await p.$('#' + id)).screenshot({ path: `${dir}/${id}.png` });
  }
  await b.close();
})();
"""

import json  # noqa: E402

from PIL import Image  # noqa: E402

tmp = pathlib.Path(tempfile.mkdtemp())
(tmp / "m.html").write_text(HTML, encoding="utf-8")
(tmp / "r.cjs").write_text(JS)
ids = [f"{n}-{k}" for n, _ in VIDEOS for k in ("vertical", "horizontal")]
subprocess.run(["node", str(tmp / "r.cjs"), str(tmp / "m.html"), str(tmp), json.dumps(ids)], check=True)
for i in ids:
    im = Image.open(tmp / f"{i}.png").convert("RGB")
    im = im.resize((1080, 1920) if i.endswith("vertical") else (1280, 720), Image.LANCZOS)
    im.save(out / f"{i}.jpg", quality=90, optimize=True)
    print(i, (out / f"{i}.jpg").stat().st_size // 1024, "KB")
