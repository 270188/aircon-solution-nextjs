package pe.airconsolution.api.invoice;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Deque;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import javax.xml.crypto.dsig.Reference;
import javax.xml.crypto.dsig.XMLSignature;
import javax.xml.crypto.dsig.XMLSignatureFactory;
import javax.xml.crypto.dsig.dom.DOMValidateContext;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import pe.airconsolution.api.config.AppProperties;
import pe.airconsolution.api.invoice.sunat.SunatCertificate;
import pe.airconsolution.api.invoice.sunat.SunatSoapClient;
import pe.airconsolution.api.invoice.sunat.SunatSummary;
import pe.airconsolution.api.invoice.sunat.SunatSummaryRepository;
import pe.airconsolution.api.invoice.sunat.XmlSigner;

/** Envío directo a SUNAT contra un SUNAT simulado (no sale a internet). */
class SunatClientTest {

    private static final String CERT_PASSWORD = "clave123";

    /** Devuelve respuestas en cola y guarda los sobres SOAP recibidos. */
    static class FakeSunat extends SunatSoapClient {
        final Deque<String> replies = new ArrayDeque<>();
        final List<String> sent = new ArrayList<>();

        FakeSunat() {
            super("http://sunat.test", "u", "p");
        }

        @Override
        protected String post(String envelope) {
            sent.add(envelope);
            return replies.removeFirst();
        }
    }

    private String p12;
    private SunatCertificate cert;
    private final List<SunatSummary> summaries = new ArrayList<>();
    private final FakeSunat sunat = new FakeSunat();
    private SunatClient client;

    @BeforeEach
    void setUp() throws Exception {
        try (var in = getClass().getResourceAsStream("/sunat/certificado-prueba.p12")) {
            p12 = Base64.getEncoder().encodeToString(in.readAllBytes());
        }
        cert = SunatCertificate.load(p12, null, CERT_PASSWORD);
        client = new SunatClient(props("BETA", null, null), repository());
        client.useSoapClient(sunat);
    }

    @Test
    void sendsSignedFacturaAndKeepsHashXmlAndCdr() throws Exception {
        Invoice f = factura();
        sunat.replies.add(billResponse(0, "La Factura numero F001-7, ha sido aceptada"));

        ElectronicInvoicing.Result r = client.send(f);

        assertThat(r.accepted()).isTrue();
        assertThat(r.cdrBase64()).isNotBlank();
        assertThat(digestIfValid(r.signedXml())).isEqualTo(r.hash());
        String[] name = new String[1];
        assertThat(unzip(sunat.sent.get(0), name)).isEqualTo(r.signedXml());
        assertThat(name[0]).isEqualTo("20616633733-01-F001-7.xml");
        assertThat(r.signedXml())
                .contains("<cbc:ID>F001-7</cbc:ID>")
                .contains("<cbc:PaymentMeansID>Contado</cbc:PaymentMeansID>")
                .contains("<cbc:PayableAmount currencyID=\"PEN\">386.00</cbc:PayableAmount>")
                .contains("E &amp; N FARMA");
    }

    @Test
    void mapsSunatErrors() throws Exception {
        Invoice f = factura();
        sunat.replies.add(fault("soap-env:Client.2017", "El numero de documento de identidad del receptor debe ser RUC"));
        assertThat(client.send(f).accepted()).isFalse();

        sunat.replies.add(fault("soap-env:Client.0102", "Usuario o contraseña incorrectos"));
        ElectronicInvoicing.Result r = client.send(f);
        assertThat(r.accepted()).isNull();
        assertThat(r.description()).contains("clave SOL");

        sunat.replies.add(billResponse(2800, "Tipo de documento no permitido"));
        assertThat(client.send(f).accepted()).isFalse();
    }

    @Test
    void usesBetaOrProductionCredentials() {
        SunatSoapClient beta = new SunatClient(props("BETA", null, null), repository()).soap();
        assertThat(beta.username()).isEqualTo("20616633733MODDATOS");
        assertThat(beta.url()).isEqualTo(SunatSoapClient.BETA_URL);

        SunatSoapClient prod = new SunatClient(props("PRODUCCION", "FACTURA1", "secreto"), repository()).soap();
        assertThat(prod.username()).isEqualTo("20616633733FACTURA1");
        assertThat(prod.url()).isEqualTo(SunatSoapClient.PRODUCTION_URL);
    }

    @Test
    void voidsFacturaWithDailyNumberingAndPendingTicket() throws Exception {
        Invoice f = factura();
        sunat.replies.add(envelope("<ticket>123</ticket>"));
        sunat.replies.add(envelope("<status><statusCode>0</statusCode></status>"));
        assertThat(client.voidInvoice(f, "Error en el RUC").accepted()).isTrue();

        sunat.replies.add(envelope("<ticket>456</ticket>"));
        for (int i = 0; i < 3; i++) sunat.replies.add(envelope("<status><statusCode>98</statusCode></status>"));
        ElectronicInvoicing.Result r = client.voidInvoice(f, "Duplicado");
        assertThat(r.pending()).isTrue();
        assertThat(r.ticket()).isEqualTo("456");

        String[] name = new String[1];
        String ra = unzip(sunat.sent.get(2), name);
        assertThat(name[0]).matches("20616633733-RA-\\d{8}-2\\.xml");
        assertThat(digestIfValid(ra)).isNotNull();
        assertThat(ra).contains("<sac:DocumentNumberID>7</sac:DocumentNumberID>");
    }

    // ---------------------------------------------------------------- utilidades

