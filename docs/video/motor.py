"""
Motor de videos verticales (1080 × 1920) de AIRCONSOLUTION SERVICES SAC con voz en español.

Cada video define su guion (una frase por escena) y una función que arma el HTML de las escenas.
El motor:
  1. genera la voz de cada escena con Piper (voz es_MX),
  2. ajusta la duración de cada escena a lo que dura su voz,
  3. congela las animaciones CSS cuadro por cuadro (30 fps) con Playwright,
  4. une cuadros y voz en un MP4 (H.264 + AAC, volumen normalizado para redes).
"""
import array
import base64
import pathlib
import shutil
import subprocess
import tempfile
import wave

ROOT = pathlib.Path(__file__).resolve().parents[2]
FONTS = ROOT / "frontend/node_modules/@fontsource"
FOTOS = ROOT / "frontend/public/images/trabajos"
FPS = 30
VOZ_INICIO = 0.4  # segundos desde que empieza la escena hasta que empieza a hablar
TELEFONO = "985 899 731"
TELEFONO_VOZ = "nueve ocho cinco, ocho nueve nueve, siete tres uno"
MARCA_VOZ = "Érkon Solúshon"  # así la voz en español lo pronuncia parecido al inglés


def b64(p):
    return base64.b64encode(pathlib.Path(p).read_bytes()).decode()


def foto(nombre):
    """Foto real de trabajos (versión liviana de 480 px)."""
    return f"data:image/webp;base64,{b64(FOTOS / f'{nombre}-480.webp')}"


def font_css():
    return "".join(
        f"@font-face{{font-family:'{fam.capitalize()}';font-weight:{w};src:url(data:font/woff2;base64,"
        f"{b64(FONTS / fam / 'files' / f'{fam}-latin-{w}-normal.woff2')}) format('woff2');}}"
        for fam, ws in (("poppins", (600, 800)), ("inter", (500, 700))) for w in ws)


# ---------------- Voz ----------------
def generar_voz(textos, carpeta, modelo, velocidad=0.95):
    carpeta = pathlib.Path(carpeta)
    carpeta.mkdir(parents=True, exist_ok=True)
    for i, t in enumerate(textos):
        subprocess.run(["python3", "-m", "piper", "-m", str(modelo), "-f", str(carpeta / f"p{i}.wav"),
                        "--length-scale", str(velocidad), "--sentence-silence", "0.25"],
                       input=t.encode(), check=True, capture_output=True)


def wav_len(p):
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


def tiempos(carpeta, n, final_extra=2.4):
    """Duración de la voz de cada escena y (inicio, fin) de cada escena."""
    voz = [wav_len(pathlib.Path(carpeta) / f"p{i}.wav") for i in range(n)]
    durs = [v + VOZ_INICIO + 1.0 for v in voz[:-1]] + [voz[-1] + VOZ_INICIO + final_extra]
    ini = [sum(durs[:i]) for i in range(n)]
    escenas = [(a, a + d) for a, d in zip(ini, durs)]
    return voz, escenas, round(sum(durs), 2)


# ---------------- Piezas visuales ----------------
def ac_svg(mood="happy", w=300):
    eyes = {
        "happy": '<path d="M54 42 q8 -10 16 0" stroke="#0d1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>'
                 '<path d="M110 42 q8 -10 16 0" stroke="#0d1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>',
        "tired": '<path d="M54 40 h16" stroke="#0d1b2e" stroke-width="5" stroke-linecap="round"/>'
                 '<path d="M110 40 h16" stroke="#0d1b2e" stroke-width="5" stroke-linecap="round"/>',
        "wink": '<circle cx="62" cy="40" r="7" fill="#0d1b2e"/>'
                '<path d="M110 41 q8 -8 16 0" stroke="#0d1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>',
    }[mood]
    mouth = ('<path d="M80 56 q10 -8 20 0" stroke="#0d1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>'
             if mood == "tired" else
             '<path d="M78 50 q12 13 24 0" stroke="#0d1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>')
    return f"""<svg viewBox="-10 -10 200 150" width="{w}">
  <rect x="0" y="0" width="180" height="92" rx="26" fill="#fff" stroke="#0d1b2e" stroke-width="6"/>
  <rect x="14" y="66" width="152" height="14" rx="7" fill="#dceeff" stroke="#0d1b2e" stroke-width="4"/>
  <circle class="led" cx="160" cy="20" r="6" fill="#3ddc84"/>{eyes}
  <ellipse cx="44" cy="54" rx="9" ry="5.5" fill="#ff8fab" opacity=".75"/>
  <ellipse cx="136" cy="54" rx="9" ry="5.5" fill="#ff8fab" opacity=".75"/>{mouth}
  <g class="air" stroke="#5fb4ff" stroke-width="6" fill="none" stroke-linecap="round">
    <path d="M45 102 q-8 14 0 28"/><path d="M90 102 q-8 14 0 28"/><path d="M135 102 q-8 14 0 28"/></g>
</svg>"""


