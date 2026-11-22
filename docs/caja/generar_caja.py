"""
Caja semanal de AIRCONSOLUTION SERVICES SAC (Excel editable).

Hoja «Movimientos»: se anota cada entrada (cobro) y salida (gasto).
Hoja «Reporte»: se arma solo con fórmulas: lo de HOY, la semana día por día, la ganancia de la
semana, el detalle por categoría y por medio de pago, y un gráfico de entradas y salidas.

Uso:  python3 docs/caja/generar_caja.py <salida.xlsx> [--ejemplo | --datos movimientos.json]
      movimientos.json: lista de [fecha "AAAA-MM-DD", tipo, concepto, categoría, cliente, medio, monto].
      --ejemplo agrega movimientos de prueba (solo para revisar que las fórmulas funcionan).
"""
import datetime as dt
import json
import sys

from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

out = sys.argv[1]
EJEMPLO = "--ejemplo" in sys.argv[2:]
DATOS = sys.argv[sys.argv.index("--datos") + 1] if "--datos" in sys.argv else None

NAVY, BLUE, ORANGE, GREEN, RED = "0D1B2E", "1E88E5", "F5821F", "2BB673", "E5484D"
SKY, MUTED, LINE = "E8F2FD", "5D6B7A", "D9E0EA"
MONEY = '"S/ "#,##0.00;[Red]-"S/ "#,##0.00'
FONT = "Calibri"
N_ROWS = 300  # filas para anotar movimientos


def fill(c):
    return PatternFill("solid", start_color=c, end_color=c)


def f(size=10, bold=False, color="1D2733"):
    return Font(name=FONT, size=size, bold=bold, color=color)


thin = Side(style="thin", color=LINE)
box = Border(left=thin, right=thin, top=thin, bottom=thin)

INGRESOS = ["Venta de equipos", "Instalación", "Mantenimiento", "Reparación", "Instalaciones eléctricas",
            "Gasfitería", "Línea blanca", "Adelanto de cliente", "Otros ingresos"]
GASTOS = ["Compra de equipos", "Materiales", "Pago a técnicos", "Movilidad y combustible", "Herramientas",
          "Alquiler y servicios", "Publicidad", "Impuestos", "Otros gastos"]
MEDIOS = ["Efectivo", "Yape", "Plin", "Transferencia BCP", "Otra transferencia", "Depósito", "Tarjeta"]

wb = Workbook()

# ---------------- Hoja de listas (oculta) ----------------
ls = wb.create_sheet("Listas")
ls["A1"], ls["B1"], ls["C1"], ls["D1"] = "Tipo", "Categoría", "Medio", "Días"
for i, t in enumerate(["Entrada", "Salida"], 2):
    ls[f"A{i}"] = t
for i, c in enumerate(INGRESOS + GASTOS, 2):
    ls[f"B{i}"] = c
for i, m in enumerate(MEDIOS, 2):
    ls[f"C{i}"] = m
ls.sheet_state = "hidden"

# ---------------- Movimientos ----------------
mv = wb.active
mv.title = "Movimientos"
mv.sheet_view.showGridLines = False
for col, w in zip("ABCDEFG", (13, 11, 42, 24, 26, 20, 15)):
    mv.column_dimensions[col].width = w

mv.merge_cells("A1:G1")
mv["A1"] = "AIRCONSOLUTION SERVICES SAC  ·  CAJA: ENTRADAS Y SALIDAS"
mv["A1"].font = f(15, True, "FFFFFF")
mv["A1"].alignment = Alignment(vertical="center", indent=1)
for c in "ABCDEFG":
    mv[f"{c}1"].fill = fill(NAVY)
    mv[f"{c}2"].fill = fill(ORANGE)
mv.row_dimensions[1].height = 34
mv.row_dimensions[2].height = 4
mv.merge_cells("A3:G3")
mv["A3"] = ("Anota cada cobro como «Entrada» y cada gasto como «Salida». Escribe el monto siempre en positivo. "
            "El reporte de la semana se arma solo en la hoja «Reporte».")
mv["A3"].font = f(9.5, color=MUTED)
mv["A3"].alignment = Alignment(wrap_text=True, vertical="center", indent=1)
mv.row_dimensions[3].height = 30

