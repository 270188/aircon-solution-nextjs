package pe.airconsolution.api.invoice.sunat;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

import pe.airconsolution.api.invoice.AmountInWords;
import pe.airconsolution.api.invoice.Invoice;
import pe.airconsolution.api.invoice.InvoiceItem;
import pe.airconsolution.api.invoice.InvoiceType;

/**
 * Genera los XML que exige SUNAT para el SEE - Del contribuyente:
 * factura / boleta (UBL 2.1), comunicación de baja (RA) y resumen diario (RC).
 * Solo operaciones gravadas con IGV (18 %) en soles, que es lo que emite el sistema.
 */
public final class UblBuilder {

    /** Datos del emisor que van en cada comprobante. */
    public record Emitter(String ruc, String businessName, String address, String ubigeo, String establishment) {
    }

    private static final String NS =
            " xmlns:cac=\"urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2\""
            + " xmlns:cbc=\"urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2\""
            + " xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\""
            + " xmlns:ext=\"urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2\"";

    private static final String SAC = " xmlns:sac=\"urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1\"";

    private static final String EXTENSIONS =
            "<ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent/></ext:UBLExtension></ext:UBLExtensions>";

    private static final String IGV_SCHEME = "<cac:TaxScheme><cbc:ID schemeName=\"Codigo de tributos\" schemeAgencyName=\"PE:SUNAT\""
            + " schemeURI=\"urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo05\">1000</cbc:ID>"
            + "<cbc:Name>IGV</cbc:Name><cbc:TaxTypeCode>VAT</cbc:TaxTypeCode></cac:TaxScheme>";

    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm:ss");

    private UblBuilder() {
    }

    /** Nombre del archivo sin extensión: RUC-TIPO-SERIE-NUMERO (p. ej. 20616633733-01-F001-1). */
    public static String fileName(Emitter e, Invoice inv) {
        return e.ruc() + "-" + inv.getType().sunatCode() + "-" + documentId(inv);
    }

    /** ID del comprobante tal como lo valida SUNAT: SERIE-CORRELATIVO sin ceros a la izquierda. */
    public static String documentId(Invoice inv) {
        return inv.getSeries() + "-" + inv.getNumber();
    }

