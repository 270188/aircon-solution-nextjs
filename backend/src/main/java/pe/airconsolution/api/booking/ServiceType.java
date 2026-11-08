package pe.airconsolution.api.booking;

/** Servicios que se pueden reservar desde la web. */
public enum ServiceType {
    AIRE_ACONDICIONADO("Instalación de Aire Acondicionado"),
    MANTENIMIENTO("Mantenimiento Preventivo"),
    REPARACION("Reparación de Equipos"),
    ELECTRICIDAD("Instalaciones Eléctricas"),
    ESTRUCTURAS("Estructuras Metálicas"),
    BOMBAS("Instalación de Bombas de Agua"),
    EMERGENCIA("Emergencia 24/7");

    private final String label;

    ServiceType(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
