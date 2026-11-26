"""
Genera la plantilla de cotización EDITABLE en Excel (.xlsx) de AIRCONSOLUTION SERVICES SAC.

- Mismo diseño que el PDF: cabecera azul marino, acentos naranja, tabla de partidas y totales.
- Fórmulas: importe = cantidad × precio, subtotal, IGV 18 %, total y fecha de validez.
- Sello de agua: el logo, tenue e inclinado, como imagen de encabezado de página. Así lo hace
  Excel: se ve detrás de las celdas en la vista "Diseño de página" y al imprimir o guardar en PDF.

Uso:  python3 docs/cotizacion/generar_excel.py <logo.png> <salida.xlsx> [--sin-sello]
"""
import datetime as dt
import io
import pathlib
import re
import shutil
import sys
import tempfile
import zipfile

from openpyxl import Workbook
from openpyxl.cell.rich_text import CellRichText, TextBlock
from openpyxl.cell.text import InlineFont
from openpyxl.comments import Comment
from openpyxl.drawing.image import Image as XLImage
from openpyxl.styles import Alignment, Border, Font, GradientFill, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation
from PIL import Image, ImageDraw

logo_src = pathlib.Path(sys.argv[1])
out_path = pathlib.Path(sys.argv[2])
# --sin-sello: versión de respaldo sin la imagen de encabezado (solo lo que escribe openpyxl).
SIN_SELLO = "--sin-sello" in sys.argv[3:]

# ---------- Imágenes ----------
logo = Image.open(logo_src).convert("RGBA")
bbox = logo.getbbox()
logo = logo.crop(bbox)


