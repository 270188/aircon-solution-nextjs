package pe.airconsolution.api.booking;

/** Servicios que se pueden reservar desde la web. */
public enum ServiceType {
    AIRE_ACONDICIONADO("Instalación de Aire Acondicionado"),
    MANTENIMIENTO("Mantenimiento Preventivo"),
    REPARACION("Mantenimiento de Línea Blanca"),
    ELECTRICIDAD("Instalaciones Eléctricas"),
    ESTRUCTURAS("Estructuras Metálicas"),
    BOMBAS("Servicio de Gasfitería"),
    EMERGENCIA("Emergencia 24/7");

    private final String label;

    ServiceType(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
