"""
Video «¿Cuántos BTU necesito?» (guía rápida para elegir la capacidad del aire acondicionado).

Guía usada (clima cálido como Lima, ~600 BTU por m²): 9 000 BTU hasta 15 m², 12 000 de 15 a 20 m²,
18 000 de 20 a 30 m², 24 000 de 30 a 40 m². Es referencial: la visita técnica define el equipo exacto.

Uso:  python3 docs/video/video_btu.py <logo.png> <voz-piper.onnx> <salida.mp4> [--vista hoja.png]
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
    "¿Vas a comprar un aire acondicionado y no sabes cuántos BTU necesitas? Te lo explicamos fácil.",
    "Los BTU indican la potencia del aire para enfriar. Mientras más grande es el ambiente, más BTU necesitas.",
    "Como guía: nueve mil BTU, para ambientes de hasta quince metros cuadrados. Doce mil, de quince a veinte metros. "
    "Dieciocho mil, de veinte a treinta. Y veinticuatro mil, de treinta a cuarenta metros cuadrados.",
    "Pero ojo: elige un nivel más si el ambiente recibe mucho sol, está en el último piso, hay muchas personas, "
    "o tiene equipos que dan calor, como cocinas o computadoras.",
    "Si el equipo es muy chico, trabajará forzado y no enfriará bien. Si es muy grande, gastaste de más. "
    "Lo ideal es medir bien el ambiente.",
    f"En {m.MARCA_VOZ} vamos, medimos tu ambiente y te recomendamos el equipo ideal. Escríbenos al {m.TELEFONO_VOZ}.",
]

if not (voz_dir / "p0.wav").exists():
    m.generar_voz(GUION, voz_dir, modelo)
VOZ, E, DUR = m.tiempos(voz_dir, len(GUION))
t = [a for a, _ in E]

CSS = """
.big-btu{font-family:'Poppins';font-weight:800;font-size:92px;line-height:1;color:var(--sky);text-shadow:0 8px 30px rgba(95,180,255,.45)}
.rooms{display:flex;align-items:flex-end;justify-content:center;gap:16px;margin-top:22px;height:230px}
.room{border:4px solid #fff;border-radius:12px;background:rgba(255,255,255,.08);display:grid;place-items:center;
  font-family:'Poppins';font-weight:800;font-size:16px;animation:grow .8s cubic-bezier(.2,.8,.2,1) var(--d) both;transform-origin:bottom}