    public static String invoice(Emitter e, Invoice inv, LocalTime issueTime) {
        String id = documentId(inv);
        String cur = inv.getCurrency();
        StringBuilder x = new StringBuilder(4096);
        x.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")
                .append("<Invoice xmlns=\"urn:oasis:names:specification:ubl:schema:xsd:Invoice-2\"").append(NS).append('>')
                .append(EXTENSIONS)
                .append("<cbc:UBLVersionID>2.1</cbc:UBLVersionID>")
                .append("<cbc:CustomizationID>2.0</cbc:CustomizationID>")
                .append(tag("cbc:ID", id))
                .append(tag("cbc:IssueDate", inv.getIssueDate().toString()))
                .append(tag("cbc:IssueTime", issueTime.format(TIME)))
                .append("<cbc:InvoiceTypeCode listID=\"0101\" listAgencyName=\"PE:SUNAT\" listName=\"Tipo de Documento\"")
                .append(" listURI=\"urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01\" name=\"Tipo de Operacion\"")
                .append(" listSchemeURI=\"urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51\">")
                .append(inv.getType().sunatCode()).append("</cbc:InvoiceTypeCode>")
                .append("<cbc:Note languageLocaleID=\"1000\">").append(esc(legend(inv.getTotal()))).append("</cbc:Note>")
                .append("<cbc:DocumentCurrencyCode listID=\"ISO 4217 Alpha\" listName=\"Currency\"")
                .append(" listAgencyName=\"United Nations Economic Commission for Europe\">").append(cur)
                .append("</cbc:DocumentCurrencyCode>")
                .append(tag("cbc:LineCountNumeric", String.valueOf(inv.getItems().size())))
                .append(signatureRef(e, id))
                // Emisor
                .append("<cac:AccountingSupplierParty><cac:Party>")
                .append("<cac:PartyIdentification>").append(partyId("6", e.ruc())).append("</cac:PartyIdentification>")
                .append("<cac:PartyName>").append(tag("cbc:Name", e.businessName())).append("</cac:PartyName>")
                .append("<cac:PartyLegalEntity>").append(tag("cbc:RegistrationName", e.businessName()))
                .append("<cac:RegistrationAddress>")
                .append(e.ubigeo() == null || e.ubigeo().isBlank() ? "" : tag("cbc:ID", e.ubigeo()))
                .append(tag("cbc:AddressTypeCode", e.establishment()))
                .append("<cac:AddressLine>").append(tag("cbc:Line", e.address())).append("</cac:AddressLine>")
                .append("<cac:Country><cbc:IdentificationCode>PE</cbc:IdentificationCode></cac:Country>")
                .append("</cac:RegistrationAddress></cac:PartyLegalEntity>")
                .append("</cac:Party></cac:AccountingSupplierParty>")
                // Cliente
                .append("<cac:AccountingCustomerParty><cac:Party>")
                .append("<cac:PartyIdentification>")
                .append(partyId(inv.getCustomerDocType(), docNumber(inv)))
                .append("</cac:PartyIdentification>")
                .append("<cac:PartyLegalEntity>").append(tag("cbc:RegistrationName", inv.getCustomerName()));
        if (inv.getCustomerAddress() != null && !inv.getCustomerAddress().isBlank()) {
            x.append("<cac:RegistrationAddress><cac:AddressLine>").append(tag("cbc:Line", inv.getCustomerAddress()))
                    .append("</cac:AddressLine></cac:RegistrationAddress>");
        }
        x.append("</cac:PartyLegalEntity></cac:Party></cac:AccountingCustomerParty>");

        if (inv.getType() == InvoiceType.FACTURA) {
            x.append("<cac:PaymentTerms><cbc:ID>FormaPago</cbc:ID><cbc:PaymentMeansID>Contado</cbc:PaymentMeansID></cac:PaymentTerms>");
        }

        x.append(taxTotal(cur, inv.getSubtotal(), inv.getIgv(), false))
                .append("<cac:LegalMonetaryTotal>")
                .append(amount("cbc:LineExtensionAmount", cur, inv.getSubtotal()))
                .append(amount("cbc:TaxInclusiveAmount", cur, inv.getTotal()))
                .append(amount("cbc:PayableAmount", cur, inv.getTotal()))
                .append("</cac:LegalMonetaryTotal>");

        for (InvoiceItem it : inv.getItems()) {
            x.append("<cac:InvoiceLine>")
                    .append(tag("cbc:ID", String.valueOf(it.getLineNo())))
                    .append("<cbc:InvoicedQuantity unitCode=\"ZZ\" unitCodeListID=\"UN/ECE rec 20\"")
                    .append(" unitCodeListAgencyName=\"United Nations Economic Commission for Europe\">")
                    .append(plain(it.getQuantity())).append("</cbc:InvoicedQuantity>")
                    .append(amount("cbc:LineExtensionAmount", cur, it.getSubtotal()))
                    .append("<cac:PricingReference><cac:AlternativeConditionPrice>")
                    .append(amount("cbc:PriceAmount", cur, it.getUnitPrice()))
                    .append("<cbc:PriceTypeCode listName=\"Tipo de Precio\" listAgencyName=\"PE:SUNAT\"")
                    .append(" listURI=\"urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16\">01</cbc:PriceTypeCode>")
                    .append("</cac:AlternativeConditionPrice></cac:PricingReference>")
                    .append(taxTotal(cur, it.getSubtotal(), it.getIgv(), true))
                    .append("<cac:Item>").append(tag("cbc:Description", it.getDescription()))
                    .append("<cac:SellersItemIdentification>").append(tag("cbc:ID", "SERV" + it.getLineNo()))
                    .append("</cac:SellersItemIdentification></cac:Item>")
                    .append("<cac:Price><cbc:PriceAmount currencyID=\"").append(cur).append("\">")
                    .append(plain(it.getUnitValue())).append("</cbc:PriceAmount></cac:Price>")
                    .append("</cac:InvoiceLine>");
        }
        return x.append("</Invoice>").toString();
    }

