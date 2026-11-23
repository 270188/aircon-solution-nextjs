"""
Seguimiento de cotizaciones de AIRCONSOLUTION SERVICES SAC (Excel editable).

Hojas:
  - «Cómo usar»: la rutina de 5 minutos al día.
  - «Cotizaciones»: una fila por cotización. Según los días desde que se envió y su estado, la fila dice
    qué hacer hoy, arma el mensaje de WhatsApp con el nombre, número y monto, y da un enlace que abre
    WhatsApp con el mensaje ya escrito.
  - «Mensajes»: las plantillas (se pueden editar; {nombre}, {numero}, {monto}, {vence}, {trabajo}).
  - «Resumen»: cuánto está pendiente, cuánto se ganó y la tasa de cierre.

Uso:  python3 docs/seguimiento/generar_seguimiento.py <salida.xlsx> [--datos cotizaciones.json]
      cotizaciones.json: lista de objetos {numero, fecha AAAA-MM-DD, cliente, telefono, trabajo, monto, estado, notas}
"""
import datetime as dt
import json
import sys

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

out = sys.argv[1]
DATOS = json.load(open(sys.argv[sys.argv.index("--datos") + 1], encoding="utf-8")) if "--datos" in sys.argv else []

NAVY, BLUE, ORANGE, GREEN, RED, MUTED, LINE = "0D1B2E", "1E88E5", "F5821F", "2BB673", "E5484D", "5D6B7A", "D9E0EA"
FONT = "Calibri"
VALIDEZ = 15  # días de validez de las cotizaciones


def fill(c):
    return PatternFill("solid", start_color=c, end_color=c)


def f(size=10, bold=False, color="1D2733"):
    return Font(name=FONT, size=size, bold=bold, color=color)


thin = Side(style="thin", color=LINE)


def titulo(ws, texto, ancho_cols, sub=None):
    ws.merge_cells(f"A1:{ancho_cols}1")
    ws["A1"] = texto
    ws["A1"].font = f(15, True, "FFFFFF")
    ws["A1"].alignment = Alignment(vertical="center", indent=1)
    ws.row_dimensions[1].height = 34
    last = ord(ancho_cols) - 64
    for i in range(1, last + 1):
        ws.cell(1, i).fill = fill(NAVY)
        ws.cell(2, i).fill = fill(ORANGE)
    ws.row_dimensions[2].height = 4
    if sub:
        ws.merge_cells(f"A3:{ancho_cols}3")
        ws["A3"] = sub
        ws["A3"].font = f(9.5, color=MUTED)
        ws["A3"].alignment = Alignment(wrap_text=True, vertical="center", indent=1)
        ws.row_dimensions[3].height = 30


wb = Workbook()

# ---------------- Mensajes ----------------
ETAPAS = [
    ("Día 2", "Confirmar que la recibió",
     "Hola {nombre} 👋, le saluda Clever de AIRCONSOLUTION SERVICES SAC. Le escribo para confirmar que recibió "
     "nuestra cotización {numero} ({trabajo}) por S/ {monto}. ¿Tiene alguna duda que le pueda resolver? "
     "Quedo atento. 🙌"),
    ("Día 5", "Resolver dudas y dar confianza",
     "Hola {nombre}, ¿pudo revisar la cotización {numero}? Le recuerdo que incluye garantía por escrito y "
     "trabajamos con más de 20 años de experiencia. Si desea, podemos ajustar algún detalle o agendar la "
     "visita en la fecha que le acomode. 📅"),
    ("Vence pronto", "Avisar que se vence",
     "Hola {nombre}, le comento que la cotización {numero} por S/ {monto} está vigente hasta el {vence}. "
     "Después de esa fecha los precios de equipos y materiales pueden cambiar. ¿Le reservo la fecha de "
     "instalación? 😊"),
    ("Vencida", "Reactivar al cliente",
     "Hola {nombre}, ¿cómo está? La cotización {numero} ya venció, pero con gusto se la actualizo sin compromiso. "
     "¿Sigue interesado(a) en {trabajo}? Estamos para ayudarle. ❄️"),
    ("Agradecer", "Trabajo terminado: gracias y reseña",
     "¡Muchas gracias por su confianza, {nombre}! 🙏 Fue un gusto atenderle. Si quedó contento(a) con nuestro "
     "trabajo, nos ayudaría mucho con una reseña en Google ⭐. Le recordamos que el mantenimiento se recomienda "
     "cada 6 meses; le escribiremos para agendarlo. ❄️ AIRCONSOLUTION SERVICES SAC · 985 899 731"),
    ("Mantenimiento", "6 meses después del trabajo",
     "Hola {nombre} 👋, ya pasaron unos meses desde su instalación con AIRCONSOLUTION. Para que su aire siga "
     "enfriando bien y gaste menos luz, le recomendamos el mantenimiento. ¿Le agendamos una visita? 📅"),
]
EXTRA = [
    ("«Está caro»",
     "Entiendo, {nombre}. Nuestro precio incluye materiales de calidad, instalación con vacío y prueba de fugas, "
     "y garantía por escrito, para que no tenga problemas después. Si desea, puedo revisar opciones para "
     "ajustar el presupuesto sin bajar la calidad. 👍"),
    ("«Lo voy a pensar»",
     "¡Claro, {nombre}! Tómese su tiempo. ¿Hay algo de la cotización que le genere duda? Así le ayudo a decidir "
     "con toda la información. 😊"),
    ("«Ya contraté a otro»",
     "Gracias por avisarme, {nombre}. Cualquier cosa que necesite más adelante —mantenimiento, reparación o un "
     "nuevo equipo— aquí estamos. ¡Éxitos! ❄️"),
]

