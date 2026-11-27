package pe.airconsolution.api.invoice.sunat;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

/**
 * Servicio web billService de SUNAT (SOAP 1.1 + WS-Security UsernameToken).
 * sendBill: facturas y boletas, responde con el CDR. sendSummary: bajas y resúmenes, responde con un ticket.
 */
public class SunatSoapClient {

    public static final String BETA_URL = "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService";
    public static final String PRODUCTION_URL = "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService";

    /** Constancia de recepción. code 0 = aceptado; desde 4000 = aceptado con observaciones; 2000-3999 = rechazado. */
    public record Cdr(int code, String description, List<String> notes, String zipBase64) {

        public boolean accepted() {
            return code == 0 || code >= 4000;
        }
    }

    /** Respuesta de getStatus: 0 procesado, 98 en proceso, 99 procesado con errores. */
    public record Status(int statusCode, Cdr cdr) {
    }

    /** Error devuelto por SUNAT (SOAP Fault). */
    public static class SunatFault extends RuntimeException {
        private final int code;

        public SunatFault(int code, String message) {
            super(message);
            this.code = code;
        }

        public int code() {
            return code;
        }

        /** 2000-3999: el comprobante fue rechazado. Del 100 al 1999: no se recibió (se puede reintentar). */
        public boolean rejection() {
            return code >= 2000 && code < 4000;
        }
    }

    /** No hubo respuesta de SUNAT (red, caída del servicio). */
    public static class SunatUnavailable extends RuntimeException {
        public SunatUnavailable(String message, Throwable cause) {
            super(message, cause);
        }
    }

    private final String url;
    private final String username;
    private final String password;
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .proxy(ProxySelector.getDefault())
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public SunatSoapClient(String url, String username, String password) {
        this.url = url;
        this.username = username;
        this.password = password;
    }

    public String url() {
        return url;
    }

    public String username() {
        return username;
    }

    public Cdr sendBill(String fileName, String xml) {
        String body = "<ser:sendBill><fileName>" + fileName + ".zip</fileName><contentFile>"
                + Base64.getEncoder().encodeToString(zip(fileName + ".xml", xml)) + "</contentFile></ser:sendBill>";
        Document res = call(body);
        String content = text(res, "applicationResponse");
        if (content == null) {
            throw new SunatUnavailable("SUNAT no devolvió la constancia de recepción (CDR).", null);
        }
        return readCdr(content);
    }

    public String sendSummary(String fileName, String xml) {
        String body = "<ser:sendSummary><fileName>" + fileName + ".zip</fileName><contentFile>"
                + Base64.getEncoder().encodeToString(zip(fileName + ".xml", xml)) + "</contentFile></ser:sendSummary>";
        String ticket = text(call(body), "ticket");
        if (ticket == null) {
            throw new SunatUnavailable("SUNAT no devolvió el número de ticket.", null);
        }
        return ticket.trim();
    }

    public Status getStatus(String ticket) {
        Document res = call("<ser:getStatus><ticket>" + UblBuilder.esc(ticket) + "</ticket></ser:getStatus>");
        String code = text(res, "statusCode");
        String content = text(res, "content");
        int status = code == null ? -1 : Integer.parseInt(code.trim());
        return new Status(status, content == null || content.isBlank() ? null : readCdr(content));
    }

    // ---------------------------------------------------------------- SOAP

    private Document call(String operation) {
        String envelope = "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\""
                + " xmlns:ser=\"http://service.sunat.gob.pe\""
                + " xmlns:wsse=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd\">"
                + "<soapenv:Header><wsse:Security><wsse:UsernameToken>"
                + "<wsse:Username>" + UblBuilder.esc(username) + "</wsse:Username>"
                + "<wsse:Password>" + UblBuilder.esc(password) + "</wsse:Password>"
                + "</wsse:UsernameToken></wsse:Security></soapenv:Header>"
                + "<soapenv:Body>" + operation + "</soapenv:Body></soapenv:Envelope>";
        String response = post(envelope);
        Document doc;
        try {
            doc = XmlSigner.parse(response);
        } catch (Exception e) {
            throw new SunatUnavailable("La respuesta de SUNAT no es un XML válido.", e);
        }
        String faultCode = text(doc, "faultcode");
        if (faultCode != null) {
            throw fault(faultCode, text(doc, "faultstring"));
        }
        return doc;
    }