    /** Comunicación de baja de una factura. id = RA-AAAAMMDD-n */
    public static String voided(Emitter e, String id, LocalDate today, Invoice inv, String reason) {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                + "<VoidedDocuments xmlns=\"urn:sunat:names:specification:ubl:peru:schema:xsd:VoidedDocuments-1\""
                + NS + SAC + ">"
                + EXTENSIONS
                + "<cbc:UBLVersionID>2.0</cbc:UBLVersionID><cbc:CustomizationID>1.0</cbc:CustomizationID>"
                + tag("cbc:ID", id)
                + tag("cbc:ReferenceDate", inv.getIssueDate().toString())
                + tag("cbc:IssueDate", today.toString())
                + signatureRef(e, id)
                + summarySupplier(e)
                + "<sac:VoidedDocumentsLine>"
                + "<cbc:LineID>1</cbc:LineID>"
                + tag("cbc:DocumentTypeCode", inv.getType().sunatCode())
                + tag("sac:DocumentSerialID", inv.getSeries())
                + tag("sac:DocumentNumberID", String.valueOf(inv.getNumber()))
                + tag("sac:VoidReasonDescription", reason)
                + "</sac:VoidedDocumentsLine>"
                + "</VoidedDocuments>";
    }

    /** Resumen diario que anula una boleta (estado 3). id = RC-AAAAMMDD-n */
    public static String voidBoletaSummary(Emitter e, String id, LocalDate today, Invoice inv) {
        String cur = inv.getCurrency();
        StringBuilder x = new StringBuilder(2048)
                .append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")
                .append("<SummaryDocuments xmlns=\"urn:sunat:names:specification:ubl:peru:schema:xsd:SummaryDocuments-1\"")
                .append(NS).append(SAC).append('>')
                .append(EXTENSIONS)
                .append("<cbc:UBLVersionID>2.0</cbc:UBLVersionID><cbc:CustomizationID>1.1</cbc:CustomizationID>")
                .append(tag("cbc:ID", id))
                .append(tag("cbc:ReferenceDate", inv.getIssueDate().toString()))
                .append(tag("cbc:IssueDate", today.toString()))
                .append(signatureRef(e, id))
                .append(summarySupplier(e))
                .append("<sac:SummaryDocumentsLine>")
                .append("<cbc:LineID>1</cbc:LineID>")
                .append(tag("cbc:DocumentTypeCode", inv.getType().sunatCode()))
                .append(tag("cbc:ID", documentId(inv)));
        if (!"-".equals(inv.getCustomerDocType())) {
            x.append("<cac:AccountingCustomerParty>")
                    .append(tag("cbc:CustomerAssignedAccountID", docNumber(inv)))
                    .append(tag("cbc:AdditionalAccountID", inv.getCustomerDocType()))
                    .append("</cac:AccountingCustomerParty>");
        }
        return x.append("<cac:Status><cbc:ConditionCode>3</cbc:ConditionCode></cac:Status>")
                .append(amount("sac:TotalAmount", cur, inv.getTotal()))
                .append("<sac:BillingPayment>").append(amount("cbc:PaidAmount", cur, inv.getSubtotal()))
                .append("<cbc:InstructionID>01</cbc:InstructionID></sac:BillingPayment>")
                .append("<cac:TaxTotal>").append(amount("cbc:TaxAmount", cur, inv.getIgv()))
                .append("<cac:TaxSubtotal>").append(amount("cbc:TaxAmount", cur, inv.getIgv()))
                .append("<cac:TaxCategory><cac:TaxScheme><cbc:ID>1000</cbc:ID><cbc:Name>IGV</cbc:Name>")
                .append("<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory>")
                .append("</cac:TaxSubtotal></cac:TaxTotal>")
                .append("</sac:SummaryDocumentsLine>")
                .append("</SummaryDocuments>")
                .toString();
    }

