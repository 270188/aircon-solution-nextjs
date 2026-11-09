package pe.airconsolution.api.invoice;

public enum InvoiceStatus {
    /** Guardado en el sistema, todavía no enviado a SUNAT (no tiene validez tributaria). */
    BORRADOR,
    /** Aceptado por SUNAT a través del proveedor electrónico. */
    ACEPTADA,
    /** SUNAT o el proveedor lo rechazaron; ver sunatDescription. */
    RECHAZADA,
    /** No se pudo contactar al proveedor; se puede reintentar. */
    ERROR_ENVIO,
    ANULADA
}