HEAD = 5
for col, t in zip("ABCDEFG", ("FECHA", "TIPO", "CONCEPTO / DETALLE", "CATEGORÍA", "CLIENTE O PROVEEDOR",
                              "MEDIO DE PAGO", "MONTO (S/)")):
    c = mv[f"{col}{HEAD}"]
    c.value = t
    c.font = f(10, True, "FFFFFF")
    c.fill = fill(NAVY)
    c.alignment = Alignment(horizontal="center", vertical="center")
mv.row_dimensions[HEAD].height = 24
mv.freeze_panes = f"A{HEAD + 1}"
FIRST, LAST = HEAD + 1, HEAD + N_ROWS

dv_tipo = DataValidation(type="list", formula1="=Listas!$A$2:$A$3", allow_blank=True,
                         error="Elige Entrada o Salida.", showErrorMessage=True)
dv_cat = DataValidation(type="list", formula1=f"=Listas!$B$2:$B${1 + len(INGRESOS) + len(GASTOS)}", allow_blank=True)
dv_medio = DataValidation(type="list", formula1=f"=Listas!$C$2:$C${1 + len(MEDIOS)}", allow_blank=True)
dv_monto = DataValidation(type="decimal", operator="greaterThanOrEqual", formula1="0", allow_blank=True,
                          error="Escribe el monto en positivo (sin signo menos).", showErrorMessage=True)
dv_fecha = DataValidation(type="date", operator="between", formula1="DATE(2020,1,1)", formula2="DATE(2100,12,31)",
                          allow_blank=True, error="Escribe una fecha, por ejemplo 22/11/2026.", showErrorMessage=True)
for dv in (dv_tipo, dv_cat, dv_medio, dv_monto, dv_fecha):
    mv.add_data_validation(dv)
dv_fecha.add(f"A{FIRST}:A{LAST}")
dv_tipo.add(f"B{FIRST}:B{LAST}")
dv_cat.add(f"D{FIRST}:D{LAST}")
dv_medio.add(f"F{FIRST}:F{LAST}")
dv_monto.add(f"G{FIRST}:G{LAST}")

for r in range(FIRST, LAST + 1):
    mv[f"A{r}"].number_format = "dd/mm/yyyy"
    mv[f"G{r}"].number_format = MONEY
    for c in "ABCDEFG":
        mv[f"{c}{r}"].border = Border(bottom=thin)
        mv[f"{c}{r}"].font = f(10)
    mv[f"A{r}"].alignment = mv[f"B{r}"].alignment = Alignment(horizontal="center")

# Colores: entradas en verde y salidas en rojo.
rng = f"A{FIRST}:G{LAST}"
mv.conditional_formatting.add(rng, FormulaRule(formula=[f'$B{FIRST}="Entrada"'], fill=fill("EAF8F0")))
mv.conditional_formatting.add(rng, FormulaRule(formula=[f'$B{FIRST}="Salida"'], fill=fill("FDECEC")))
mv.conditional_formatting.add(f"G{FIRST}:G{LAST}", FormulaRule(formula=[f'$B{FIRST}="Entrada"'], font=Font(bold=True, color="1E8F55")))
mv.conditional_formatting.add(f"G{FIRST}:G{LAST}", FormulaRule(formula=[f'$B{FIRST}="Salida"'], font=Font(bold=True, color="C0392B")))

if DATOS:
    for i, (fe, t, c, cat, cli, m, monto) in enumerate(json.load(open(DATOS, encoding="utf-8"))):
        r = FIRST + i
        mv[f"A{r}"] = dt.date.fromisoformat(fe)
        mv[f"B{r}"], mv[f"C{r}"], mv[f"D{r}"] = t, c, cat or None
        mv[f"E{r}"], mv[f"F{r}"], mv[f"G{r}"] = cli or None, m or None, monto