def sol_svg(w=150):
    rays = "".join(f'<line transform="rotate({a})" x1="0" y1="-46" x2="0" y2="-62"/>' for a in range(0, 360, 30))
    return f"""<svg viewBox="-70 -70 140 140" width="{w}"><g class="spin" stroke="#ffb703" stroke-width="8" stroke-linecap="round">{rays}</g>
  <circle r="36" fill="#ffc93c"/><circle cx="-12" cy="-6" r="4.5" fill="#0d1b2e"/><circle cx="12" cy="-6" r="4.5" fill="#0d1b2e"/>
  <path d="M-13 8 q13 12 26 0" stroke="#0d1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>
  <ellipse cx="-22" cy="6" rx="6" ry="3.5" fill="#ff8fab" opacity=".8"/><ellipse cx="22" cy="6" rx="6" ry="3.5" fill="#ff8fab" opacity=".8"/></svg>"""


def lista(items, inicio, paso):
    """Viñetas que aparecen una por una. items: (icono, texto) — ✓ verde, ✕ rojo, otro azul."""
    out = []
    for i, (ic, txt) in enumerate(items):
        cls = "good" if ic == "✓" else "bad" if ic == "✕" else "info"
        out.append(f'<li class="pop {cls}" style="--d:{inicio + i * paso:.2f}s"><span class="ic">{ic}</span>{txt}</li>')
    return "<ul>" + "".join(out) + "</ul>"


def escena(i, escenas, cuerpo):
    a, b = escenas[i]
    salida = "" if i == len(escenas) - 1 else f", sceneOut .5s ease {b - .5:.2f}s forwards"
    return (f'<section class="scene" style="animation: sceneIn .55s ease {a:.2f}s both{salida}">{cuerpo}</section>')


def cierre(logo, t0, titulo_html):
    """Escena final: logo, mensaje, WhatsApp y web."""
    return f'''
  <div class="logo-big pop" style="--d:{t0+.2:.2f}s;width:190px;height:190px;margin:10px 0 22px"><img src="{logo}" alt="" style="width:158px"></div>
  <p class="pop" style="--d:{t0+.6:.2f}s;font-family:Poppins;font-weight:800;font-size:22px">AIRCON<span class="o">SOLUTION</span> SERVICES SAC</p>
  <p class="cta-big pop" style="--d:{t0+1.0:.2f}s">{titulo_html}</p>
  <div class="pop" style="--d:{t0+1.6:.2f}s"><div class="wa pulse">📲 {TELEFONO}</div></div>
  <p class="web pop" style="--d:{t0+2.0:.2f}s">airconsolutionsac.com</p>
  <p class="small pop" style="--d:{t0+2.3:.2f}s">Aire acondicionado en Lima · Garantía por escrito</p>'''