@keyframes grow{from{transform:scaleY(.2);opacity:0}to{transform:none;opacity:1}}
.arrow{font-size:40px;margin-top:10px}
.guide{width:100%;display:grid;gap:11px;margin-top:20px}
.g{display:grid;grid-template-columns:120px 1fr;align-items:center;border-radius:18px;overflow:hidden;background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.14)}
.g .b{height:100%;display:grid;place-items:center;font-family:'Poppins';font-weight:800;font-size:22px;line-height:1.05;padding:12px 6px}
.g .b small{display:block;font-size:12px;letter-spacing:2px;opacity:.85}
.g .m{text-align:left;padding:10px 16px}
.g .m b{display:block;font-family:'Poppins';font-weight:800;font-size:22px}
.g .m span{font-size:16px;color:#cfe1f5}
.factors{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;margin-top:20px}
.factor{border-radius:20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);padding:18px 10px}
.factor .e{font-size:44px;line-height:1}
.factor p{font-size:18px;font-weight:700;margin-top:8px}
.up{margin-top:18px;font-family:'Poppins';font-weight:800;font-size:24px;background:var(--orange);padding:10px 20px;border-radius:14px}
.duo{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;margin-top:18px}
.duo .card{margin:0;text-align:center}
.duo .card p{font-size:17px}
.ok{margin-top:18px;width:100%}
"""

COLORES = ["#5fb4ff", "#1e88e5", "#f5821f", "#e06a0a"]
FILAS = [("9 000", "Hasta 15 m²", "🛏️ Dormitorio"), ("12 000", "15 a 20 m²", "🛏️ Dormitorio grande · 🖥️ Oficina"),
         ("18 000", "20 a 30 m²", "🛋️ Sala · Oficina grande"), ("24 000", "30 a 40 m²", "🏪 Sala grande · Local")]
paso_guia = max(1.0, (VOZ[2] - 1.5) / 4)
guia = "".join(
    f'<div class="g slide" style="--d:{t[2] + 1.2 + i * paso_guia:.2f}s"><div class="b" style="background:{c}">'
    f'{btu.replace(" ", "&nbsp;")}<small>BTU</small></div><div class="m"><b>{m2}</b><span>{uso}</span></div></div>'
    for i, ((btu, m2, uso), c) in enumerate(zip(FILAS, COLORES)))
paso_f = max(.9, (VOZ[3] - 2.5) / 4)
factores = "".join(
    f'<div class="factor pop" style="--d:{t[3] + 1.6 + i * paso_f:.2f}s"><div class="e">{e}</div><p>{txt}</p></div>'
    for i, (e, txt) in enumerate([("☀️", "Mucho sol"), ("🏢", "Último piso"), ("👨‍👩‍👧‍👦", "Muchas personas"),
                                  ("🍳", "Cocina o computadoras")]))

ESCENAS = "".join([
    m.escena(0, E, f'''
  <div class="mascot pop float" style="--d:.2s">{m.ac_svg("wink", 240)}</div>
  <h1 class="pop" style="--d:.8s">¿Cuántos <span class="s">BTU</span><br>necesito? 🤔</h1>
  <p class="lead pop" style="--d:1.6s">Elige bien tu aire acondicionado<br>en menos de 1 minuto 👇</p>'''),
    m.escena(1, E, f'''
  <span class="tag pop" style="--d:{t[1]+.2:.2f}s">¿QUÉ SON LOS BTU?</span>
  <div class="big-btu pop" style="--d:{t[1]+.5:.2f}s">BTU</div>
  <p class="lead pop" style="--d:{t[1]+1.0:.2f}s">= la <b>potencia</b> del aire para enfriar ❄️</p>
  <div class="rooms">
    <div class="room" style="--d:{t[1] + VOZ[1] * .55:.2f}s;width:90px;height:90px">S</div>
    <div class="room" style="--d:{t[1] + VOZ[1] * .62:.2f}s;width:120px;height:140px">M</div>
    <div class="room" style="--d:{t[1] + VOZ[1] * .69:.2f}s;width:150px;height:200px">L</div></div>
  <p class="lead pop" style="--d:{t[1] + VOZ[1] * .75:.2f}s">Más grande el ambiente → <b class="o">más BTU</b></p>'''),
    m.escena(2, E, f'''
  <h2 class="pop" style="--d:{t[2]+.3:.2f}s">Guía rápida 📏</h2>
  <div class="guide">{guia}</div>
  <p class="small pop" style="--d:{t[2] + 1.2 + 4 * paso_guia:.2f}s">Referencial · la visita técnica define el equipo exacto</p>'''),
    m.escena(3, E, f'''
  <h2 class="pop" style="--d:{t[3]+.3:.2f}s">¡Ojo! 👀 Sube <span class="o">un nivel</span> si…</h2>
  <div class="factors">{factores}</div>
  <div class="up pop" style="--d:{t[3] + 1.8 + 4 * paso_f:.2f}s">Ej.: 12 000 → 18 000 BTU</div>'''),
    m.escena(4, E, f'''
  <h2 class="pop" style="--d:{t[4]+.3:.2f}s">Ni muy chico,<br>ni muy grande ⚖️</h2>
  <div class="duo">
    <div class="card c pop" style="--d:{t[4]+1.0:.2f}s"><h3>😓 Muy chico</h3><p>Trabaja forzado y no enfría bien</p></div>
    <div class="card c pop" style="--d:{t[4] + VOZ[4] * .42:.2f}s"><h3>💸 Muy grande</h3><p>Gastaste de más</p></div></div>
  <div class="card i ok pop" style="--d:{t[4] + VOZ[4] * .78:.2f}s"><h3>✅ Lo ideal</h3><p>Medir bien el ambiente antes de comprar</p></div>'''),
    m.escena(5, E, m.cierre(LOGO, t[5], 'Medimos tu ambiente y<br>te recomendamos <span class="o">el equipo ideal</span>')),
])

HTML = m.pagina(LOGO, ESCENAS, CSS)

if "--vista" in sys.argv:
    hoja = sys.argv[sys.argv.index("--vista") + 1]
    m.vista(HTML, [b - .6 for _, b in E[:-1]] + [DUR - .3], hoja)
    print("vista", hoja, "duración", DUR)
else:
    m.renderizar(HTML, E, DUR, voz_dir, salida)
    print("ok", salida, "duración", DUR)