if EJEMPLO:
    hoy = dt.date(2026, 11, 22)
    lunes = hoy - dt.timedelta(days=hoy.weekday())
    datos = [
        (0, "Entrada", "Mantenimiento de 2 splits", "Mantenimiento", "Cliente casa", "Yape", 240),
        (0, "Salida", "Gasolina", "Movilidad y combustible", "Grifo", "Efectivo", 40),
        (1, "Entrada", "Adelanto 60 % instalación", "Adelanto de cliente", "Michelle Salinas", "Transferencia BCP", 1062),
        (2, "Salida", "Tubería de cobre y armaflex", "Materiales", "Ferretería", "Efectivo", 320),
        (3, "Entrada", "Venta de equipos (100 %)", "Venta de equipos", "Michelle Salinas", "Transferencia BCP", 7139),
        (3, "Salida", "Compra de 2 equipos LG", "Compra de equipos", "ColdSmart", "Transferencia BCP", 5121.20),
        (5, "Entrada", "Reparación de equipo", "Reparación", "Cliente local", "Efectivo", 180),
        (6, "Salida", "Pago a técnico ayudante", "Pago a técnicos", "Ayudante", "Yape", 150),
        (6, "Entrada", "Mantenimiento split", "Mantenimiento", "Cliente casa", "Plin", 120),
    ]
    for i, (d, t, c, cat, cli, m, monto) in enumerate(datos):
        r = FIRST + i
        mv[f"A{r}"] = lunes + dt.timedelta(days=d)
        mv[f"B{r}"], mv[f"C{r}"], mv[f"D{r}"], mv[f"E{r}"], mv[f"F{r}"], mv[f"G{r}"] = t, c, cat, cli, m, monto

# ---------------- Reporte ----------------
rp = wb.create_sheet("Reporte", 0)
rp.sheet_view.showGridLines = False
for col, w in zip("ABCDEFGH", (3, 16, 14, 17, 17, 17, 3, 3)):
    rp.column_dimensions[col].width = w

M = "Movimientos"
FECHAS, TIPOS, CATS, MEDS, MONTOS = (f"{M}!$A${FIRST}:$A${LAST}", f"{M}!$B${FIRST}:$B${LAST}",
                                     f"{M}!$D${FIRST}:$D${LAST}", f"{M}!$F${FIRST}:$F${LAST}",
                                     f"{M}!$G${FIRST}:$G${LAST}")

rp.merge_cells("B1:F1")
rp["B1"] = "REPORTE DE CAJA"
rp["B1"].font = f(20, True, "FFFFFF")
rp.merge_cells("B2:F2")
rp["B2"] = "AIRCONSOLUTION SERVICES SAC  ·  Aire acondicionado en Lima"
rp["B2"].font = f(10, True, "9FC4EE")
for r in (1, 2):
    for c in "ABCDEFG":
        rp[f"{c}{r}"].fill = fill(NAVY)
    rp[f"B{r}"].alignment = Alignment(vertical="center")
rp.row_dimensions[1].height = 36
rp.row_dimensions[2].height = 20
for c in "ABCDEFG":
    rp[f"{c}3"].fill = fill(ORANGE)
rp.row_dimensions[3].height = 4

# Semana a revisar (lunes): por defecto la semana actual; se puede cambiar.
rp["B5"] = "Semana del (lunes):"
rp["B5"].font = f(10, True, NAVY)
rp["D5"] = "=TODAY()-WEEKDAY(TODAY(),2)+1"
rp["D5"].number_format = "dd/mm/yyyy"
rp["D5"].font = f(11, True, NAVY)
rp["D5"].fill = fill("FFF4E5")
rp["D5"].border = box
rp["D5"].alignment = Alignment(horizontal="center")
rp["E5"] = "=\"al \"&TEXT(D5+6,\"dd/mm/yyyy\")"
rp["E5"].font = f(10, color=MUTED)
rp["B6"] = "Para ver otra semana, escribe la fecha de su lunes en la celda naranja."
rp["B6"].font = f(8.5, color=MUTED)