    // ---------------------------------------------------------------- partes comunes

    private static String signatureRef(Emitter e, String id) {
        return "<cac:Signature>" + tag("cbc:ID", id)
                + "<cac:SignatoryParty><cac:PartyIdentification>" + tag("cbc:ID", e.ruc()) + "</cac:PartyIdentification>"
                + "<cac:PartyName>" + tag("cbc:Name", e.businessName()) + "</cac:PartyName></cac:SignatoryParty>"
                + "<cac:DigitalSignatureAttachment><cac:ExternalReference><cbc:URI>#" + XmlSigner.SIGNATURE_ID
                + "</cbc:URI></cac:ExternalReference></cac:DigitalSignatureAttachment></cac:Signature>";
    }

    private static String summarySupplier(Emitter e) {
        return "<cac:AccountingSupplierParty>" + tag("cbc:CustomerAssignedAccountID", e.ruc())
                + "<cbc:AdditionalAccountID>6</cbc:AdditionalAccountID>"
                + "<cac:Party><cac:PartyLegalEntity>" + tag("cbc:RegistrationName", e.businessName())
                + "</cac:PartyLegalEntity></cac:Party></cac:AccountingSupplierParty>";
    }

    private static String partyId(String schemeId, String number) {
        return "<cbc:ID schemeID=\"" + esc(schemeId) + "\" schemeName=\"Documento de Identidad\" schemeAgencyName=\"PE:SUNAT\""
                + " schemeURI=\"urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06\">" + esc(number) + "</cbc:ID>";
    }

    private static String taxTotal(String cur, BigDecimal taxable, BigDecimal igv, boolean line) {
        StringBuilder x = new StringBuilder("<cac:TaxTotal>").append(amount("cbc:TaxAmount", cur, igv))
                .append("<cac:TaxSubtotal>")
                .append(amount("cbc:TaxableAmount", cur, taxable))
                .append(amount("cbc:TaxAmount", cur, igv))
                .append("<cac:TaxCategory>");
        if (line) {
            x.append("<cbc:Percent>18.00</cbc:Percent>")
                    .append("<cbc:TaxExemptionReasonCode listAgencyName=\"PE:SUNAT\" listName=\"Afectacion del IGV\"")
                    .append(" listURI=\"urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07\">10</cbc:TaxExemptionReasonCode>");
        }
        return x.append(IGV_SCHEME).append("</cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal>").toString();
    }

    private static String docNumber(Invoice inv) {
        String n = inv.getCustomerDocNumber();
        return n == null || n.isBlank() ? "-" : n.trim();
    }

    private static String legend(BigDecimal total) {
        return AmountInWords.soles(total).replaceFirst("^SON:\\s*", "");
    }

    private static String amount(String tag, String cur, BigDecimal value) {
        return "<" + tag + " currencyID=\"" + cur + "\">" + money(value) + "</" + tag + ">";
    }

    static String money(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private static String plain(BigDecimal v) {
        BigDecimal s = v.stripTrailingZeros();
        return (s.scale() < 0 ? s.setScale(0) : s).toPlainString();
    }

    private static String tag(String name, String value) {
        return "<" + name + ">" + esc(value) + "</" + name + ">";
    }

    static String esc(String s) {
        if (s == null) return "";
        StringBuilder b = new StringBuilder(s.length());
        for (char c : s.toCharArray()) {
            switch (c) {
                case '&' -> b.append("&amp;");
                case '<' -> b.append("&lt;");
                case '>' -> b.append("&gt;");
                case '"' -> b.append("&quot;");
                case '\'' -> b.append("&apos;");
                default -> {
                    if (c >= 0x20 || c == '\t' || c == '\n' || c == '\r') b.append(c);
                }
            }
        }
        return b.toString();
    }
}
