"""
Video «¡Prepárate para el verano!» (mantenimiento antes de la temporada de calor).

Uso:  python3 docs/video/video_verano.py <logo.png> <voz-piper.onnx> <salida.mp4> [--vista hoja.png]
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import motor as m  # noqa: E402

logo_png, modelo, salida = sys.argv[1:4]
LOGO = f"data:image/png;base64,{m.b64(logo_png)}"
salida = pathlib.Path(salida)
voz_dir = salida.with_name(salida.stem + "-voz")

GUION = [
    "¡Llega el verano! ¿Tu aire acondicionado está listo para el calor? Te contamos por qué conviene hacer el mantenimiento ahora.",
    "En diciembre, cuando aprieta el calor, todos llaman a la vez. Las agendas se llenan, y te toca esperar días con calor.",
    "Un mantenimiento a tiempo hace que tu aire enfríe mejor, gaste menos luz, no tenga malos olores ni goteos, y evita averías caras justo cuando más lo necesitas.",
    "Nuestro mantenimiento incluye limpieza de filtros, lavado del evaporador y de la condensadora, y revisión del gas y de las conexiones eléctricas.",
    "Te recomendamos hacerlo cada seis meses en casa, y cada tres meses en negocios o equipos de mucho uso.",
    f"No esperes al calor. Agenda hoy tu mantenimiento con {m.MARCA_VOZ}. Escríbenos al {m.TELEFONO_VOZ}.",
]

if not (voz_dir / "p0.wav").exists():
    m.generar_voz(GUION, voz_dir, modelo)
VOZ, E, DUR = m.tiempos(voz_dir, len(GUION))
t = [a for a, _ in E]
paso2 = max(.9, (VOZ[2] - 2.0) / 4)
paso3 = max(.9, (VOZ[3] - 2.0) / 4)

CSS = """
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;width:100%;margin-top:18px}
.cal div{aspect-ratio:1;border-radius:10px;background:rgba(255,255,255,.1);display:grid;place-items:center;font-weight:700;font-size:15px}
.cal .full{background:var(--red);animation:fillday .3s ease var(--d) both}
@keyframes fillday{from{background:rgba(255,255,255,.1);transform:scale(.6)}to{background:var(--red);transform:none}}
.stamp{margin-top:18px;font-family:'Poppins';font-weight:800;font-size:30px;color:#fff;background:var(--red);padding:10px 22px;
  border-radius:14px;transform:rotate(-6deg);box-shadow:0 12px 30px rgba(229,72,77,.45)}
.thermo{font-family:'Poppins';font-weight:800;font-size:64px;color:var(--yellow);text-shadow:0 6px 20px rgba(255,183,3,.45)}
.photos{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;margin-top:16px}
.photos .photo{height:190px}
.freq{display:grid;grid-template-columns:1fr 1fr;gap:14px;width:100%;margin-top:22px}
.freq div{border-radius:24px;padding:22px 12px;text-align:center}
.freq b{display:block;font-family:'Poppins';font-weight:800;font-size:56px;line-height:1}
.freq span{display:block;font-size:17px;margin-top:4px;color:#e6eef8}
.freq em{display:block;font-style:normal;font-family:'Poppins';font-weight:800;font-size:22px;margin-top:10px}
"""

dias = "".join(
    f'<div class="{"full" if i >= 7 else ""}" style="--d:{t[1] + 1.4 + (i - 7) * .07:.2f}s">{i + 1}</div>'
    for i in range(28))

ESCENAS = "".join([
    m.escena(0, E, f'''
  <div class="pop" style="--d:.2s">{m.sol_svg(170)}</div>
  <h1 class="pop" style="--d:.8s">¡Llega el<br><span class="y">verano!</span> ☀️</h1>
  <p class="lead pop" style="--d:1.6s">¿Tu aire acondicionado está listo para el calor?</p>
  <div class="mascot pop float" style="--d:2.2s;margin-top:10px">{m.ac_svg("wink", 210)}</div>'''),
    m.escena(1, E, f'''
  <span class="tag pop" style="--d:{t[1]+.2:.2f}s">DICIEMBRE · ENERO · FEBRERO</span>
  <h2 class="pop" style="--d:{t[1]+.4:.2f}s">En verano <span class="o">todos</span><br>llaman a la vez 📞</h2>
  <div class="cal pop" style="--d:{t[1]+.9:.2f}s">{dias}</div>
  <div class="stamp pop" style="--d:{t[1] + VOZ[1] * .62:.2f}s">AGENDA LLENA 😓</div>
  <p class="lead pop" style="--d:{t[1] + VOZ[1] * .78:.2f}s">…y te toca esperar <b class="y">días con calor</b> 🥵</p>'''),
    m.escena(2, E, f'''
  <span class="tag pop" style="--d:{t[2]+.2:.2f}s;background:var(--blue)">MANTENIMIENTO A TIEMPO</span>
  <h2 class="pop" style="--d:{t[2]+.4:.2f}s">¿Qué <span class="s">ganas</span>?</h2>
  <div class="mascot pop float" style="--d:{t[2]+.8:.2f}s;margin:6px 0">{m.ac_svg("happy", 200)}</div>
  {m.lista([("❄️", "Enfría mejor y más rápido"), ("💡", "Gasta menos luz"),
            ("🌸", "Sin malos olores ni goteos"), ("🛡️", "Evita averías caras en pleno calor")], t[2] + 1.6, paso2)}'''),
    m.escena(3, E, f'''
  <h2 class="pop" style="--d:{t[3]+.3:.2f}s">¿Qué <span class="o">incluye</span>?</h2>
  <div class="photos pop" style="--d:{t[3]+.7:.2f}s">
    <div class="photo"><img src="{m.foto("limpieza-filtros")}" alt=""></div>
    <div class="photo"><img src="{m.foto("lavado-condensadora-gree")}" alt=""></div></div>
  {m.lista([("✓", "Limpieza de filtros"), ("✓", "Lavado de evaporador y condensadora"),
            ("✓", "Revisión de gas (presiones)"), ("✓", "Revisión de conexiones eléctricas")], t[3] + 1.6, paso3)}
  <p class="small pop" style="--d:{t[3]+1.2:.2f}s">📸 Fotos reales de nuestros trabajos</p>'''),
    m.escena(4, E, f'''
  <h2 class="pop" style="--d:{t[4]+.3:.2f}s">¿Cada cuánto? 🗓️</h2>
  <div class="freq">
    <div class="card c pop" style="--d:{t[4]+1.0:.2f}s;margin:0"><b>6</b><span>meses</span><em>🏠 En casa</em></div>
    <div class="card w pop" style="--d:{t[4] + VOZ[4] * .5:.2f}s;margin:0"><b>3</b><span>meses</span><em>🏢 Negocios</em></div>
  </div>
  <p class="lead pop" style="--d:{t[4] + VOZ[4] * .7:.2f}s">o equipos de <b>mucho uso</b></p>'''),
    m.escena(5, E, m.cierre(LOGO, t[5], 'No esperes al calor:<br><span class="o">¡agenda hoy!</span>')),
])

HTML = m.pagina(LOGO, ESCENAS, CSS)

if "--vista" in sys.argv:
    hoja = sys.argv[sys.argv.index("--vista") + 1]
    m.vista(HTML, [b - .6 for _, b in E[:-1]] + [DUR - .3], hoja)
    print("vista", hoja, "duración", DUR)
else:
    m.renderizar(HTML, E, DUR, voz_dir, salida)
    print("ok", salida, "duración", DUR)