def kpi(row, col1, col2, label, formula, color):
    rp.merge_cells(f"{col1}{row}:{col2}{row}")
    rp.merge_cells(f"{col1}{row+1}:{col2}{row+1}")
    rp[f"{col1}{row}"] = label
    rp[f"{col1}{row}"].font = f(9, True, "FFFFFF")
    rp[f"{col1}{row+1}"] = formula
    rp[f"{col1}{row+1}"].font = f(16, True, "FFFFFF")
    rp[f"{col1}{row+1}"].number_format = MONEY.replace(";[Red]", ";")
    for r in (row, row + 1):
        for c in range(ord(col1), ord(col2) + 1):
            rp[f"{chr(c)}{r}"].fill = fill(color)
        rp[f"{col1}{r}"].alignment = Alignment(horizontal="center", vertical="center")
    rp.row_dimensions[row].height = 18
    rp.row_dimensions[row + 1].height = 30


# HOY
rp["B8"] = "HOY"
rp["B8"].font = f(11, True, BLUE)
rp["D8"] = "=TODAY()"
rp["D8"].number_format = "[$-es-PE]dddd dd/mm/yyyy"
rp["D8"].font = f(10, color=MUTED)
kpi(9, "B", "C", "ENTRÓ HOY", f'=SUMIFS({MONTOS},{TIPOS},"Entrada",{FECHAS},TODAY())', GREEN)
kpi(9, "D", "D", "SALIÓ HOY", f'=SUMIFS({MONTOS},{TIPOS},"Salida",{FECHAS},TODAY())', RED)
kpi(9, "E", "F", "QUEDÓ HOY", "=B10-D10", NAVY)

# SEMANA
rp["B12"] = "ESTA SEMANA"
rp["B12"].font = f(11, True, BLUE)
kpi(13, "B", "C", "ENTRADAS DE LA SEMANA",
    f'=SUMIFS({MONTOS},{TIPOS},"Entrada",{FECHAS},">="&$D$5,{FECHAS},"<="&$D$5+6)', GREEN)
kpi(13, "D", "D", "SALIDAS",
    f'=SUMIFS({MONTOS},{TIPOS},"Salida",{FECHAS},">="&$D$5,{FECHAS},"<="&$D$5+6)', RED)
kpi(13, "E", "F", "GANANCIA DE LA SEMANA", "=B14-D14", ORANGE)

# Día por día
T = 17
for col, t in zip("BCDEF", ("DÍA", "FECHA", "ENTRADAS", "SALIDAS", "QUEDÓ")):
    c = rp[f"{col}{T}"]
    c.value = t
    c.font = f(9.5, True, "FFFFFF")
    c.fill = fill(NAVY)
    c.alignment = Alignment(horizontal="center", vertical="center")
rp.row_dimensions[T].height = 22
DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
for i, d in enumerate(DIAS):
    r = T + 1 + i
    rp[f"B{r}"] = d
    rp[f"C{r}"] = f"=$D$5+{i}"
    rp[f"C{r}"].number_format = "dd/mm"
    rp[f"D{r}"] = f'=SUMIFS({MONTOS},{TIPOS},"Entrada",{FECHAS},C{r})'
    rp[f"E{r}"] = f'=SUMIFS({MONTOS},{TIPOS},"Salida",{FECHAS},C{r})'
    rp[f"F{r}"] = f"=D{r}-E{r}"
    for c in "BCDEF":
        rp[f"{c}{r}"].border = Border(bottom=thin)
        rp[f"{c}{r}"].font = f(10)
    for c in "DEF":
        rp[f"{c}{r}"].number_format = MONEY
    rp[f"C{r}"].alignment = Alignment(horizontal="center")
    rp[f"D{r}"].font = f(10, color="1E8F55")
    rp[f"E{r}"].font = f(10, color="C0392B")
    rp[f"F{r}"].font = f(10, True, NAVY)
TOT = T + 8
rp[f"B{TOT}"] = "TOTAL SEMANA"
rp[f"D{TOT}"] = f"=SUM(D{T+1}:D{T+7})"
rp[f"E{TOT}"] = f"=SUM(E{T+1}:E{T+7})"
rp[f"F{TOT}"] = f"=SUM(F{T+1}:F{T+7})"
for c in "BCDEF":
    rp[f"{c}{TOT}"].fill = fill(SKY)
    rp[f"{c}{TOT}"].font = f(10.5, True, NAVY)
    rp[f"{c}{TOT}"].border = Border(top=Side(style="medium", color=NAVY))
