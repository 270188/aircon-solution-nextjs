package pe.airconsolution.api.invoice;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import pe.airconsolution.api.config.AppProperties;

/**
 * Cliente del API JSON de Nubefact (proveedor de facturación electrónica autorizado por SUNAT).
 * Nubefact firma el XML, lo envía a SUNAT y devuelve el PDF oficial con código QR.
 */
@Component
public class NubefactClient {

    private static final Logger log = LoggerFactory.getLogger(NubefactClient.class);
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    /** Resultado del envío. accepted = null cuando no hubo respuesta (error de red). */
    public record Result(Boolean accepted, String description, String pdfUrl, String hash) {
    }

    private final AppProperties.Invoicing config;
    private final RestClient http;

    public NubefactClient(AppProperties props) {
        this.config = props.invoicing();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(30_000);
        this.http = RestClient.builder().requestFactory(factory).build();
    }

    public boolean enabled() {
        return config.electronicEnabled();
    }

    public Result send(Invoice invoice) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("operacion", "generar_comprobante");
        body.put("tipo_de_comprobante", invoice.getType().nubefactCode());
        body.put("serie", invoice.getSeries());
        body.put("numero", invoice.getNumber());
        body.put("sunat_transaction", 1);
        body.put("cliente_tipo_de_documento", invoice.getCustomerDocType());
        body.put("cliente_numero_de_documento", nullToEmpty(invoice.getCustomerDocNumber(), "-"));
        body.put("cliente_denominacion", invoice.getCustomerName());
        body.put("cliente_direccion", nullToEmpty(invoice.getCustomerAddress(), ""));
        body.put("cliente_email", nullToEmpty(invoice.getCustomerEmail(), ""));
        body.put("fecha_de_emision", invoice.getIssueDate().format(DATE));
        body.put("moneda", 1);
        body.put("porcentaje_de_igv", new BigDecimal("18.00"));
        body.put("total_gravada", invoice.getSubtotal());
        body.put("total_igv", invoice.getIgv());
        body.put("total", invoice.getTotal());
        body.put("observaciones", nullToEmpty(invoice.getObservations(), ""));
        body.put("enviar_automaticamente_a_la_sunat", true);
        body.put("enviar_automaticamente_al_cliente", invoice.getCustomerEmail() != null);
        List<Map<String, Object>> items = new ArrayList<>();
        for (InvoiceItem it : invoice.getItems()) {
            Map<String, Object> line = new LinkedHashMap<>();
            line.put("unidad_de_medida", "ZZ");
            line.put("codigo", "SERV" + it.getLineNo());
            line.put("descripcion", it.getDescription());
            line.put("cantidad", it.getQuantity());
            line.put("valor_unitario", it.getUnitValue());
            line.put("precio_unitario", it.getUnitPrice());
            line.put("subtotal", it.getSubtotal());
            line.put("tipo_de_igv", 1);
            line.put("igv", it.getIgv());
            line.put("total", it.getTotal());
            line.put("anticipo_regularizacion", false);
            items.add(line);
        }
        body.put("items", items);
        return post(body, invoice.fullNumber());
    }

    public Result voidInvoice(Invoice invoice, String reason) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("operacion", "generar_anulacion");
        body.put("tipo_de_comprobante", invoice.getType().nubefactCode());
        body.put("serie", invoice.getSeries());
        body.put("numero", invoice.getNumber());
        body.put("motivo", reason);
        body.put("codigo_unico", "");
        return post(body, invoice.fullNumber() + " (anulación)");
    }

    @SuppressWarnings("unchecked")
    private Result post(Map<String, Object> body, String label) {
        try {
            Map<String, Object> res = http.post()
                    .uri(config.nubefactUrl())
                    .header("Authorization", "Token token=\"" + config.nubefactToken() + "\"")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            if (res == null) {
                return new Result(null, "Nubefact no devolvió respuesta.", null, null);
            }
            Object errors = res.get("errors");
            if (errors != null) {
                return new Result(false, String.valueOf(errors), null, null);
            }
            boolean accepted = Boolean.TRUE.equals(res.get("aceptada_por_sunat"));
            String description = str(res.get("sunat_description"));
            if (!accepted && description == null) {
                // Nubefact aceptó el documento y lo enviará a SUNAT en breve.
                accepted = true;
                description = "Registrado en Nubefact; SUNAT lo validará en unos minutos.";
            }
            log.info("Comprobante {} enviado a Nubefact. Aceptado: {}", label, accepted);
            return new Result(accepted, description, str(res.get("enlace_del_pdf")), str(res.get("codigo_hash")));
        } catch (RestClientResponseException e) {
            log.warn("Nubefact rechazó {}: {}", label, e.getResponseBodyAsString());
            return new Result(false, extractError(e.getResponseBodyAsString()), null, null);
        } catch (RestClientException e) {
            log.warn("No se pudo contactar a Nubefact para {}", label, e);
            return new Result(null, "No se pudo contactar al proveedor de facturación. Intenta de nuevo.", null, null);
        }
    }

    private static String extractError(String body) {
        int i = body.indexOf("\"errors\"");
        if (i < 0) return body.length() > 300 ? body.substring(0, 300) : body;
        String tail = body.substring(i + 8).replaceFirst("^\\s*:\\s*\"?", "");
        int end = tail.indexOf('"');
        return end > 0 ? tail.substring(0, end) : tail;
    }

    private static String nullToEmpty(String s, String fallback) {
        return s == null || s.isBlank() ? fallback : s;
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }
}