ms = wb.active
ms.title = "Mensajes"
titulo(ms, "MENSAJES DE WHATSAPP PARA SEGUIMIENTO", "C",
       "Puedes editar los textos. Las palabras entre llaves se reemplazan solas en la hoja «Cotizaciones»: "
       "{nombre}, {numero}, {monto}, {vence} y {trabajo}.")
ms.column_dimensions["A"].width = 16
ms.column_dimensions["B"].width = 30
ms.column_dimensions["C"].width = 95
for col, t in zip("ABC", ("ETAPA", "CUÁNDO", "MENSAJE")):
    ms[f"{col}5"] = t
    ms[f"{col}5"].font = f(10, True, "FFFFFF")
    ms[f"{col}5"].fill = fill(NAVY)
for i, (et, cuando, msg) in enumerate(ETAPAS, 6):
    ms[f"A{i}"], ms[f"B{i}"], ms[f"C{i}"] = et, cuando, msg
for i, (et, msg) in enumerate(EXTRA, 6 + len(ETAPAS) + 1):
    ms[f"A{i}"], ms[f"B{i}"], ms[f"C{i}"] = et, "Respuesta a objeción", msg
ms[f"A{6 + len(ETAPAS)}"] = "RESPUESTAS"
ms[f"A{6 + len(ETAPAS)}"].font = f(10, True, BLUE)
for r in range(6, 6 + len(ETAPAS) + len(EXTRA) + 1):
    if r != 6 + len(ETAPAS):
        ms[f"A{r}"].font = f(10, True, NAVY)
    ms[f"B{r}"].font = f(9.5, color=MUTED)
    ms[f"C{r}"].alignment = Alignment(wrap_text=True, vertical="top")
    for c in "ABC":
        ms[f"{c}{r}"].border = Border(bottom=thin)
        if c != "C":
            ms[f"{c}{r}"].alignment = Alignment(vertical="top", wrap_text=True)
    ms.row_dimensions[r].height = 62
MSG_RANGO = f"Mensajes!$A$6:$C${5 + len(ETAPAS)}"

# ---------------- Cotizaciones ----------------
cz = wb.create_sheet("Cotizaciones", 0)
titulo(cz, "SEGUIMIENTO DE COTIZACIONES · AIRCONSOLUTION SERVICES SAC", "M",
       "Llena una fila por cada cotización y cambia el ESTADO cuando el cliente responda. "
       "La columna «¿Qué hago hoy?» se calcula sola; las filas en naranja son para escribir HOY. "
       "Toca «Abrir WhatsApp» para enviar el mensaje ya escrito (el teléfono va sin espacios: 9XXXXXXXX).")
COLS = [("A", "N.° COTIZACIÓN", 15), ("B", "FECHA", 11), ("C", "CLIENTE", 26), ("D", "TELÉFONO", 13),
        ("E", "TRABAJO", 34), ("F", "MONTO (S/)", 13), ("G", "ESTADO", 13), ("H", "DÍAS", 7),
        ("I", "VENCE", 11), ("J", "¿QUÉ HAGO HOY?", 22), ("K", "MENSAJE LISTO PARA COPIAR", 60),
        ("L", "WHATSAPP", 15), ("M", "NOTAS", 28)]
HEAD = 5
for col, t, w in COLS:
    cz.column_dimensions[col].width = w
    c = cz[f"{col}{HEAD}"]
    c.value = t
    c.font = f(9.5, True, "FFFFFF")
    c.fill = fill(NAVY)
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
cz.row_dimensions[HEAD].height = 30
cz.freeze_panes = f"D{HEAD + 1}"
FIRST, N = HEAD + 1, 150
LAST = FIRST + N - 1