def badge_png(size=150) -> bytes:
    """Logo dentro de un círculo blanco (para la cabecera azul)."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, size - 1, size - 1), fill=(255, 255, 255, 255))
    inner = int(size * 0.82)
    lg = logo.copy()
    lg.thumbnail((inner, inner), Image.LANCZOS)
    img.alpha_composite(lg, ((size - lg.width) // 2, (size - lg.height) // 2))
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()


def watermark_png(strength=0.085) -> bytes:
    """Logo muy tenue sobre blanco e inclinado, para el sello de agua."""
    lg = logo.copy()
    lg.thumbnail((1000, 1000), Image.LANCZOS)
    white = Image.new("RGBA", lg.size, (255, 255, 255, 255))
    faded = Image.blend(white, Image.alpha_composite(white, lg), strength)
    rotated = faded.rotate(12, expand=True, resample=Image.BICUBIC, fillcolor=(255, 255, 255, 255))
    buf = io.BytesIO()
    rotated.convert("RGB").save(buf, "PNG", optimize=True)
    return buf.getvalue(), rotated.size


BADGE = badge_png()
WM, WM_SIZE = watermark_png()

# ---------- Estilos ----------
NAVY, NAVY2, BLUE, SKY = "0D1B2E", "152A45", "1E88E5", "E8F2FD"
ORANGE, ORANGE2, INK, MUTED, LINE = "F5821F", "E06A0A", "1D2733", "5D6B7A", "D9E0EA"
FONT = "Calibri"


def fill(c):
    return PatternFill("solid", start_color=c, end_color=c)


def f(size=10, bold=False, color=INK, italic=False):
    return Font(name=FONT, size=size, bold=bold, color=color, italic=italic)


thin = Side(style="thin", color=LINE)
navy_side = Side(style="medium", color=NAVY)
MONEY = '"S/ "#,##0.00'

wb = Workbook()
ws = wb.active
ws.title = "Cotización"
ws.sheet_view.showGridLines = False

widths = {"A": 9, "B": 46, "C": 9, "D": 11, "E": 15, "F": 16}
for col, w in widths.items():
    ws.column_dimensions[col].width = w


def band(row, color, height=None):
    for col in "ABCDEF":
        ws[f"{col}{row}"].fill = fill(color)
    if height:
        ws.row_dimensions[row].height = height


def box(r1, r2, c1, c2):
    """Borde fino alrededor de un rango (recuadro)."""
    cols = "ABCDEF"
    i1, i2 = cols.index(c1), cols.index(c2)
    for r in range(r1, r2 + 1):
        for c in cols[i1 : i2 + 1]:
            cell = ws[f"{c}{r}"]
            cell.border = Border(
                left=thin if c == c1 else None,
                right=thin if c == c2 else None,
                top=thin if r == r1 else None,
                bottom=thin if r == r2 else None,
            )


# ---------- Cabecera ----------
for r in range(1, 8):
    band(r, NAVY)
ws.row_dimensions[1].height = 10
for r in (2, 3, 4, 5, 6):
    ws.row_dimensions[r].height = 19
ws.row_dimensions[7].height = 8

badge = XLImage(io.BytesIO(BADGE))
badge.width = badge.height = 84
ws.add_image(badge, "A2")

ws["B2"] = CellRichText(
    TextBlock(InlineFont(rFont=FONT, sz=18, b=True, color="FFFFFF"), "AIRCON"),
    TextBlock(InlineFont(rFont=FONT, sz=18, b=True, color=ORANGE), "SOLUTION"),
    TextBlock(InlineFont(rFont=FONT, sz=18, b=True, color="FFFFFF"), " SERVICES SAC"),
)
ws["B3"] = "A I R E   A C O N D I C I O N A D O   E N   L I M A"
ws["B3"].font = f(8.5, True, "9FC4EE")
ws["B4"] = "RUC 20616633733"
ws["B4"].font = f(9.5, color="CFD9E6")
ws["B5"] = "Instalación · Mantenimiento · Reparación · Emergencias 24/7"
ws["B5"].font = f(9, color="CFD9E6")
for r in (2, 3, 4, 5):
    ws[f"B{r}"].alignment = Alignment(indent=8, vertical="center")

ws.merge_cells("D2:F2")
ws["D2"] = "COTIZACIÓN"
ws["D2"].font = f(22, True, "FFFFFF")
ws["D2"].alignment = Alignment(horizontal="right", vertical="center")
ws.row_dimensions[2].height = 30
ws.merge_cells("E3:F3")
ws["E3"] = "N.° COT-2026-0001"
ws["E3"].font = f(11, True, "FFFFFF")
ws["E3"].fill = fill(ORANGE)
ws["E3"].alignment = Alignment(horizontal="center", vertical="center")
ws["E3"].comment = Comment("Cambia el número en cada cotización.", "AIRCONSOLUTION")

for r, label in ((4, "Fecha de emisión"), (5, "Válida hasta"), (6, "Moneda")):
    ws[f"E{r}"] = label
    ws[f"E{r}"].font = f(9.5, color="D6E2F0")
    ws[f"E{r}"].alignment = Alignment(horizontal="right", vertical="center")
    ws[f"F{r}"].font = f(10, True, "FFFFFF")
    ws[f"F{r}"].alignment = Alignment(horizontal="right", vertical="center")
ws["F4"] = dt.date(2026, 11, 20)
ws["F4"].number_format = "dd/mm/yyyy"
ws["F5"] = "=F4+F42"
ws["F5"].number_format = "dd/mm/yyyy"
ws["F6"] = "Soles (PEN)"

# Línea de color azul → naranja bajo la cabecera.
ws.merge_cells("A8:F8")
ws["A8"].fill = GradientFill(type="linear", degree=0, stop=(BLUE, ORANGE))
ws.row_dimensions[8].height = 5
ws.row_dimensions[9].height = 12

# ---------- Cliente / Emitido por ----------
ws["A10"] = "━  CLIENTE"
ws["D10"] = "━  EMITIDO POR"
for c in ("A10", "D10"):
    ws[c].font = f(9, True, BLUE)
ws.merge_cells("A11:C11")
ws["A11"] = "NOMBRE O RAZÓN SOCIAL DEL CLIENTE"
ws["A11"].font = f(12, True, NAVY)

client = [("RUC / DNI", "20XXXXXXXXX"), ("Atención", "Sr(a). Nombre del contacto"),
          ("Dirección", "Av. Ejemplo 123, Lima"), ("Teléfono", "9XX XXX XXX")]
issuer = [("Dirección", "Calle 20 Mz. 28 Lt. 17 A.H. Laura Caller, Los Olivos, Lima"),
          ("Teléfonos", "985 899 731 · 990 073 634"), ("Correo", "contacto@airconsolutionsac.com · ventas@airconsolutionsac.com"),
          ("Web", "airconsolutionsac.com")]
for i, (k, v) in enumerate(client):
    r = 12 + i
    ws[f"A{r}"] = k
    ws[f"A{r}"].font = f(9.5, color=MUTED)
    ws.merge_cells(f"B{r}:C{r}")
    ws[f"B{r}"] = v
    ws[f"B{r}"].font = f(10)
for i, (k, v) in enumerate(issuer):
    r = 11 + i
    ws[f"D{r}"] = k
    ws[f"D{r}"].font = f(9.5, color=MUTED)
    ws.merge_cells(f"E{r}:F{r}")
    ws[f"E{r}"] = v
    ws[f"E{r}"].font = f(9.5)
    ws[f"E{r}"].alignment = Alignment(wrap_text=True, vertical="top")
ws.row_dimensions[11].height = 27
for r in range(10, 16):
    for c in "ABCD":
        if ws[f"{c}{r}"].alignment.wrap_text is not True:
            ws[f"{c}{r}"].alignment = Alignment(vertical="top", indent=1 if c in "AD" else 0)
box(10, 15, "A", "C")
box(10, 15, "D", "F")
ws.row_dimensions[16].height = 10

ws.merge_cells("A17:F17")
ws["A17"] = CellRichText(
    TextBlock(InlineFont(rFont=FONT, sz=10, color=MUTED),
              "De nuestra consideración: por medio de la presente le hacemos llegar nuestra propuesta "
              "para los trabajos solicitados. "),
    TextBlock(InlineFont(rFont=FONT, sz=10, b=True, color=INK),
              "Precios sin IGV; el IGV (18 %) se suma al final."),
)
ws["A17"].alignment = Alignment(wrap_text=True, vertical="center")
ws.row_dimensions[17].height = 30
ws.row_dimensions[18].height = 8

# ---------- Tabla de partidas ----------
HEAD = 19
for col, title in zip("ABCDEF", ("N.°", "DESCRIPCIÓN", "CANT.", "UND.", "P. UNITARIO", "IMPORTE")):
    c = ws[f"{col}{HEAD}"]
    c.value = title
    c.font = f(9.5, True, "FFFFFF")
    c.fill = fill(NAVY)
    c.alignment = Alignment(horizontal="left" if col == "B" else "center", vertical="center")
ws.row_dimensions[HEAD].height = 24

ITEMS = [
    ("Suministro e instalación de equipo split inverter 12 000 BTU",
     "Incluye 3 m de tubería de cobre aislada, soporte para condensadora, desagüe y puesta en marcha.",
     2, "und", 1850),
    ("Mantenimiento preventivo de equipo split (12 000 – 24 000 BTU)",
     "Lavado de evaporador y condensadora, limpieza de filtros, revisión de presiones y conexiones.",
     4, "und", 120),
    ("Instalación de punto eléctrico independiente",
     "Cableado desde tablero con llave termomagnética 2×20 A y canaleta.",
     2, "und", 180),
]
FIRST, N_ROWS = HEAD + 1, 12
LAST = FIRST + N_ROWS - 1
units = DataValidation(type="list", formula1='"und,m,m²,ml,glb,pto,hr,kit,día"', allow_blank=True)
ws.add_data_validation(units)
for i in range(N_ROWS):
    r = FIRST + i
    ws[f"A{r}"] = f'=IF(B{r}="","",TEXT(COUNTA($B${FIRST}:B{r}),"00"))'
    ws[f"F{r}"] = f'=IF(OR(C{r}="",E{r}=""),"",C{r}*E{r})'
    if i < len(ITEMS):
        title, detail, q, u, p = ITEMS[i]
        ws[f"B{r}"] = CellRichText(
            TextBlock(InlineFont(rFont=FONT, sz=10, b=True, color=NAVY), title + "\n"),
            TextBlock(InlineFont(rFont=FONT, sz=9, color=MUTED), detail),
        )
        ws[f"C{r}"], ws[f"D{r}"], ws[f"E{r}"] = q, u, p
        ws.row_dimensions[r].height = 50
    else:
        ws.row_dimensions[r].height = 20
    ws[f"A{r}"].font = f(10, True, ORANGE)
    ws[f"B{r}"].font = f(10)
    ws[f"C{r}"].font = ws[f"D{r}"].font = ws[f"E{r}"].font = f(10)
    ws[f"F{r}"].font = f(10, True, NAVY)
    ws[f"E{r}"].number_format = ws[f"F{r}"].number_format = MONEY
    ws[f"A{r}"].alignment = Alignment(horizontal="center", vertical="top")
    ws[f"B{r}"].alignment = Alignment(wrap_text=True, vertical="top")
    for c in "CD":
        ws[f"{c}{r}"].alignment = Alignment(horizontal="center", vertical="top")
    for c in "EF":
        ws[f"{c}{r}"].alignment = Alignment(horizontal="right", vertical="top")
    units.add(f"D{r}")
    for c in "ABCDEF":
        ws[f"{c}{r}"].border = Border(bottom=thin)
ws[f"B{FIRST}"].comment = Comment(
    "Escribe la descripción del trabajo. Para una segunda línea usa Alt + Enter.\n"
    "Hay 12 filas; si necesitas más, inserta filas dentro de la tabla.", "AIRCONSOLUTION")

# ---------- Totales ----------
T = LAST + 2  # fila del subtotal
ws.row_dimensions[LAST + 1].height = 10
ws[f"E{T}"], ws[f"F{T}"] = "Subtotal", f"=SUM(F{FIRST}:F{LAST})"
ws[f"E{T+1}"], ws[f"F{T+1}"] = "IGV (18 %)", f"=ROUND(F{T}*18%,2)"
ws[f"E{T+2}"], ws[f"F{T+2}"] = "TOTAL", f"=F{T}+F{T+1}"
for r in (T, T + 1):
    ws[f"E{r}"].font = f(10, color=MUTED)
    ws[f"F{r}"].font = f(10.5, True, INK)
    ws.row_dimensions[r].height = 20
for c in "EF":
    ws[f"{c}{T+2}"].fill = GradientFill(type="linear", degree=0, stop=(ORANGE, ORANGE2))
    ws[f"{c}{T+2}"].font = f(13, True, "FFFFFF")
ws.row_dimensions[T + 2].height = 28
for r in (T, T + 1, T + 2):
    ws[f"E{r}"].alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws[f"F{r}"].alignment = Alignment(horizontal="right", vertical="center")
    ws[f"F{r}"].number_format = MONEY
box(T, T + 2, "E", "F")

ws[f"A{T}"] = "SON"
ws[f"A{T}"].font = f(9, True, ORANGE2)
ws.merge_cells(f"A{T+1}:C{T+2}")
ws[f"A{T+1}"] = "CINCO MIL TRESCIENTOS CINCUENTA Y SIETE CON 20/100 SOLES"
ws[f"A{T+1}"].font = f(10, True, INK)
ws[f"A{T+1}"].alignment = Alignment(wrap_text=True, vertical="top")
ws[f"A{T+1}"].comment = Comment("Escribe aquí el total en letras.", "AIRCONSOLUTION")
for r in (T, T + 1, T + 2):
    ws[f"A{r}"].border = Border(left=Side(style="thick", color=ORANGE))

# ---------- Condiciones ----------
C0 = T + 4
ws.row_dimensions[C0 - 1].height = 12
ws[f"A{C0}"] = "━  CONDICIONES"
ws[f"A{C0}"].font = f(9, True, BLUE)
terms = [("Pago", "60 % de adelanto y 40 % al terminar el trabajo. Venta de equipos: 100 % del costo de los equipos por adelantado."),
         ("Plazo", "3 días hábiles desde la aprobación"),
         ("Garantía", "Por escrito, según el tipo de trabajo y los repuestos utilizados"),
         ("Validez", 15)]
for i, (k, v) in enumerate(terms):
    r = C0 + 1 + i
    ws[f"A{r}"] = k
    ws[f"A{r}"].font = f(9.5, True, NAVY)
    ws[f"A{r}"].alignment = Alignment(vertical="top")
    ws.merge_cells(f"B{r}:F{r}")
    ws[f"B{r}"] = v
    ws[f"B{r}"].font = f(10)
    ws[f"B{r}"].alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
    ws.row_dimensions[r].height = 30 if i == 0 else 18
VALID_ROW = C0 + 4
ws[f"B{VALID_ROW}"].number_format = '0 "días calendario desde la emisión"'
ws[f"B{VALID_ROW}"].comment = Comment("La fecha «Válida hasta» se calcula sola con estos días.", "AIRCONSOLUTION")
# La fecha de validez de la cabecera usa esta celda.
ws["F5"] = f"=F4+B{VALID_ROW}"

# ---------- Datos de pago y firma ----------
P0 = VALID_ROW + 2
ws.row_dimensions[P0 - 1].height = 12
ws[f"A{P0}"] = "━  DATOS PARA EL PAGO"
ws[f"A{P0}"].font = f(9, True, BLUE)
bank = [("Banco", "BCP · Cuenta en Soles"), ("Cuenta", "1933184590074"),
        ("CCI", "00219300318459007410"), ("Titular", "AIRCONSOLUTION SERVICES SAC · RUC 20616633733")]
for i, (k, v) in enumerate(bank):
    r = P0 + 1 + i
    ws[f"A{r}"] = k
    ws[f"A{r}"].font = f(9.5, color=MUTED)
    ws[f"B{r}"] = v
    ws[f"B{r}"].font = f(10)
    ws.row_dimensions[r].height = 18
SIGN = P0 + 3
ws.merge_cells(f"E{SIGN}:F{SIGN}")
ws[f"E{SIGN}"] = "AIRCONSOLUTION SERVICES SAC"
ws[f"E{SIGN}"].font = f(10, True, NAVY)
ws.merge_cells(f"E{SIGN+1}:F{SIGN+1}")
ws[f"E{SIGN+1}"] = "Firma y sello"
ws[f"E{SIGN+1}"].font = f(9, color=MUTED)
for c in ("E", "F"):
    ws[f"{c}{SIGN}"].border = Border(top=Side(style="medium", color=NAVY))
for r in (SIGN, SIGN + 1):
    ws[f"E{r}"].alignment = Alignment(horizontal="center")

# ---------- Pie ----------
FOOT = P0 + 6
ws.row_dimensions[FOOT - 1].height = 14
band(FOOT, NAVY, 26)
ws.merge_cells(f"A{FOOT}:D{FOOT}")
ws[f"A{FOOT}"] = "AIRCONSOLUTION SERVICES SAC · Instalación, mantenimiento y reparación · Emergencias 24/7"
ws[f"A{FOOT}"].font = f(9, True, "FFFFFF")
ws[f"A{FOOT}"].alignment = Alignment(vertical="center", indent=1)
ws.merge_cells(f"E{FOOT}:F{FOOT}")
ws[f"E{FOOT}"] = "airconsolutionsac.com"
ws[f"E{FOOT}"].font = f(10, True, ORANGE)
ws[f"E{FOOT}"].alignment = Alignment(horizontal="right", vertical="center", indent=1)

# ---------- Impresión: A4 en una sola hoja ----------
ws.print_area = f"A1:F{FOOT}"
ws.page_setup.paperSize = ws.PAPERSIZE_A4
ws.page_setup.orientation = "portrait"
ws.page_setup.fitToWidth = 1
ws.page_setup.fitToHeight = 1
ws.sheet_properties.pageSetUpPr.fitToPage = True
ws.print_options.horizontalCentered = True
ws.page_margins.left = ws.page_margins.right = 0.3
ws.page_margins.top = 0.35
ws.page_margins.bottom = 0.3
ws.page_margins.header = 0.15
ws.page_margins.footer = 0.1
ws.sheet_view.view = "pageLayout"  # así se ve el sello de agua mientras se edita
ws.sheet_view.zoomScale = 90
ws.freeze_panes = None

# Encabezado con la imagen (&G); los saltos de línea la bajan al centro de la hoja.
ws.oddHeader.center.text = "\n" * 15 + "&G"

if SIN_SELLO:
    ws.oddHeader.center.text = None
    wb.save(out_path)
    print("ok", out_path)
    sys.exit(0)

tmp = pathlib.Path(tempfile.mkdtemp()) / "base.xlsx"
wb.save(tmp)

# ---------- Sello de agua: imagen de encabezado (VML), que openpyxl no escribe ----------
wm_w_pt = 400
wm_h_pt = round(wm_w_pt * WM_SIZE[1] / WM_SIZE[0])
VML = f"""<xml xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
 <o:shapelayout v:ext="edit"><o:idmap v:ext="edit" data="2"/></o:shapelayout>
 <v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75" o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe" filled="f" stroked="f">
  <v:stroke joinstyle="miter"/>
  <v:formulas>
   <v:f eqn="if lineDrawn pixelLineWidth 0"/><v:f eqn="sum @0 1 0"/><v:f eqn="sum 0 0 @1"/>
   <v:f eqn="prod @2 1 2"/><v:f eqn="prod @3 21600 pixelWidth"/><v:f eqn="prod @3 21600 pixelHeight"/>
   <v:f eqn="sum @0 0 1"/><v:f eqn="prod @6 1 2"/><v:f eqn="prod @7 21600 pixelWidth"/>
   <v:f eqn="sum @8 21600 0"/><v:f eqn="prod @7 21600 pixelHeight"/><v:f eqn="sum @10 21600 0"/>
  </v:formulas>
  <v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/>
  <o:lock v:ext="edit" aspectratio="t"/>
 </v:shapetype>
 <v:shape id="CH" o:spid="_x0000_s2049" type="#_x0000_t75" style="position:absolute;margin-left:0;margin-top:0;width:{wm_w_pt}pt;height:{wm_h_pt}pt;z-index:1">
  <v:imagedata o:relid="rId1" o:title="sello-de-agua"/>
  <o:lock v:ext="edit" rotation="t"/>
 </v:shape>