for c in "DEF":
    rp[f"{c}{TOT}"].number_format = MONEY
# Resalta el día de hoy en la tabla.
rp.conditional_formatting.add(f"B{T+1}:F{T+7}", FormulaRule(formula=[f"$C{T+1}=TODAY()"], fill=fill("FFF4E5"),
                                                             font=Font(bold=True)))

# Gráfico de entradas y salidas por día
chart = BarChart()
chart.type = "col"
chart.title = "Entradas y salidas por día"
chart.y_axis.title = "S/"
chart.y_axis.numFmt = '"S/ "#,##0'
chart.height, chart.width = 7.5, 16.5
data = Reference(rp, min_col=4, max_col=5, min_row=T, max_row=T + 7)
cats = Reference(rp, min_col=2, min_row=T + 1, max_row=T + 7)
chart.add_data(data, titles_from_data=True)
chart.set_categories(cats)
chart.series[0].graphicalProperties.solidFill = GREEN
chart.series[1].graphicalProperties.solidFill = RED
chart.legend.position = "b"
rp.add_chart(chart, f"B{TOT + 2}")

# Detalle por categoría y por medio de pago (de la semana)
D0 = TOT + 18


def detail(row, title, items, crit_range, tipo, color):
    rp.merge_cells(f"B{row}:D{row}")
    rp[f"B{row}"] = title
    rp[f"B{row}"].font = f(10, True, "FFFFFF")
    rp[f"E{row}"] = "SEMANA"
    rp[f"E{row}"].font = f(9, True, "FFFFFF")
    for c in "BCDE":
        rp[f"{c}{row}"].fill = fill(color)
    rp[f"E{row}"].alignment = Alignment(horizontal="right")
    for i, it in enumerate(items, 1):
        r = row + i
        rp.merge_cells(f"B{r}:D{r}")
        rp[f"B{r}"] = it
        tipo_crit = f',{TIPOS},"{tipo}"' if tipo else ""
        rp[f"E{r}"] = (f'=SUMIFS({MONTOS},{crit_range},B{r}{tipo_crit},{FECHAS},">="&$D$5,'
                       f'{FECHAS},"<="&$D$5+6)')
        rp[f"E{r}"].number_format = MONEY
        for c in "BCDE":
            rp[f"{c}{r}"].border = Border(bottom=thin)
            rp[f"{c}{r}"].font = f(10)
    return row + len(items) + 2


nxt = detail(D0, "¿DE DÓNDE ENTRÓ EL DINERO?", INGRESOS, CATS, "Entrada", GREEN)
nxt = detail(nxt, "¿EN QUÉ SE GASTÓ?", GASTOS, CATS, "Salida", RED)
rp.merge_cells(f"B{nxt}:D{nxt}")
rp[f"B{nxt}"] = "COBROS POR MEDIO DE PAGO"
rp[f"B{nxt}"].font = f(10, True, "FFFFFF")
rp[f"E{nxt}"] = "SEMANA"
rp[f"E{nxt}"].font = f(9, True, "FFFFFF")
rp[f"E{nxt}"].alignment = Alignment(horizontal="right")
for c in "BCDE":
    rp[f"{c}{nxt}"].fill = fill(BLUE)
for i, m in enumerate(MEDIOS, 1):
    r = nxt + i
    rp.merge_cells(f"B{r}:D{r}")
    rp[f"B{r}"] = m
    rp[f"E{r}"] = (f'=SUMIFS({MONTOS},{MEDS},B{r},{TIPOS},"Entrada",{FECHAS},">="&$D$5,{FECHAS},"<="&$D$5+6)')
    rp[f"E{r}"].number_format = MONEY
    for c in "BCDE":
        rp[f"{c}{r}"].border = Border(bottom=thin)
        rp[f"{c}{r}"].font = f(10)
END = nxt + len(MEDIOS)

# Impresión: A4 vertical, ancho de una hoja.
for ws, area in ((rp, f"A1:G{END}"), (mv, f"A1:G{LAST}")):
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.orientation = "portrait"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_area = area
    ws.page_margins.left = ws.page_margins.right = 0.4
wb.active = 0
wb.save(out)
print("ok", out)