CSS = """
:root{--navy:#0d1b2e;--blue:#1e88e5;--sky:#5fb4ff;--orange:#f5821f;--green:#2bb673;--red:#e5484d;--yellow:#ffc93c}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:540px;height:960px;overflow:hidden;background:var(--navy)}
body{font-family:'Inter';color:#fff}
.bg{position:absolute;inset:0;background:radial-gradient(circle at 80% 10%,rgba(245,130,31,.35),transparent 45%),
  radial-gradient(circle at 10% 90%,rgba(30,136,229,.45),transparent 50%),linear-gradient(160deg,#0d1b2e,#16365c)}
.flake{position:absolute;color:rgba(255,255,255,.18);animation:fall 9s linear infinite}
@keyframes fall{from{transform:translateY(-60px) rotate(0)}to{transform:translateY(1020px) rotate(360deg)}}
.brandbar{position:absolute;left:0;right:0;bottom:0;height:64px;display:flex;align-items:center;justify-content:center;gap:10px;
  background:rgba(0,0,0,.25);font-family:'Poppins';font-weight:800;font-size:17px;letter-spacing:1px;z-index:5}
.brandbar img{width:40px;height:40px;border-radius:50%;background:#fff;padding:3px}
.brandbar b{color:var(--orange)}
.scene{position:absolute;inset:0 0 64px;padding:30px 36px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;opacity:0}
@keyframes sceneIn{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:none}}
@keyframes sceneOut{from{opacity:1}to{opacity:0;transform:scale(.97)}}
.pop{animation:pop .6s cubic-bezier(.34,1.56,.64,1) var(--d) both}
@keyframes pop{from{opacity:0;transform:translateY(26px) scale(.9)}to{opacity:1;transform:none}}
.slide{animation:slide .6s cubic-bezier(.2,.8,.2,1) var(--d) both}
@keyframes slide{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:none}}
.spin{animation:spin 12s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.float{animation:float 2.6s ease-in-out infinite}
@keyframes float{50%{transform:translateY(-10px)}}
h1{font-family:'Poppins';font-weight:800;font-size:46px;line-height:1.08}
h2{font-family:'Poppins';font-weight:800;font-size:38px;line-height:1.12}
.tag{display:inline-block;font-family:'Poppins';font-weight:800;font-size:15px;letter-spacing:3px;padding:7px 16px;border-radius:30px;margin-bottom:14px;background:rgba(255,255,255,.12)}
.o{color:var(--orange)} .s{color:var(--sky)} .y{color:var(--yellow)}
.logo-big{width:200px;height:200px;border-radius:50%;background:#fff;display:grid;place-items:center;margin:20px 0 30px;
  box-shadow:0 0 0 10px rgba(255,255,255,.08),0 20px 50px rgba(0,0,0,.4)}
.logo-big img{width:168px}
.lead{font-size:21px;color:#cfe1f5;margin-top:16px;line-height:1.35}
ul{list-style:none;width:100%;margin-top:18px;display:grid;gap:12px;text-align:left}
li{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);
  border-radius:18px;padding:13px 16px;font-size:20px;font-weight:500;line-height:1.25}
.ic{flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-size:20px;font-weight:700}
.bad .ic{background:rgba(229,72,77,.2);color:#ff8a8d} .good .ic{background:rgba(43,182,115,.22);color:#6ff0ac}
.info .ic{background:rgba(95,180,255,.18)}
.mascot .led{animation:blink .9s steps(2,jump-none) infinite}
@keyframes blink{from{opacity:1}to{opacity:.1}}
.card{width:100%;border-radius:24px;padding:20px 22px;text-align:left;margin-top:16px}
.card h3{font-family:'Poppins';font-weight:800;font-size:24px;margin-bottom:6px}
.card p{font-size:19px;line-height:1.38;color:#e6eef8}
.card.c{background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.2)}
.card.i{background:linear-gradient(135deg,#1e88e5,#1565c0);box-shadow:0 18px 40px rgba(30,136,229,.45)}
.card.w{background:linear-gradient(135deg,#f5821f,#e06a0a);box-shadow:0 18px 40px rgba(245,130,31,.4)}
.cta-big{font-family:'Poppins';font-weight:800;font-size:33px;line-height:1.15;margin-top:8px}
.wa{display:flex;align-items:center;gap:12px;background:#25d366;border-radius:22px;padding:16px 26px;margin-top:28px;
  font-family:'Poppins';font-weight:800;font-size:31px;box-shadow:0 16px 36px rgba(37,211,102,.4)}
.pulse{animation:pulse 1.4s ease-in-out infinite}
@keyframes pulse{50%{transform:scale(1.05)}}
.web{margin-top:18px;font-size:22px;font-weight:700;color:var(--orange)}
.small{font-size:17px;color:#9fb6cf;margin-top:8px}
.photo{border-radius:22px;overflow:hidden;border:5px solid #fff;box-shadow:0 18px 40px rgba(0,0,0,.45)}
.photo img{display:block;width:100%;height:100%;object-fit:cover}
"""