ESTADOS = ["Enviada", "Respondió", "Negociando", "Aceptada", "Trabajo hecho", "Perdida", "Reemplazada"]
dv = DataValidation(type="list", formula1='"' + ",".join(ESTADOS) + '"', allow_blank=True)
cz.add_data_validation(dv)
dv.add(f"G{FIRST}:G{LAST}")


def etapa(r):
    abiertos = f'OR(G{r}="Enviada",G{r}="Respondió",G{r}="Negociando")'
    return (f'IF(A{r}="","",IF(G{r}="Trabajo hecho","Agradecer",IF({abiertos},'
            f'IF(H{r}<2,"Esperar",IF(H{r}<5,"Día 2",IF(H{r}<{VALIDEZ - 3},"Día 5",IF(H{r}<={VALIDEZ},"Vence pronto","Vencida")))),"—")))')


for i in range(N):
    r = FIRST + i
    cz[f"B{r}"].number_format = "dd/mm/yyyy"
    cz[f"F{r}"].number_format = '"S/ "#,##0.00'
    cz[f"H{r}"] = f'=IF(B{r}="","",TODAY()-B{r})'
    cz[f"I{r}"] = f'=IF(B{r}="","",B{r}+{VALIDEZ})'
    cz[f"I{r}"].number_format = "dd/mm/yyyy"
    cz[f"J{r}"] = f"={etapa(r)}"
    plantilla = f"VLOOKUP(J{r},{MSG_RANGO},3,FALSE)"
    msg = (f'SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE({plantilla},"{{nombre}}",C{r}),'
           f'"{{numero}}",A{r}),"{{monto}}",TEXT(F{r},"#,##0.00")),"{{vence}}",TEXT(I{r},"dd/mm/yyyy")),"{{trabajo}}",LOWER(LEFT(E{r},1))&MID(E{r},2,300))')
    cz[f"K{r}"] = f'=IF(OR(J{r}="",J{r}="Esperar",J{r}="—"),"",{msg})'
    cz[f"L{r}"] = (f'=IF(OR(K{r}="",D{r}=""),"",HYPERLINK("https://wa.me/51"&SUBSTITUTE(D{r}," ","")&"?text="&'
                   f'_xlfn.ENCODEURL(K{r}),"📲 Abrir WhatsApp"))')
    for c, _, _ in COLS:
        cz[f"{c}{r}"].border = Border(bottom=thin)
        cz[f"{c}{r}"].font = f(10)
        cz[f"{c}{r}"].alignment = Alignment(vertical="top", wrap_text=c in "CEKM")
    cz[f"J{r}"].font = f(10, True, NAVY)
    cz[f"K{r}"].font = f(9.5)
    cz[f"L{r}"].font = Font(name=FONT, size=10, bold=True, color="1E8F55", underline="single")
    for c in "BGHI":
        cz[f"{c}{r}"].alignment = Alignment(horizontal="center", vertical="top")

rango = f"A{FIRST}:M{LAST}"
hoy = f'OR($J{FIRST}="Día 2",$J{FIRST}="Día 5",$J{FIRST}="Vence pronto",$J{FIRST}="Agradecer")'
cz.conditional_formatting.add(rango, FormulaRule(formula=[hoy], fill=fill("FFE9D2")))
cz.conditional_formatting.add(rango, FormulaRule(formula=[f'$J{FIRST}="Vencida"'], fill=fill("FDECEC")))
cz.conditional_formatting.add(rango, FormulaRule(formula=[f'OR($G{FIRST}="Aceptada",$G{FIRST}="Trabajo hecho")'],
                                                 fill=fill("EAF8F0")))
cz.conditional_formatting.add(rango, FormulaRule(formula=[f'OR($G{FIRST}="Perdida",$G{FIRST}="Reemplazada")'],
                                                 font=Font(color="9AA5B1")))

for i, d in enumerate(DATOS):
    r = FIRST + i
    cz[f"A{r}"] = d["numero"]
    cz[f"B{r}"] = dt.date.fromisoformat(d["fecha"])
    cz[f"C{r}"] = d["cliente"]
    cz[f"D{r}"] = d.get("telefono") or None
    cz[f"E{r}"] = d["trabajo"]
    cz[f"F{r}"] = d["monto"]
    cz[f"G{r}"] = d.get("estado", "Enviada")
    cz[f"M{r}"] = d.get("notas") or None
    cz.row_dimensions[r].height = 64