    /** Envía el sobre SOAP. Protegido para poder simular a SUNAT en pruebas. */
    protected String post(String envelope) {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", "text/xml; charset=utf-8")
                .header("SOAPAction", "\"\"")
                .POST(HttpRequest.BodyPublishers.ofString(envelope, StandardCharsets.UTF_8))
                .build();
        HttpResponse<String> res;
        try {
            res = HTTP.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new SunatUnavailable("No se pudo conectar con SUNAT. Intenta de nuevo en unos minutos.", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new SunatUnavailable("Se interrumpió la conexión con SUNAT.", e);
        }
        String body = res.body();
        // SUNAT responde los errores como SOAP Fault con HTTP 500.
        if (res.statusCode() >= 300 && (body == null || !body.contains("Fault"))) {
            throw new SunatUnavailable("SUNAT respondió HTTP " + res.statusCode() + ".", null);
        }
        return body;
    }

    static SunatFault fault(String faultCode, String faultString) {
        String message = faultString == null ? "" : faultString.trim();
        int code = digits(faultCode);
        if (code < 0) code = digits(message);
        if (message.matches("\\d+")) {
            message = "Error " + message + " de SUNAT";
        }
        return new SunatFault(code, message.isEmpty() ? "Error de SUNAT " + faultCode : message);
    }

    private static int digits(String s) {
        if (s == null) return -1;
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d{3,4})").matcher(s);
        int last = -1;
        while (m.find()) last = Integer.parseInt(m.group(1));
        return last;
    }

    // ---------------------------------------------------------------- ZIP y CDR

    static byte[] zip(String entryName, String content) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream(); ZipOutputStream zip = new ZipOutputStream(out)) {
            zip.putNextEntry(new ZipEntry(entryName));
            zip.write(content.getBytes(StandardCharsets.UTF_8));
            zip.closeEntry();
            zip.finish();
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    public static Cdr readCdr(String zipBase64) {
        byte[] zipBytes = Base64.getMimeDecoder().decode(zipBase64.trim());
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (!entry.isDirectory() && entry.getName().toLowerCase().endsWith(".xml")) {
                    Document doc = XmlSigner.parse(new String(zip.readAllBytes(), StandardCharsets.UTF_8));
                    Element response = first(doc.getDocumentElement(), "DocumentResponse");
                    Element scope = response == null ? doc.getDocumentElement() : response;
                    String code = textIn(scope, "ResponseCode");
                    String description = textIn(scope, "Description");
                    List<String> notes = new ArrayList<>();
                    NodeList nl = doc.getDocumentElement().getChildNodes();
                    for (int i = 0; i < nl.getLength(); i++) {
                        Node n = nl.item(i);
                        if (n instanceof Element el && "Note".equals(el.getLocalName())) {
                            notes.add(el.getTextContent().trim());
                        }
                    }
                    return new Cdr(code == null ? -1 : Integer.parseInt(code.trim()),
                            description == null ? "" : description.trim(), notes, zipBase64.trim());
                }
            }
        } catch (Exception e) {
            throw new SunatUnavailable("No se pudo leer la constancia de recepción (CDR) de SUNAT.", e);
        }
        throw new SunatUnavailable("El CDR de SUNAT no contiene un XML.", null);
    }

    private static String text(Document doc, String localName) {
        NodeList nl = doc.getElementsByTagNameNS("*", localName);
        if (nl.getLength() == 0) nl = doc.getElementsByTagName(localName);
        return nl.getLength() == 0 ? null : nl.item(0).getTextContent();
    }

    private static Element first(Element root, String localName) {
        NodeList nl = root.getElementsByTagNameNS("*", localName);
        return nl.getLength() == 0 ? null : (Element) nl.item(0);
    }

    private static String textIn(Element root, String localName) {
        Element el = first(root, localName);
        return el == null ? null : el.getTextContent();
    }
}
