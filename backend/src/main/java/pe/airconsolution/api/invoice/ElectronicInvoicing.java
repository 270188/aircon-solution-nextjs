package pe.airconsolution.api.invoice;

/** Canal por el que los comprobantes llegan a SUNAT (directo o a través de un proveedor). */
public interface ElectronicInvoicing {

    /** Nombre que se muestra en el panel, p. ej. "SUNAT (beta)". */
    String label();

    boolean enabled();

    Result send(Invoice invoice);

    Result voidInvoice(Invoice invoice, String reason);

    /** Consulta una anulación que SUNAT dejó en proceso (pending = true). */
    default Result checkVoid(Invoice invoice) {
        return Result.rejected("Este canal no tiene anulaciones pendientes por consultar.");
    }

    /**
     * Resultado de un envío.
     *
     * @param accepted    true aceptado, false rechazado, null sin respuesta (se puede reintentar)
     * @param pending     SUNAT recibió el pedido pero aún lo procesa (anulaciones con ticket)
     * @param signedXml   XML firmado que se envió (debe conservarse)
     * @param cdrBase64   constancia de recepción (ZIP en Base64) que devolvió SUNAT
     */
    record Result(Boolean accepted, boolean pending, String description, String pdfUrl, String hash,
            String signedXml, String cdrBase64, String ticket) {

        public static Result rejected(String description) {
            return new Result(false, false, description, null, null, null, null, null);
        }

        public static Result unreachable(String description) {
            return new Result(null, false, description, null, null, null, null, null);
        }
    }
}
