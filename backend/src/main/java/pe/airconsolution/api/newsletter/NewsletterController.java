package pe.airconsolution.api.newsletter;

import java.util.Locale;
import java.util.Map;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/newsletter")
@Tag(name = "Boletín")
public class NewsletterController {

    private final SubscriberRepository repository;

    public NewsletterController(SubscriberRepository repository) {
        this.repository = repository;
    }

    public record SubscribeRequest(
            @NotBlank(message = "Ingresa tu correo.")
            @Email(message = "Ingresa un correo válido.")
            @Size(max = 160)
            String email,
            String website) {
    }

    /** Idempotente: suscribirse dos veces con el mismo correo no es un error. */
    @PostMapping
    @Operation(summary = "Suscribirse al boletín")
    public Map<String, Object> subscribe(@Valid @RequestBody SubscribeRequest req) {
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        if ((req.website() == null || req.website().isBlank()) && !repository.existsByEmailIgnoreCase(email)) {
            try {
                repository.save(new Subscriber(email));
            } catch (DataIntegrityViolationException ignored) {
                // Otro envío simultáneo lo registró primero.
            }
        }
        return Map.of("ok", true, "message", "¡Listo! Recibirás nuestros consejos y promociones.");
    }
}
