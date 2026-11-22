"""
Video vertical (1080 × 1920, ~45 s) de AIRCONSOLUTION SERVICES SAC:
«¿Qué aire me conviene: inverter o convencional?»

Las escenas son HTML con animaciones CSS. Node + Playwright detiene las animaciones en cada
instante (30 cuadros por segundo) y toma una foto; ffmpeg une las fotos en un MP4 (H.264).

Uso:  python3 docs/video/generar_video.py <logo-transparente.png> <salida.mp4> [--narracion carpeta]

Con --narracion, la carpeta debe tener p0.wav … p5.wav (la voz de cada escena). Cada escena dura lo
que dura su voz (más un respiro) y los textos aparecen al ritmo de la narración.
"""
import base64
import pathlib
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
FONTS = ROOT / "frontend/node_modules/@fontsource"
logo_path, out_mp4 = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
FPS = 30
NARR = pathlib.Path(sys.argv[sys.argv.index("--narracion") + 1]) if "--narracion" in sys.argv else None


def wav_len(p):
    import wave
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


VOZ_INICIO = 0.4  # segundos desde el inicio de la escena hasta que empieza a hablar
if NARR:
    VOZ = [wav_len(NARR / f"p{i}.wav") for i in range(6)]
    DURS = [v + VOZ_INICIO + 1.0 for v in VOZ[:-1]] + [VOZ[-1] + VOZ_INICIO + 2.4]
else:
    VOZ = [4.5, 7.0, 7.0, 7.0, 6.5, 5.0]
    DURS = [5.5, 8.5, 8.5, 9.0, 8.0, 6.5]
DURACION = round(sum(DURS), 2)


def b64(p):
    return base64.b64encode(pathlib.Path(p).read_bytes()).decode()


LOGO = f"data:image/png;base64,{b64(logo_path)}"
FONT_CSS = "".join(
    f"@font-face{{font-family:'{fam.capitalize()}';font-weight:{w};src:url(data:font/woff2;base64,"
    f"{b64(FONTS / fam / 'files' / f'{fam}-latin-{w}-normal.woff2')}) format('woff2');}}"
    for fam, ws in (("poppins", (600, 800)), ("inter", (500, 700))) for w in ws
)


def ac_svg(mood="happy", w=300):
    """Aire acondicionado con carita (mismo personaje de los stickers)."""
    eyes = {
        "happy": '<path d="M54 42 q8 -10 16 0" stroke="#0d1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>'
                 '<path d="M110 42 q8 -10 16 0" stroke="#0d1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>',
        "tired": '<path d="M54 40 h16" stroke="#0d1b2e" stroke-width="5" stroke-linecap="round"/>'
                 '<path d="M110 40 h16" stroke="#0d1b2e" stroke-width="5" stroke-linecap="round"/>',
    }[mood]
    mouth = ('<path d="M78 50 q12 13 24 0" stroke="#0d1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>'
             if mood == "happy" else
             '<path d="M80 56 q10 -8 20 0" stroke="#0d1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>')
    return f"""<svg viewBox="-10 -10 200 150" width="{w}">
  <rect x="0" y="0" width="180" height="92" rx="26" fill="#fff" stroke="#0d1b2e" stroke-width="6"/>
  <rect x="14" y="66" width="152" height="14" rx="7" fill="#dceeff" stroke="#0d1b2e" stroke-width="4"/>
  <circle class="led" cx="160" cy="20" r="6" fill="#3ddc84"/>
  {eyes}
  <ellipse cx="44" cy="54" rx="9" ry="5.5" fill="#ff8fab" opacity=".75"/>
  <ellipse cx="136" cy="54" rx="9" ry="5.5" fill="#ff8fab" opacity=".75"/>
  {mouth}
  <g class="air" stroke="#5fb4ff" stroke-width="6" fill="none" stroke-linecap="round">
    <path d="M45 102 q-8 14 0 28"/><path d="M90 102 q-8 14 0 28"/><path d="M135 102 q-8 14 0 28"/>
  </g>
</svg>"""


def bullets(items, start, step=0.7, cls=""):
    return "".join(
        f'<li class="pop {("good" if ic == "✓" else "bad") if cls == "auto" else cls}" style="--d:{start + i * step:.2f}s">'
        f'<span class="ic">{ic}</span>{txt}</li>'
        for i, (ic, txt) in enumerate(items))