# ---------------- Resumen ----------------
rs = wb.create_sheet("Resumen", 1)
titulo(rs, "RESUMEN DE COTIZACIONES", "D")
rs.column_dimensions["A"].width = 3
rs.column_dimensions["B"].width = 34
rs.column_dimensions["C"].width = 12
rs.column_dimensions["D"].width = 18
G, F, J = f"Cotizaciones!$G${FIRST}:$G${LAST}", f"Cotizaciones!$F${FIRST}:$F${LAST}", f"Cotizaciones!$J${FIRST}:$J${LAST}"
for col, t in zip("BCD", ("ESTADO", "CANTIDAD", "MONTO")):
    rs[f"{col}5"] = t
    rs[f"{col}5"].font = f(10, True, "FFFFFF")
    rs[f"{col}5"].fill = fill(NAVY)
for i, e in enumerate(ESTADOS, 6):
    rs[f"B{i}"] = e
    rs[f"C{i}"] = f'=COUNTIF({G},B{i})'
    rs[f"D{i}"] = f'=SUMIF({G},B{i},{F})'
    rs[f"D{i}"].number_format = '"S/ "#,##0.00'
    for c in "BCD":
        rs[f"{c}{i}"].border = Border(bottom=thin)
k = 6 + len(ESTADOS) + 1
filas = [
    ("💬 Para escribir HOY", f'=COUNTIF({J},"Día 2")+COUNTIF({J},"Día 5")+COUNTIF({J},"Vence pronto")+COUNTIF({J},"Agradecer")', None),
    ("⏳ Dinero pendiente (en seguimiento)",
     f'=COUNTIF({G},"Enviada")+COUNTIF({G},"Respondió")+COUNTIF({G},"Negociando")',
     f'=SUMIF({G},"Enviada",{F})+SUMIF({G},"Respondió",{F})+SUMIF({G},"Negociando",{F})'),
    ("✅ Ganado (aceptadas + hechas)", f'=C9+C10', f'=D9+D10'),
    ("📈 Tasa de cierre", '=IFERROR((C9+C10)/(C9+C10+C11),"—")', None),
]
for i, (t, c, d) in enumerate(filas):
    r = k + i
    rs[f"B{r}"] = t
    rs[f"C{r}"] = c
    if d:
        rs[f"D{r}"] = d
        rs[f"D{r}"].number_format = '"S/ "#,##0.00'
    for col in "BCD":
        rs[f"{col}{r}"].font = f(11, True, NAVY)
        rs[f"{col}{r}"].fill = fill("FFF4E5")
rs[f"C{k + 3}"].number_format = "0%"

# ---------------- Cómo usar ----------------
cu = wb.create_sheet("Cómo usar", 0)
titulo(cu, "CÓMO HACER SEGUIMIENTO A TUS CLIENTES (5 MINUTOS AL DÍA)", "B")
cu.column_dimensions["A"].width = 6
cu.column_dimensions["B"].width = 110
pasos = [
    ("1", "Cada vez que envías una cotización, anótala en «Cotizaciones»: número, fecha, cliente, teléfono (sin espacios), trabajo y monto. Estado: «Enviada»."),
    ("2", "Cada mañana abre la hoja «Cotizaciones». Las filas en NARANJA son las que debes escribir hoy."),
    ("3", "Toca «📲 Abrir WhatsApp»: se abre el chat con el mensaje ya escrito. Revísalo y envíalo. (O copia el texto de «Mensaje listo».)"),
    ("4", "Cuando el cliente responda, cambia el ESTADO: Respondió · Negociando · Aceptada · Perdida. Si haces una nueva versión, marca la anterior como «Reemplazada»."),
    ("5", "Cuando termines el trabajo, pon «Trabajo hecho»: te sugerirá agradecer y pedir una reseña en Google ⭐."),
    ("", ""),
    ("⏱️", "El sistema sigue este calendario: Día 2 → confirmar que la recibió · Día 5 → resolver dudas · Últimos 3 días → avisar que vence · Después de 15 días → reactivar."),
    ("💡", "Regla de oro: máximo 3 mensajes por cotización. Sé amable, nunca insistente. Si el cliente dice que no, márcala como «Perdida» y anota el motivo en NOTAS (te ayuda a mejorar)."),
    ("🔁", "6 meses después de cada trabajo, usa el mensaje «Mantenimiento» de la hoja «Mensajes»: es tu cliente más fácil de recuperar."),
]
for i, (n, t) in enumerate(pasos, 4):
    cu[f"A{i}"], cu[f"B{i}"] = n, t
    cu[f"A{i}"].font = f(14, True, ORANGE)
    cu[f"A{i}"].alignment = Alignment(horizontal="center", vertical="center")
    cu[f"B{i}"].font = f(11)
    cu[f"B{i}"].alignment = Alignment(wrap_text=True, vertical="center")
    cu.row_dimensions[i].height = 36 if t else 10

for ws in (cu, cz, rs, ms):
    ws.sheet_view.showGridLines = False
    ws.page_setup.orientation = "landscape"
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
wb.active = 1  # abre en «Cotizaciones»
wb.save(out)
print("ok", out)
