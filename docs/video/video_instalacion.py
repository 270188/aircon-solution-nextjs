"""
Video «¿Por qué no instalar con cualquiera?» (riesgos de una mala instalación y cómo instalamos).

Uso:  python3 docs/video/video_instalacion.py <logo.png> <voz-piper.onnx> <salida.mp4> [--vista hoja.png]
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
    "¿Vas a instalar tu aire acondicionado con cualquiera, solo porque es más barato? Mira lo que puede pasar.",
    "Una mala instalación causa fugas de gas, y el equipo deja de enfriar. También goteos dentro de tu casa, "
    "ruidos y vibraciones, y cables mal conectados, que son un riesgo eléctrico.",
    "Lo barato sale caro. Lo que ahorras hoy, lo pagas después en reparaciones, recargas de gas, "
    "y un recibo de luz más alto.",
    f"En {m.MARCA_VOZ} instalamos bien: calculamos los BTU correctos, usamos tubería de cobre bien aislada, "
    "hacemos el vacío y la prueba de fugas, y dejamos la instalación eléctrica segura, con su llave térmica.",
    "Y todo con garantía por escrito, más de veinte años de experiencia, y boleta o factura.",
    f"Instala tranquilo, instala con expertos. Escríbenos al {m.TELEFONO_VOZ}.",
]

if not (voz_dir / "p0.wav").exists():
    m.generar_voz(GUION, voz_dir, modelo)
VOZ, E, DUR = m.tiempos(voz_dir, len(GUION))
t = [a for a, _ in E]
paso1 = max(.9, (VOZ[1] - 1.8) / 4)
paso3 = max(.9, (VOZ[3] - 2.2) / 4)

CSS = """
.warn{font-size:70px;line-height:1;animation:shake .5s ease-in-out infinite}
@keyframes shake{25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}
.drop{position:absolute;left:50%;top:150px;width:14px;height:20px;background:#5fb4ff;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;
  animation:drip 1.2s ease-in infinite}
@keyframes drip{from{transform:translateY(0);opacity:1}to{transform:translateY(70px);opacity:0}}
.scale{display:grid;grid-template-columns:1fr 1fr;gap:14px;width:100%;margin-top:22px}
.scale .card{margin:0;text-align:center}
.scale .card > b{display:block;font-size:54px;line-height:1.1}
.scale .card p b{color:#fff}
.scale .card p{font-size:18px}
.big{font-family:'Poppins';font-weight:800;font-size:40px;line-height:1.1;margin-top:20px}
.photos{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;margin-top:14px}
.photos .photo{height:170px}
.shield{width:170px;height:190px;display:grid;place-items:center;font-size:84px;
  background:linear-gradient(160deg,#2bb673,#1e8f55);clip-path:path('M85 0 L170 30 L170 95 C170 150 125 180 85 190 C45 180 0 150 0 95 L0 30 Z');
  box-shadow:0 20px 40px rgba(43,182,115,.45)}
.pills{display:grid;gap:12px;width:100%;margin-top:22px}
.pill{border-radius:20px;padding:16px 18px;font-family:'Poppins';font-weight:800;font-size:22px;display:flex;align-items:center;gap:14px;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18)}
.pill span{font-size:30px}
"""

ESCENAS = "".join([
    m.escena(0, E, f'''
  <div class="warn pop" style="--d:.2s">⚠️</div>
  <h1 class="pop" style="--d:.7s">¿Instalar con<br><span class="o">cualquiera</span>?</h1>
  <p class="lead pop" style="--d:1.4s">Solo porque es más barato…<br><b>mira lo que puede pasar</b> 👇</p>
  <div class="mascot pop" style="--d:2.0s;margin-top:14px;position:relative">{m.ac_svg("tired", 220)}<span class="drop"></span></div>'''),
    m.escena(1, E, f'''
  <span class="tag pop" style="--d:{t[1]+.2:.2f}s;background:rgba(229,72,77,.35)">MALA INSTALACIÓN</span>
  <h2 class="pop" style="--d:{t[1]+.4:.2f}s">Lo que <span class="o">puede pasar</span> 😟</h2>
  {m.lista([("✕", "Fugas de gas: deja de enfriar"), ("✕", "Goteos dentro de tu casa"),
            ("✕", "Ruidos y vibraciones"), ("✕", "Cables mal conectados: riesgo eléctrico")], t[1] + 1.2, paso1)}'''),
    m.escena(2, E, f'''
  <h2 class="pop" style="--d:{t[2]+.3:.2f}s">Lo barato<br><span class="o">sale caro</span> 💸</h2>
  <div class="scale">
    <div class="card c pop" style="--d:{t[2] + VOZ[2] * .3:.2f}s"><b>🪙</b><p>Lo que <b>ahorras hoy</b></p></div>
    <div class="card w pop" style="--d:{t[2] + VOZ[2] * .45:.2f}s"><b>💰</b><p>Lo que <b>pagas después</b></p></div></div>
  {m.lista([("🔧", "Reparaciones"), ("🧪", "Recargas de gas"), ("💡", "Recibo de luz más alto")], t[2] + VOZ[2] * .55, .7)}'''),
    m.escena(3, E, f'''
  <span class="tag pop" style="--d:{t[3]+.2:.2f}s;background:var(--blue)">ASÍ INSTALAMOS NOSOTROS</span>
  <div class="photos pop" style="--d:{t[3]+.5:.2f}s">
    <div class="photo"><img src="{m.foto("condensadoras-coldpoint")}" alt=""></div>
    <div class="photo"><img src="{m.foto_galeria("gal_4")}" alt=""></div></div>
  {m.lista([("✓", "Cálculo correcto de BTU"), ("✓", "Tubería de cobre bien aislada"),
            ("✓", "Vacío y prueba de fugas"), ("✓", "Instalación eléctrica segura con llave térmica")], t[3] + 1.4, paso3)}'''),
    m.escena(4, E, f'''
  <div class="shield pop" style="--d:{t[4]+.3:.2f}s">✅</div>
  <div class="pills">
    <div class="pill slide" style="--d:{t[4] + .9:.2f}s"><span>📄</span>Garantía por escrito</div>
    <div class="pill slide" style="--d:{t[4] + VOZ[4] * .45:.2f}s"><span>🏆</span>Más de 20 años de experiencia</div>
    <div class="pill slide" style="--d:{t[4] + VOZ[4] * .75:.2f}s"><span>🧾</span>Boleta o factura</div></div>'''),
    m.escena(5, E, m.cierre(LOGO, t[5], 'Instala tranquilo:<br><span class="o">instala con expertos</span>')),
])

HTML = m.pagina(LOGO, ESCENAS, CSS)

if "--vista" in sys.argv:
    hoja = sys.argv[sys.argv.index("--vista") + 1]
    m.vista(HTML, [b - .6 for _, b in E[:-1]] + [DUR - .3], hoja)
    print("vista", hoja, "duración", DUR)
else:
    m.renderizar(HTML, E, DUR, voz_dir, salida)
    print("ok", salida, "duración", DUR)