# Escenas: (inicio, fin) en segundos
_ini = [sum(DURS[:i]) for i in range(len(DURS))]
S = [(a, a + d) for a, d in zip(_ini, DURS)]
S[-1] = (S[-1][0], DURACION + 1)
# Ritmo de las viñetas según lo que dura la voz de cada escena.
PASO1 = max(.9, (VOZ[1] - 2.0) / 4)
PASO2 = max(.9, (VOZ[2] - 2.0) / 4)
PASO_TABLA = max(.9, (VOZ[3] - 2.0) / 5)


def scene(i, body, cls=""):
    a, b = S[i]
    out = "" if i == len(S) - 1 else f", sceneOut .5s ease {b - .5:.2f}s forwards"
    return (f'<section class="scene {cls}" style="animation: sceneIn .55s ease {a:.2f}s both{out}">'
            f"{body}</section>")


tabla = [("Precio de compra", "Más barato", "Un poco más caro", 0),
         ("Consumo de luz", "Gasta más", "Ahorra 30 % o más", 1),
         ("Ruido", "Más ruidoso", "Más silencioso", 1),
         ("Temperatura", "Sube y baja", "Siempre estable", 1),
         ("Duración", "Más desgaste", "Dura más", 1)]
filas = "".join(
    f'<div class="row pop" style="--d:{S[3][0] + 1.4 + i * PASO_TABLA:.2f}s"><div class="k">{k}</div>'
    f'<div class="v {"win" if g == 0 else ""}">{c}</div><div class="v {"win" if g == 1 else ""}">{inv}</div></div>'
    for i, (k, c, inv, g) in enumerate(tabla))

ZIGZAG = "M10 120 L60 40 L110 120 L160 40 L210 120 L260 40 L310 120 L360 40 L410 120"
FLAT = "M10 120 C60 60 90 80 130 80 L410 80"

