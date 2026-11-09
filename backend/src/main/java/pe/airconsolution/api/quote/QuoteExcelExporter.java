package pe.airconsolution.api.quote;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.ClientAnchor;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.PrintSetup;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.util.IOUtils;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFClientAnchor;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFDrawing;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import pe.airconsolution.api.config.AppProperties;
import pe.airconsolution.api.invoice.AmountInWords;

/**
 * Genera la cotización en Excel (.xlsx) con el logo y los colores de la empresa.
 * Importes y totales usan fórmulas, así se pueden ajustar cantidades o precios en el mismo Excel.
 */
@Component
public class QuoteExcelExporter {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final byte[] NAVY = {(byte) 0x0D, (byte) 0x1B, (byte) 0x2E};
    private static final byte[] BLUE = {(byte) 0x1E, (byte) 0x88, (byte) 0xE5};
    private static final byte[] ORANGE = {(byte) 0xF5, (byte) 0x82, (byte) 0x1F};
    private static final byte[] SOFT = {(byte) 0xF2, (byte) 0xF6, (byte) 0xFB};
    private static final String MONEY = "\"S/\" #,##0.00";

    private final AppProperties.Invoicing issuer;
    private final String phones;
    private final String email;

    public QuoteExcelExporter(AppProperties props) {
        this.issuer = props.invoicing();
        this.phones = "Tel. +51 985 899 731 / +51 990 073 634";
        this.email = "aircon82@gmail.com";
    }