</xml>"""
VML_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/sello-de-agua.png"/></Relationships>"""

with zipfile.ZipFile(tmp) as zin, zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename == "xl/worksheets/sheet1.xml":
            xml = data.decode()
            if 'xmlns:r="' not in xml.split(">", 1)[0]:
                xml = xml.replace("<worksheet ", '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ', 1)
            xml = xml.replace("_x000a_", "\n")  # saltos de línea reales en el encabezado
            tag = '<legacyDrawingHF r:id="rIdSello"/>'
            # Orden exigido por Excel: drawing → legacyDrawing (notas) → legacyDrawingHF.
            for anchor in (r"<legacyDrawing [^>]*/>", r"<drawing [^>]*/>"):
                if re.search(anchor, xml):
                    xml = re.sub("(" + anchor + ")", lambda m: m.group(1) + tag, xml, count=1)
                    break
            else:
                xml = xml.replace("</worksheet>", tag + "</worksheet>")
            data = xml.encode()
        elif item.filename == "xl/worksheets/_rels/sheet1.xml.rels":
            data = data.decode().replace(
                "</Relationships>",
                '<Relationship Id="rIdSello" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/vmlDrawing" '
                'Target="../drawings/vmlDrawingHF1.vml"/></Relationships>').encode()
        elif item.filename == "[Content_Types].xml":
            xml = data.decode()
            if 'Extension="vml"' not in xml:
                xml = xml.replace("<Default ", '<Default Extension="vml" ContentType="application/vnd.openxmlformats-officedocument.vmlDrawing"/><Default ', 1)
            if 'Extension="png"' not in xml:
                xml = xml.replace("<Default ", '<Default Extension="png" ContentType="image/png"/><Default ', 1)
            data = xml.encode()
        zout.writestr(item, data)
    zout.writestr("xl/drawings/vmlDrawingHF1.vml", VML)
    zout.writestr("xl/drawings/_rels/vmlDrawingHF1.vml.rels", VML_RELS)
    zout.writestr("xl/media/sello-de-agua.png", WM)

shutil.rmtree(tmp.parent)
print("ok", out_path)