HTML = f"""<!doctype html><html><head><meta charset="utf-8"><style>
{FONT_CSS}
:root{{--navy:#0d1b2e;--navy2:#16365c;--blue:#1e88e5;--sky:#5fb4ff;--orange:#f5821f;--green:#2bb673;--red:#e5484d}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:540px;height:960px;overflow:hidden;background:var(--navy)}}
body{{font-family:'Inter';color:#fff}}
.bg{{position:absolute;inset:0;background:radial-gradient(circle at 80% 10%,rgba(245,130,31,.35),transparent 45%),
  radial-gradient(circle at 10% 90%,rgba(30,136,229,.45),transparent 50%),linear-gradient(160deg,#0d1b2e,#16365c)}}
.flake{{position:absolute;color:rgba(255,255,255,.18);font-size:26px;animation:fall 9s linear infinite}}
@keyframes fall{{from{{transform:translateY(-60px) rotate(0)}}to{{transform:translateY(1020px) rotate(360deg)}}}}
.brandbar{{position:absolute;left:0;right:0;bottom:0;height:64px;display:flex;align-items:center;justify-content:center;gap:10px;
  background:rgba(0,0,0,.25);font-family:'Poppins';font-weight:800;font-size:17px;letter-spacing:1px;z-index:5}}
.brandbar img{{width:40px;height:40px;border-radius:50%;background:#fff;padding:3px}}
.brandbar b{{color:var(--orange)}}
.scene{{position:absolute;inset:0 0 64px;padding:30px 36px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;opacity:0}}
@keyframes sceneIn{{from{{opacity:0;transform:scale(1.04)}}to{{opacity:1;transform:none}}}}
@keyframes sceneOut{{from{{opacity:1}}to{{opacity:0;transform:scale(.97)}}}}
.pop{{animation:pop .6s cubic-bezier(.34,1.56,.64,1) var(--d) both}}
@keyframes pop{{from{{opacity:0;transform:translateY(26px) scale(.9)}}to{{opacity:1;transform:none}}}}
.slide{{animation:slide .6s cubic-bezier(.2,.8,.2,1) var(--d) both}}
@keyframes slide{{from{{opacity:0;transform:translateX(-60px)}}to{{opacity:1;transform:none}}}}
h1{{font-family:'Poppins';font-weight:800;font-size:46px;line-height:1.08}}
h2{{font-family:'Poppins';font-weight:800;font-size:40px;line-height:1.1}}
.tag{{display:inline-block;font-family:'Poppins';font-weight:800;font-size:15px;letter-spacing:3px;padding:7px 16px;border-radius:30px;margin-bottom:14px}}
.o{{color:var(--orange)}} .s{{color:var(--sky)}}
.logo-big{{width:210px;height:210px;border-radius:50%;background:#fff;display:grid;place-items:center;margin:40px 0 34px;
  box-shadow:0 0 0 10px rgba(255,255,255,.08),0 20px 50px rgba(0,0,0,.4)}}
.logo-big img{{width:176px}}
.lead{{font-size:21px;color:#cfe1f5;margin-top:18px;line-height:1.35}}
.vs{{display:flex;align-items:center;gap:16px;margin-top:34px}}
.chip{{font-family:'Poppins';font-weight:800;font-size:20px;padding:12px 20px;border-radius:16px}}
.chip.c{{background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.35)}}
.chip.i{{background:var(--blue)}}
.vsx{{font-family:'Poppins';font-weight:800;font-size:22px;color:var(--orange)}}
ul{{list-style:none;width:100%;margin-top:18px;display:grid;gap:12px;text-align:left}}
li{{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);
  border-radius:18px;padding:13px 16px;font-size:20px;font-weight:500}}
.ic{{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:20px;font-weight:700}}
.bad .ic{{background:rgba(229,72,77,.2);color:#ff8a8d}} .good .ic{{background:rgba(43,182,115,.22);color:#6ff0ac}}
.mascot{{margin:14px 0 4px;position:relative}}
.mascot .led{{animation:blink .9s steps(2,jump-none) infinite}}
@keyframes blink{{from{{opacity:1}}to{{opacity:.1}}}}
.onoff{{position:absolute;right:-10px;top:-8px;font-family:'Poppins';font-weight:800;font-size:16px;background:var(--red);
  padding:6px 12px;border-radius:12px;animation:onoff 1.4s steps(2,jump-none) infinite}}
@keyframes onoff{{from{{background:var(--red)}}to{{background:#5d6b7a}}}}
.onoff::after{{content:'ON / OFF'}}
.graph{{width:100%;background:rgba(255,255,255,.06);border-radius:18px;padding:10px 12px 6px;margin-top:6px}}
.graph .lbl{{font-size:14px;color:#9fb6cf;text-align:left;margin-bottom:2px}}
.graph path.line{{fill:none;stroke-width:7;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:900;
  animation:draw 2.2s ease var(--d) both}}
@keyframes draw{{from{{stroke-dashoffset:900}}to{{stroke-dashoffset:0}}}}
.table{{width:100%;margin-top:22px;display:grid;gap:10px}}
.row{{display:grid;grid-template-columns:1.05fr 1fr 1fr;gap:8px;align-items:stretch}}
.row>div{{border-radius:14px;padding:12px 8px;font-size:16.5px;display:grid;place-items:center;line-height:1.2}}
.row .k{{background:rgba(255,255,255,.12);font-weight:700;font-size:15.5px}}
.row .v{{background:rgba(255,255,255,.06);color:#cfe1f5}}
.row .v.win{{background:rgba(43,182,115,.25);color:#fff;font-weight:700;box-shadow:inset 0 0 0 2px rgba(111,240,172,.55)}}
.head{{display:grid;grid-template-columns:1.05fr 1fr 1fr;gap:8px;width:100%;margin-top:26px;font-family:'Poppins';font-weight:800;font-size:17px}}
.head div:nth-child(2){{color:#ffd0a8}} .head div:nth-child(3){{color:#9fd0ff}}
.card{{width:100%;border-radius:24px;padding:22px 22px 20px;text-align:left;margin-top:18px}}
.card h3{{font-family:'Poppins';font-weight:800;font-size:25px;margin-bottom:8px}}
.card p{{font-size:19px;line-height:1.38;color:#e6eef8}}
.card.c{{background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.2)}}
.card.i{{background:linear-gradient(135deg,#1e88e5,#1565c0);box-shadow:0 18px 40px rgba(30,136,229,.45)}}
.badge{{display:inline-block;background:var(--orange);font-family:'Poppins';font-weight:800;font-size:14px;letter-spacing:1px;
  padding:5px 12px;border-radius:10px;margin-left:8px;vertical-align:middle}}
.cta-big{{font-family:'Poppins';font-weight:800;font-size:34px;line-height:1.15;margin-top:8px}}
.wa{{display:flex;align-items:center;gap:12px;background:#25d366;border-radius:22px;padding:16px 26px;margin-top:30px;
  font-family:'Poppins';font-weight:800;font-size:31px;box-shadow:0 16px 36px rgba(37,211,102,.4)}}
.pulse{{animation:pulse 1.4s ease-in-out infinite}}
@keyframes pulse{{50%{{transform:scale(1.05)}}}}
.web{{margin-top:20px;font-size:22px;font-weight:700;color:var(--orange)}}
.small{{font-size:17px;color:#9fb6cf;margin-top:8px}}
</style></head><body>
<div class="bg"></div>
{''.join(f'<div class="flake" style="left:{x}px;animation-delay:-{d}s;font-size:{s}px">❄</div>'
         for x, d, s in ((40, 0, 24), (130, 4, 18), (250, 7, 30), (360, 2, 20), (470, 5.5, 26), (500, 1, 16), (200, 8, 22)))}

{scene(0, f'''
  <div class="logo-big pop" style="--d:.2s"><img src="{LOGO}" alt=""></div>
  <h1 class="pop" style="--d:.9s">¿Qué aire me<br><span class="o">conviene?</span></h1>
  <div class="vs pop" style="--d:1.7s"><span class="chip c">CONVENCIONAL</span><span class="vsx">VS</span><span class="chip i">INVERTER</span></div>
  <p class="lead pop" style="--d:2.5s">Te lo explicamos en 1 minuto 👇</p>''')}

{scene(1, f'''
  <span class="tag pop" style="--d:{S[1][0]+.2:.2f}s;background:rgba(255,255,255,.12)">TIPO 1</span>
  <h2 class="pop" style="--d:{S[1][0]+.4:.2f}s">Aire <span class="o">convencional</span></h2>
  <div class="mascot pop" style="--d:{S[1][0]+.8:.2f}s">{ac_svg("tired", 230)}<span class="onoff"></span></div>
  <div class="graph pop" style="--d:{S[1][0]+1.2:.2f}s"><div class="lbl">🌡️ Temperatura del ambiente</div>
    <svg viewBox="0 0 420 150" width="100%" height="96"><path class="line" style="--d:{S[1][0]+1.4:.2f}s;stroke:#ff8a8d" d="{ZIGZAG}"/></svg></div>
  <ul>{bullets([("✕", "Se prende y se apaga todo el tiempo"), ("✕", "La temperatura sube y baja"),
                ("✕", "Gasta más luz cada mes"), ("✓", "Es más barato al comprarlo")], S[1][0] + 1.6, PASO1, "auto")}</ul>''')}

{scene(2, f'''
  <span class="tag pop" style="--d:{S[2][0]+.2:.2f}s;background:var(--blue)">TIPO 2</span>
  <h2 class="pop" style="--d:{S[2][0]+.4:.2f}s">Aire <span class="s">inverter</span></h2>
  <div class="mascot pop" style="--d:{S[2][0]+.8:.2f}s">{ac_svg("happy", 230)}</div>
  <div class="graph pop" style="--d:{S[2][0]+1.2:.2f}s"><div class="lbl">🌡️ Temperatura del ambiente</div>
    <svg viewBox="0 0 420 150" width="100%" height="96"><path class="line" style="--d:{S[2][0]+1.4:.2f}s;stroke:#6ff0ac" d="{FLAT}"/></svg></div>
  <ul>{bullets([("✓", "Regula su velocidad, no se apaga"), ("✓", "Temperatura estable y cómoda"),
                ("✓", "Más silencioso"), ("✓", "Ahorra 30 % o más de luz")], S[2][0] + 1.6, PASO2, "good")}</ul>''')}

{scene(3, f'''
  <h2 class="pop" style="--d:{S[3][0]+.3:.2f}s">Cara a cara 🥊</h2>
  <div class="head pop" style="--d:{S[3][0]+.7:.2f}s"><div></div><div>Convencional</div><div>Inverter</div></div>
  <div class="table">{filas}</div>
  <p class="lead pop" style="--d:{S[3][0] + 1.6 + 5 * PASO_TABLA:.2f}s">El inverter gana en <b class="s">4 de 5</b> 🏆</p>''')}

{scene(4, f'''
  <h2 class="pop" style="--d:{S[4][0]+.3:.2f}s">¿Cuál te <span class="o">conviene</span>?</h2>
  <div class="card c slide" style="--d:{S[4][0]+1.0:.2f}s"><h3>Convencional</h3>
    <p>Si lo usas <b>pocas horas</b> o solo algunos días del año, y quieres gastar menos al comprar.</p></div>
  <div class="card i slide" style="--d:{S[4][0] + VOZ_INICIO + VOZ[4] * .42:.2f}s"><h3>Inverter <span class="badge">RECOMENDADO</span></h3>
    <p>Si lo usas <b>varias horas al día</b>: dormitorio, oficina o negocio. Con el ahorro de luz,
    <b>la diferencia de precio se paga sola</b>.</p></div>''')}

{scene(5, f'''
  <div class="logo-big pop" style="--d:{S[5][0]+.2:.2f}s;width:190px;height:190px;margin:26px 0 24px"><img src="{LOGO}" alt="" style="width:158px"></div>
  <p class="pop" style="--d:{S[5][0]+.7:.2f}s;font-family:Poppins;font-weight:800;font-size:22px">AIRCON<span class="o">SOLUTION</span> SERVICES SAC</p>
  <p class="cta-big pop" style="--d:{S[5][0]+1.1:.2f}s">Te asesoramos,<br>vendemos e <span class="o">instalamos</span></p>
  <div class="pop" style="--d:{S[5][0]+1.7:.2f}s"><div class="wa pulse">📲 985 899 731</div></div>
  <p class="web pop" style="--d:{S[5][0]+2.2:.2f}s">airconsolutionsac.com</p>
  <p class="small pop" style="--d:{S[5][0]+2.5:.2f}s">Aire acondicionado en Lima · Garantía por escrito</p>''')}

<div class="brandbar"><img src="{LOGO}" alt=""><span>AIRCON<b>SOLUTION</b> SERVICES SAC</span></div>
</body></html>"""

