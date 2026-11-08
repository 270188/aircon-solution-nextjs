package pe.airconsolution.api.booking;

public enum BookingStatus {
    PENDIENTE,
    CONFIRMADA,
    EN_PROCESO,
    COMPLETADA,
    CANCELADA;

    /** Una reserva cancelada libera su horario; las demás lo ocupan. */
    public boolean occupiesSlot() {
        return this != CANCELADA;
    }
}