    public byte[] export(Quote q) {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            XSSFSheet sh = wb.createSheet("Cotización");
            sh.setDisplayGridlines(false);
            sh.setColumnWidth(0, 14 * 256);  // N° / etiquetas / logo
            sh.setColumnWidth(1, 50 * 256);  // Descripción
            sh.setColumnWidth(2, 10 * 256);  // Cant.
            sh.setColumnWidth(3, 16 * 256);  // P. unit.
            sh.setColumnWidth(4, 16 * 256);  // Importe

            Styles st = new Styles(wb);

            // ---- Encabezado con logo ----
            cell(sh, 0, 1, issuer.businessName(), st.company);
            cell(sh, 1, 1, "RUC " + issuer.ruc(), st.bold);
            cell(sh, 2, 1, issuer.address(), st.small);
            cell(sh, 3, 1, phones + " · " + email, st.small);

            cell(sh, 0, 3, "COTIZACIÓN", st.titleBox);
            sh.addMergedRegion(new CellRangeAddress(0, 0, 3, 4));
            cell(sh, 1, 3, q.code(), st.codeBox);
            sh.addMergedRegion(new CellRangeAddress(1, 1, 3, 4));
            cell(sh, 2, 3, "Fecha: " + q.getIssueDate().format(DATE), st.boxLine);
            sh.addMergedRegion(new CellRangeAddress(2, 2, 3, 4));
            cell(sh, 3, 3, "Válida hasta: " + q.getValidUntil().format(DATE), st.boxLine);
            sh.addMergedRegion(new CellRangeAddress(3, 3, 3, 4));
            for (int r = 0; r < 4; r++) sh.getRow(r).setHeightInPoints(r == 0 ? 26 : 18);
            // El logo se ubica cuando las filas ya existen (necesita sus alturas para escalarse).
            addLogo(wb, sh);

            // ---- Cliente ----
            int r = 5;
            cell(sh, r, 0, "DATOS DEL CLIENTE", st.section);
            sh.addMergedRegion(new CellRangeAddress(r, r, 0, 4));
            r++;
            r = clientLine(sh, st, r, "Cliente", q.getCustomerName());
            if (q.getCustomerDoc() != null) r = clientLine(sh, st, r, "RUC / DNI", q.getCustomerDoc());
            if (q.getCustomerContact() != null) r = clientLine(sh, st, r, "Atención", q.getCustomerContact());
            String contact = join(q.getCustomerPhone(), q.getCustomerEmail());
            if (!contact.isEmpty()) r = clientLine(sh, st, r, "Contacto", contact);
            if (q.getCustomerAddress() != null) r = clientLine(sh, st, r, "Dirección", q.getCustomerAddress());

            // ---- Detalle ----
            r++;
            Row head = sh.createRow(r);
            head.setHeightInPoints(22);
            boolean incl = q.isPricesIncludeIgv();
            String[] headers = {"N°", "Descripción del servicio", "Cant.", incl ? "P. unit. (inc. IGV)" : "P. unit. (sin IGV)",
                    incl ? "Importe" : "Valor venta"};
            for (int c = 0; c < headers.length; c++) {
                Cell h = head.createCell(c);
                h.setCellValue(headers[c]);
                h.setCellStyle(st.header);
            }
            int firstItemRow = r + 1;
            for (QuoteItem it : q.getItems()) {
                r++;
                Row row = sh.createRow(r);
                boolean zebra = it.getLineNo() % 2 == 0;
                num(row, 0, it.getLineNo(), zebra ? st.centerZ : st.center);
                Cell d = row.createCell(1);
                d.setCellValue(it.getDescription());
                d.setCellStyle(zebra ? st.textZ : st.text);
                num(row, 2, it.getQuantity().doubleValue(), zebra ? st.qtyZ : st.qty);
                num(row, 3, it.getUnitPrice().doubleValue(), zebra ? st.moneyZ : st.money);
                Cell amount = row.createCell(4);
                amount.setCellFormula("ROUND(C" + (r + 1) + "*D" + (r + 1) + ",2)");
                amount.setCellStyle(zebra ? st.moneyZ : st.money);
            }
            int lastItemRow = r + 1;

            // ---- Totales ----
            r += 2;
            String items = "E" + (firstItemRow + 1) + ":E" + lastItemRow;
            if (incl) {
                // Precios con IGV: el total es la suma y de ahí se desglosa el IGV.
                totalLine(sh, st, r, "Op. gravada", "ROUND(E" + (r + 3) + "/1.18,2)", false);
                totalLine(sh, st, r + 1, "IGV (18 %)", "E" + (r + 3) + "-E" + (r + 1), false);
                totalLine(sh, st, r + 2, "TOTAL", "SUM(" + items + ")", true);
            } else {
                // Precios sin IGV: se suma el 18 % sobre la base.
                totalLine(sh, st, r, "Op. gravada", "SUM(" + items + ")", false);
                totalLine(sh, st, r + 1, "IGV (18 %)", "ROUND(E" + (r + 1) + "*0.18,2)", false);
                totalLine(sh, st, r + 2, "TOTAL", "E" + (r + 1) + "+E" + (r + 2), true);
            }
            cell(sh, r, 0, AmountInWords.soles(q.getTotal()), st.words);
            sh.addMergedRegion(new CellRangeAddress(r, r, 0, 2));

            // ---- Condiciones ----
            r += 4;
            cell(sh, r, 0, "CONDICIONES", st.section);
            sh.addMergedRegion(new CellRangeAddress(r, r, 0, 4));
            for (String line : q.getNotes().split("\\R")) {
                if (line.isBlank()) continue;
                r++;
                cell(sh, r, 0, line.trim(), st.small);
                sh.addMergedRegion(new CellRangeAddress(r, r, 0, 4));
            }

            r += 2;
            cell(sh, r, 0, "Gracias por confiar en " + issuer.businessName() + ". Ante cualquier consulta escríbenos por WhatsApp.", st.thanks);
            sh.addMergedRegion(new CellRangeAddress(r, r, 0, 4));

            // ---- Impresión: A4 vertical, ajustado al ancho ----
            PrintSetup ps = sh.getPrintSetup();
            ps.setPaperSize(PrintSetup.A4_PAPERSIZE);
            ps.setFitWidth((short) 1);
            ps.setFitHeight((short) 0);
            sh.setFitToPage(true);
            sh.setHorizontallyCenter(true);

            wb.setForceFormulaRecalculation(true);
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo generar el Excel.", e);
        }
    }

    private void addLogo(XSSFWorkbook wb, XSSFSheet sh) throws IOException {
        ClassPathResource logo = new ClassPathResource("branding/logo.png");
        if (!logo.exists()) return;
        try (InputStream in = logo.getInputStream()) {
            int idx = wb.addPicture(IOUtils.toByteArray(in), XSSFWorkbook.PICTURE_TYPE_PNG);
            XSSFDrawing drawing = sh.createDrawingPatriarch();
            // Posición fija dentro de la columna A (en EMU, 9525 por píxel): ~80 x 66 px.
            int px = 9525;
            XSSFClientAnchor anchor = new XSSFClientAnchor(10 * px, 6 * px, 90 * px, 13 * px, 0, 0, 0, 2);
            anchor.setAnchorType(ClientAnchor.AnchorType.MOVE_DONT_RESIZE);
            drawing.createPicture(anchor, idx);
        }
    }

    private static int clientLine(XSSFSheet sh, Styles st, int r, String label, String value) {
        cell(sh, r, 0, label + ":", st.label);
        cell(sh, r, 1, value, st.text);
        sh.addMergedRegion(new CellRangeAddress(r, r, 1, 4));
        return r + 1;
    }

    private static void totalLine(XSSFSheet sh, Styles st, int r, String label, String formula, boolean grand) {
        cell(sh, r, 3, label, grand ? st.grandLabel : st.totalLabel);
        Row row = sh.getRow(r);
        Cell v = row.createCell(4);
        v.setCellFormula(formula);
        v.setCellStyle(grand ? st.grandValue : st.money);
        if (grand) row.setHeightInPoints(22);
    }

    private static Cell cell(XSSFSheet sh, int r, int c, String value, CellStyle style) {
        Row row = sh.getRow(r) == null ? sh.createRow(r) : sh.getRow(r);
        Cell cell = row.createCell(c);
        cell.setCellValue(value);
        cell.setCellStyle(style);
        return cell;
    }

    private static void num(Row row, int c, double v, CellStyle style) {
        Cell cell = row.createCell(c);
        cell.setCellValue(v);
        cell.setCellStyle(style);
    }

    private static String join(String a, String b) {
        if (a == null) return b == null ? "" : b;
        return b == null ? a : a + " · " + b;
    }

    /** Estilos reutilizados en la hoja. */
    private static final class Styles {
        final XSSFWorkbook wb;
        final CellStyle company, bold, small, titleBox, codeBox, boxLine, section, label, text, textZ,
                header, center, centerZ, qty, qtyZ, money, moneyZ, totalLabel, grandLabel, grandValue, words, thanks;

        Styles(XSSFWorkbook wb) {
            this.wb = wb;
            XSSFFont companyFont = font(16, true, NAVY);
            company = style(companyFont, null, false);
            bold = style(font(10, true, NAVY), null, false);
            small = style(font(9, false, new byte[] {0x55, 0x55, 0x55}), null, false);
            small.setWrapText(false);

            titleBox = style(font(14, true, new byte[] {(byte) 0xFF, (byte) 0xFF, (byte) 0xFF}), BLUE, false);
            titleBox.setAlignment(HorizontalAlignment.CENTER);
            titleBox.setVerticalAlignment(VerticalAlignment.CENTER);
            codeBox = style(font(12, true, NAVY), SOFT, false);
            codeBox.setAlignment(HorizontalAlignment.CENTER);
            boxLine = style(font(9, false, NAVY), SOFT, false);
            boxLine.setAlignment(HorizontalAlignment.CENTER);

            section = style(font(10, true, new byte[] {(byte) 0xFF, (byte) 0xFF, (byte) 0xFF}), NAVY, false);
            label = style(font(10, true, NAVY), null, false);
            text = style(font(10, false, NAVY), null, true);
            text.setWrapText(true);
            textZ = style(font(10, false, NAVY), SOFT, true);
            textZ.setWrapText(true);

            header = style(font(10, true, new byte[] {(byte) 0xFF, (byte) 0xFF, (byte) 0xFF}), BLUE, true);
            header.setAlignment(HorizontalAlignment.CENTER);
            header.setVerticalAlignment(VerticalAlignment.CENTER);
            center = style(font(10, false, NAVY), null, true);
            center.setAlignment(HorizontalAlignment.CENTER);
            centerZ = style(font(10, false, NAVY), SOFT, true);
            centerZ.setAlignment(HorizontalAlignment.CENTER);
            qty = numeric(null, "#,##0.##");
            qtyZ = numeric(SOFT, "#,##0.##");
            money = numeric(null, MONEY);
            moneyZ = numeric(SOFT, MONEY);

            totalLabel = style(font(10, true, NAVY), null, false);
            totalLabel.setAlignment(HorizontalAlignment.RIGHT);
            grandLabel = style(font(12, true, new byte[] {(byte) 0xFF, (byte) 0xFF, (byte) 0xFF}), ORANGE, false);
            grandLabel.setAlignment(HorizontalAlignment.RIGHT);
            grandLabel.setVerticalAlignment(VerticalAlignment.CENTER);
            grandValue = style(font(12, true, new byte[] {(byte) 0xFF, (byte) 0xFF, (byte) 0xFF}), ORANGE, false);
            grandValue.setDataFormat(wb.createDataFormat().getFormat(MONEY));
            grandValue.setVerticalAlignment(VerticalAlignment.CENTER);

            words = style(font(9, true, NAVY), null, false);
            thanks = style(font(9, false, BLUE), null, false);
            thanks.setAlignment(HorizontalAlignment.CENTER);
        }

        private CellStyle numeric(byte[] fill, String format) {
            CellStyle s = style(font(10, false, NAVY), fill, true);
            s.setDataFormat(wb.createDataFormat().getFormat(format));
            s.setVerticalAlignment(VerticalAlignment.TOP);
            return s;
        }

        private XSSFFont font(int size, boolean bold, byte[] rgb) {
            XSSFFont f = wb.createFont();
            f.setFontName("Calibri");
            f.setFontHeightInPoints((short) size);
            f.setBold(bold);
            f.setColor(new XSSFColor(rgb, null));
            return f;
        }

        private XSSFCellStyle style(XSSFFont font, byte[] fill, boolean borders) {
            XSSFCellStyle s = wb.createCellStyle();
            s.setFont(font);
            s.setVerticalAlignment(VerticalAlignment.TOP);
            if (fill != null) {
                s.setFillForegroundColor(new XSSFColor(fill, null));
                s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            }
            if (borders) {
                XSSFColor line = new XSSFColor(new byte[] {(byte) 0xE2, (byte) 0xE8, (byte) 0xF0}, null);
                s.setBorderBottom(BorderStyle.THIN);
                s.setBottomBorderColor(line);
                s.setBorderTop(BorderStyle.THIN);
                s.setTopBorderColor(line);
                s.setBorderLeft(BorderStyle.THIN);
                s.setLeftBorderColor(line);
                s.setBorderRight(BorderStyle.THIN);
                s.setRightBorderColor(line);
            }
            return s;
        }
    }
}
