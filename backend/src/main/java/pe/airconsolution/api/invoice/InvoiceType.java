package pe.airconsolution.api.invoice;

/** Tipos de comprobante de pago electrónico (catálogo 01 de SUNAT). */
public enum InvoiceType {
    FACTURA("01", 1, "FACTURA ELECTRÓNICA"),
    BOLETA("03", 2, "BOLETA DE VENTA ELECTRÓNICA");

    private final String sunatCode;
    private final int nubefactCode;
    private final String title;

    InvoiceType(String sunatCode, int nubefactCode, String title) {
        this.sunatCode = sunatCode;
        this.nubefactCode = nubefactCode;
        this.title = title;
    }

    public String sunatCode() { return sunatCode; }
    public int nubefactCode() { return nubefactCode; }
    public String title() { return title; }
}