def pagina(logo, escenas_html, css_extra=""):
    copos = "".join(f'<div class="flake" style="left:{x}px;animation-delay:-{d}s;font-size:{s}px">❄</div>'
                    for x, d, s in ((40, 0, 24), (130, 4, 18), (250, 7, 30), (360, 2, 20), (470, 5.5, 26), (500, 1, 16), (200, 8, 22)))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{font_css()}{CSS}{css_extra}</style></head><body>
<div class="bg"></div>{copos}
{escenas_html}
<div class="brandbar"><img src="{logo}" alt=""><span>AIRCON<b>SOLUTION</b> SERVICES SAC</span></div>
</body></html>"""


# ---------------- Render ----------------
RENDER_JS = """
const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
(async () => {
  const [html, dir, dur, fps, times] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: times ? 1 : 2 });
  await p.goto(pathToFileURL(html).href);
  await p.evaluate(() => document.fonts.ready);
  const list = times ? JSON.parse(times) : Array.from({ length: Math.round(+dur * +fps) }, (_, i) => i / +fps);
  for (let i = 0; i < list.length; i++) {
    await p.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), list[i] * 1000);
    await p.screenshot({ path: `${dir}/f${String(i).padStart(5, '0')}.${times ? 'png' : 'jpg'}`, type: times ? 'png' : 'jpeg', ...(times ? {} : { quality: 90 }) });
  }
  await b.close();
})();
"""


def vista(html, tiempos_seg, salida_png):
    """Hoja con capturas en instantes dados (para revisar antes de renderizar)."""
    from PIL import Image
    tmp = pathlib.Path(tempfile.mkdtemp())
    (tmp / "v.html").write_text(html, encoding="utf-8")
    (tmp / "r.cjs").write_text(RENDER_JS)
    import json
    subprocess.run(["node", str(tmp / "r.cjs"), str(tmp / "v.html"), str(tmp), "0", str(FPS), json.dumps(tiempos_seg)], check=True)
    ims = [Image.open(tmp / f"f{i:05d}.png") for i in range(len(tiempos_seg))]
    hoja = Image.new("RGB", (540 * len(ims), 960))
    for i, im in enumerate(ims):
        hoja.paste(im, (i * 540, 0))
    hoja.resize((270 * len(ims), 480)).save(salida_png)
    shutil.rmtree(tmp)


def renderizar(html, escenas, duracion, carpeta_voz, salida_mp4, portada_seg=3.0):
    tmp = pathlib.Path(tempfile.mkdtemp())
    (tmp / "v.html").write_text(html, encoding="utf-8")
    (tmp / "r.cjs").write_text(RENDER_JS)
    frames = tmp / "frames"
    frames.mkdir()
    subprocess.run(["node", str(tmp / "r.cjs"), str(tmp / "v.html"), str(frames), str(duracion), str(FPS)], check=True)
    carpeta_voz = pathlib.Path(carpeta_voz)
    with wave.open(str(carpeta_voz / "p0.wav")) as w0:
        rate = w0.getframerate()
    pista = array.array("h", bytes(int(duracion * rate) * 2))
    for i in range(len(escenas)):
        with wave.open(str(carpeta_voz / f"p{i}.wav")) as w:
            datos = array.array("h", w.readframes(w.getnframes()))
        ini = int((escenas[i][0] + VOZ_INICIO) * rate)
        pista[ini:ini + len(datos)] = datos[: len(pista) - ini]
    with wave.open(str(tmp / "voz.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pista.tobytes())
    salida_mp4 = pathlib.Path(salida_mp4)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(frames / "f%05d.jpg"),
                    "-i", str(tmp / "voz.wav"), "-af", "loudnorm=I=-16:TP=-1.5", "-ar", "44100",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high", "-crf", "21", "-preset", "medium",
                    "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", str(salida_mp4)], check=True)
    shutil.copy(frames / f"f{int(portada_seg * FPS):05d}.jpg", salida_mp4.with_name(salida_mp4.stem + "-portada.jpg"))
    shutil.rmtree(tmp)