RENDER = """
const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
(async () => {
  const [html, dir, dur, fps] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  await p.goto(pathToFileURL(html).href);
  await p.evaluate(() => document.fonts.ready);
  const n = Math.round(+dur * +fps);
  for (let i = 0; i < n; i++) {
    const t = (i / +fps) * 1000;
    await p.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), t);
    await p.screenshot({ path: `${dir}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90 });
  }
  await b.close();
})();
"""

if "--vista" in sys.argv:  # solo guarda el HTML para revisar escenas sueltas
    out_mp4.with_suffix(".html").write_text(HTML, encoding="utf-8")
    sys.exit(0)

tmp = pathlib.Path(tempfile.mkdtemp())
(tmp / "video.html").write_text(HTML, encoding="utf-8")
(tmp / "render.cjs").write_text(RENDER)
frames = tmp / "frames"
frames.mkdir()
subprocess.run(["node", str(tmp / "render.cjs"), str(tmp / "video.html"), str(frames), str(DURACION), str(FPS)], check=True)
if NARR:
    # Une las voces en una sola pista, cada una al inicio de su escena.
    import array
    import wave
    with wave.open(str(NARR / "p0.wav")) as w0:
        rate, width, ch = w0.getframerate(), w0.getsampwidth(), w0.getnchannels()
    pista = array.array("h", bytes(int(DURACION * rate) * 2))
    for i in range(6):
        with wave.open(str(NARR / f"p{i}.wav")) as w:
            datos = array.array("h", w.readframes(w.getnframes()))
        ini = int((S[i][0] + VOZ_INICIO) * rate)
        pista[ini:ini + len(datos)] = datos[: len(pista) - ini]
    with wave.open(str(tmp / "voz.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pista.tobytes())
    audio_in = ["-i", str(tmp / "voz.wav")]
else:
    # pista de audio silenciosa: algunas apps (WhatsApp, TikTok) prefieren videos con audio
    audio_in = ["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100"]
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(frames / "f%05d.jpg"),
                *audio_in, "-af", "loudnorm=I=-16:TP=-1.5", "-ar", "44100",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high", "-crf", "21", "-preset", "medium",
                "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", str(out_mp4)], check=True)
shutil.copy(frames / f"f{int(2.6 * FPS):05d}.jpg", out_mp4.with_name(out_mp4.stem + "-portada.jpg"))
shutil.rmtree(tmp)
print("ok", out_mp4)
