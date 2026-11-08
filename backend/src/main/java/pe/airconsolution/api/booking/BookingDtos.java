package pe.airconsolution.api.booking;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class BookingDtos {

    private BookingDtos() {
    }

    public static final String PHONE_REGEX = "^\\+?[0-9 ()-]{7,20}$";

    public record BookingRequest(
            @NotBlank(message = "Ingresa tu nombre completo.")
            @Size(min = 3, max = 120, message = "El nombre debe tener entre 3 y 120 caracteres.")
            String name,
            @NotBlank(message = "Ingresa tu teléfono.")
            @Pattern(regexp = PHONE_REGEX, message = "Ingresa un teléfono válido.")
            String phone,
            @Email(message = "Ingresa un correo válido.")
            @Size(max = 160)
            String email,
            @NotBlank(message = "Ingresa la dirección del servicio.")
            @Size(max = 200, message = "La dirección es demasiado larga.")
            String address,
            @Size(max = 80)
            String district,
            @NotNull(message = "Selecciona un servicio.")
            ServiceType service,
            @Size(max = 1000, message = "La descripción no puede superar 1000 caracteres.")
            String description,
            @NotNull(message = "Selecciona una fecha.")
            LocalDate date,
            @NotNull(message = "Selecciona un horario.")
            @JsonFormat(pattern = "HH:mm")
            LocalTime time,
            @AssertTrue(message = "Debes aceptar la política de privacidad.")
            boolean privacyAccepted,
            /** Campo trampa para bots: los humanos no lo ven ni lo llenan. */
            String website) {
    }

    public record BookingCreated(
            String code,
            LocalDate date,
            @JsonFormat(pattern = "HH:mm") LocalTime time,
            String service,
            BookingStatus status) {

        static BookingCreated from(Booking b) {
            return new BookingCreated(b.getCode(), b.getDate(), b.getTime(), b.getService().label(), b.getStatus());
        }
    }

    /** Datos públicos para que el cliente consulte el estado de su cita (sin datos personales). */
    public record BookingTracking(
            String code,
            String service,
            LocalDate date,
            @JsonFormat(pattern = "HH:mm") LocalTime time,
            BookingStatus status,
            Instant updatedAt) {

        static BookingTracking from(Booking b) {
            return new BookingTracking(b.getCode(), b.getService().label(), b.getDate(), b.getTime(), b.getStatus(),
                    b.getUpdatedAt());
        }
    }

    public record SlotAvailability(@JsonFormat(pattern = "HH:mm") LocalTime time, boolean available) {
    }

    public record Availability(LocalDate date, boolean open, List<SlotAvailability> slots) {
    }

    public record ServiceOption(ServiceType id, String label) {
    }
}
