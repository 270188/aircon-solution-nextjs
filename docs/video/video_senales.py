"""
Video «5 señales de que tu aire necesita mantenimiento».

Uso:  python3 docs/video/video_senales.py <logo.png> <voz-piper.onnx> <salida.mp4> [--vista hoja.png]
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import motor as m  # noqa: E402

logo_png, modelo, salida = sys.argv[1:4]
LOGO = f"data:image/png;base64,{m.b64(logo_png)}"
salida = pathlib.Path(salida)
voz_dir = salida.with_name(salida.stem + "-voz")

# (emoji, título, detalle) de cada señal
SENALES = [
    ("👃", "Huele mal", "Hongos y suciedad en el filtro y el evaporador."),
    ("💧", "Gotea agua", "Desagüe tapado o bandeja sucia."),
    ("🥵", "Ya no enfría como antes", "Filtros sucios o falta de gas."),
    ("🔊", "Hace ruidos raros", "Piezas flojas o ventilador sucio."),
    ("💡", "Subió tu recibo de luz", "El equipo trabaja forzado y gasta más."),
]

GUION = [
    "¿Tu aire acondicionado te está pidiendo ayuda? Aquí van cinco señales de que necesita mantenimiento.",
    "Señal uno: huele mal. Es por hongos y suciedad acumulada en el filtro y en el evaporador.",
    "Señal dos: gotea agua. Normalmente el desagüe está tapado o la bandeja está sucia.",
    "Señal tres: ya no enfría como antes. Puede tener los filtros sucios o le falta gas.",
    "Señal cuatro: hace ruidos raros. Hay piezas flojas o el ventilador está sucio.",
    "Señal cinco: subió tu recibo de luz. El equipo trabaja forzado y gasta más energía.",
    f"Si notas una de estas señales, no esperes a que se malogre. Agenda tu mantenimiento con {m.MARCA_VOZ}. "
    f"Escríbenos al {m.TELEFONO_VOZ}.",
]

if not (voz_dir / "p0.wav").exists():
    m.generar_voz(GUION, voz_dir, modelo)
VOZ, E, DUR = m.tiempos(voz_dir, len(GUION))
t = [a for a, _ in E]

CSS = """
.num{font-family:'Poppins';font-weight:800;font-size:130px;line-height:1;color:var(--orange);text-shadow:0 10px 30px rgba(245,130,31,.45)}
.num small{font-size:30px;color:#fff;display:block;letter-spacing:6px;margin-bottom:4px}
.emoji{font-size:110px;line-height:1;margin:30px 0 10px}
.why{margin-top:22px;width:100%;border-radius:22px;padding:18px 20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);
  font-size:21px;line-height:1.35;text-align:left;display:flex;gap:14px;align-items:center}
.why b{flex:none;font-size:30px}
.dots{display:flex;gap:10px;margin-top:26px}
.dots i{width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,.25)}
.dots i.on{background:var(--orange)}
.cinco{font-family:'Poppins';font-weight:800;font-size:150px;line-height:1;color:var(--orange)}
.mini{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;width:100%;margin-top:18px}
.mini div{border-radius:16px;background:rgba(255,255,255,.1);font-size:34px;padding:10px 0}
"""


def senal(n):
    e, titulo, detalle = SENALES[n - 1]
    a = t[n]
    puntos = "".join(f'<i class="{"on" if i < n else ""}"></i>' for i in range(5))
    return m.escena(n, E, f'''
  <div class="num pop" style="--d:{a+.2:.2f}s"><small>SEÑAL</small>{n}</div>
  <div class="emoji pop float" style="--d:{a+.6:.2f}s">{e}</div>
  <h2 class="pop" style="--d:{a+1.0:.2f}s">{titulo}</h2>
  <div class="why slide" style="--d:{a + VOZ[n] * .45:.2f}s"><b>🔎</b><span>{detalle}</span></div>
  <div class="dots pop" style="--d:{a+.4:.2f}s">{puntos}</div>''')


ESCENAS = "".join([
    m.escena(0, E, f'''
  <div class="mascot pop" style="--d:.2s">{m.ac_svg("tired", 230)}</div>
  <h1 class="pop" style="--d:.7s">¿Tu aire te<br><span class="o">pide ayuda</span>? 🆘</h1>
  <div class="cinco pop" style="--d:1.4s">5</div>
  <p class="lead pop" style="--d:1.9s" >señales de que necesita<br><b>mantenimiento</b></p>
  <div class="mini pop" style="--d:2.4s">{"".join(f"<div>{s[0]}</div>" for s in SENALES)}</div>'''),
    *[senal(n) for n in range(1, 6)],
    m.escena(6, E, m.cierre(LOGO, t[6], '¿Notaste alguna señal?<br><span class="o">¡Agenda tu mantenimiento!</span>')),
])

HTML = m.pagina(LOGO, ESCENAS, CSS)

if "--vista" in sys.argv:
    hoja = sys.argv[sys.argv.index("--vista") + 1]
    m.vista(HTML, [b - .6 for _, b in E[:-1]] + [DUR - .3], hoja)
    print("vista", hoja, "duración", DUR)
else:
    m.renderizar(HTML, E, DUR, voz_dir, salida)
    print("ok", salida, "duración", DUR)