    private AppProperties props(String mode, String user, String password) {
        return new AppProperties(null, null, null, null, new AppProperties.Invoicing("20616633733",
                "AIRCONSOLUTION SERVICES SAC", "Calle 20 Mz. 28 Lt. 17, Los Olivos, Lima", "F001", "B001", 1, 1,
                "SUNAT", null, null,
                new AppProperties.Sunat(mode, user, password, p12, null, CERT_PASSWORD, "150117", "0000")));
    }

    private SunatSummaryRepository repository() {
        return inMemory(summaries);
    }

    private static Invoice factura() throws Exception {
        Invoice inv = new Invoice();
        set(inv, "id", 7L);
        set(inv, "createdAt", Instant.parse("2026-11-26T19:30:58Z"));
        inv.setType(InvoiceType.FACTURA);
        inv.setSeries("F001");
        inv.setNumber(7);
        inv.setIssueDate(LocalDate.of(2026, 11, 26));
        inv.setCustomerDocType("6");
        inv.setCustomerDocNumber("20600090764");
        inv.setCustomerName("CORPORACION E & N FARMA S.A.C.");
        inv.setCustomerAddress("Av. Peru 123, Lima");
        BigDecimal sub = BigDecimal.ZERO, igv = BigDecimal.ZERO, total = BigDecimal.ZERO;
        int n = 1;
        for (Object[] l : new Object[][] { { "Mantenimiento preventivo", "2", "118" }, { "Recarga de gas", "1", "150" } }) {
            Igv.Line line = Igv.split(new BigDecimal((String) l[1]), new BigDecimal((String) l[2]));
            InvoiceItem it = new InvoiceItem();
            it.setLineNo(n++);
            it.setDescription((String) l[0]);
            it.setQuantity(line.quantity());
            it.setUnitPrice(line.unitPrice());
            it.setUnitValue(line.unitValue());
            it.setSubtotal(line.subtotal());
            it.setIgv(line.igv());
            it.setTotal(line.total());
            inv.addItem(it);
            sub = sub.add(line.subtotal());
            igv = igv.add(line.igv());
            total = total.add(line.total());
        }
        inv.setSubtotal(sub);
        inv.setIgv(igv);
        inv.setTotal(total);
        return inv;
    }

    /** Devuelve el DigestValue si la firma es válida y está donde SUNAT la espera; si no, null. */
    private String digestIfValid(String xml) throws Exception {
        Document doc = XmlSigner.parse(xml);
        Element el = (Element) doc.getElementsByTagNameNS(XMLSignature.XMLNS, "Signature").item(0);
        if (el == null || !"ExtensionContent".equals(el.getParentNode().getLocalName())) return null;
        DOMValidateContext ctx = new DOMValidateContext(cert.certificate().getPublicKey(), el);
        ctx.setProperty("org.jcp.xml.dsig.secureValidation", Boolean.FALSE); // SUNAT usa SHA-1
        XMLSignature sig = XMLSignatureFactory.getInstance("DOM").unmarshalXMLSignature(ctx);
        if (!sig.validate(ctx)) return null;
        return Base64.getEncoder().encodeToString(((Reference) sig.getSignedInfo().getReferences().get(0)).getDigestValue());
    }

    private static String unzip(String envelope, String[] nameOut) throws Exception {
        String b64 = XmlSigner.parse(envelope).getElementsByTagName("contentFile").item(0).getTextContent();
        try (ZipInputStream z = new ZipInputStream(new ByteArrayInputStream(Base64.getDecoder().decode(b64)))) {
            nameOut[0] = z.getNextEntry().getName();
            return new String(z.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static String envelope(String body) {
        return "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\"><s:Body>" + body + "</s:Body></s:Envelope>";
    }

    private static String fault(String code, String message) {
        return envelope("<s:Fault><faultcode>" + code + "</faultcode><faultstring>" + message + "</faultstring></s:Fault>");
    }

    private static String billResponse(int code, String description) throws Exception {
        String cdr = "<ar:ApplicationResponse xmlns:ar=\"urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2\""
                + " xmlns:cac=\"urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2\""
                + " xmlns:cbc=\"urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2\">"
                + "<cac:DocumentResponse><cac:Response><cbc:ResponseCode>" + code + "</cbc:ResponseCode>"
                + "<cbc:Description>" + description + "</cbc:Description></cac:Response></cac:DocumentResponse>"
                + "</ar:ApplicationResponse>";
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ZipOutputStream z = new ZipOutputStream(out)) {
            z.putNextEntry(new ZipEntry("R-cdr.xml"));
            z.write(cdr.getBytes(StandardCharsets.UTF_8));
            z.closeEntry();
        }
        return envelope("<applicationResponse>" + Base64.getEncoder().encodeToString(out.toByteArray()) + "</applicationResponse>");
    }

    private static void set(Object target, String field, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(field);
        f.setAccessible(true);
        f.set(target, value);
    }

    /** Repositorio en memoria: solo implementa lo que usa SunatClient. */
    private static SunatSummaryRepository inMemory(List<SunatSummary> rows) {
        return (SunatSummaryRepository) java.lang.reflect.Proxy.newProxyInstance(
                SunatSummaryRepository.class.getClassLoader(), new Class<?>[] { SunatSummaryRepository.class },
                (proxy, method, args) -> switch (method.getName()) {
                    case "maxCorrelative" -> rows.stream()
                            .filter(s -> s.getKind().equals(args[0]) && s.getIssueDate().equals(args[1]))
                            .mapToInt(SunatSummary::getCorrelative).max().orElse(0);
                    case "save" -> {
                        rows.add((SunatSummary) args[0]);
                        yield args[0];
                    }
                    case "toString" -> "InMemorySummaries";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> throw new UnsupportedOperationException(method.getName());
                });
    }
}
