package pe.airconsolution.api.contact;

import java.util.Map;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import pe.airconsolution.api.booking.BookingDtos;

@RestController
@RequestMapping("/api/v1/contact")
@Tag(name = "Contacto")
public class ContactController {

    private final ContactMessageRepository repository;

    public ContactController(ContactMessageRepository repository) {
        this.repository = repository;
    }

    public record ContactRequest(
            @NotBlank(message = "Ingresa tu nombre.")
            @Size(min = 3, max = 120, message = "El nombre debe tener entre 3 y 120 caracteres.")
            String name,
            @NotBlank(message = "Ingresa tu teléfono.")
            @Pattern(regexp = BookingDtos.PHONE_REGEX, message = "Ingresa un teléfono válido.")
            String phone,
            @Email(message = "Ingresa un correo válido.")
            @Size(max = 160)
            String email,
            @NotBlank(message = "Escribe tu mensaje.")
            @Size(min = 10, max = 2000, message = "El mensaje debe tener entre 10 y 2000 caracteres.")
            String message,
            @AssertTrue(message = "Debes aceptar la política de privacidad.")
            boolean privacyAccepted,
            String website) {
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Enviar un mensaje de contacto")
    public Map<String, Object> create(@Valid @RequestBody ContactRequest req) {
        // Honeypot: si un bot llenó el campo oculto respondemos OK sin guardar nada.
        if (req.website() == null || req.website().isBlank()) {
            ContactMessage m = new ContactMessage();
            m.setName(req.name().trim());
            m.setPhone(req.phone().trim());
            m.setEmail(req.email() == null || req.email().isBlank() ? null : req.email().trim());
            m.setMessage(req.message().trim());
            repository.save(m);
        }
        return Map.of("ok", true, "message", "¡Gracias! Te contactaremos muy pronto.");
    }
}
