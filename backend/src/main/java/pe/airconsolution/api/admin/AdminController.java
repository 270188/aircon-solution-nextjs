package pe.airconsolution.api.admin;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import pe.airconsolution.api.booking.Booking;
import pe.airconsolution.api.booking.BookingRepository;
import pe.airconsolution.api.booking.BookingStatus;
import pe.airconsolution.api.common.NotFoundException;
import pe.airconsolution.api.contact.ContactMessage;
import pe.airconsolution.api.contact.ContactMessageRepository;
import pe.airconsolution.api.newsletter.Subscriber;
import pe.airconsolution.api.newsletter.SubscriberRepository;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Administración")
@SecurityRequirement(name = "basicAuth")
public class AdminController {

    private final BookingRepository bookings;
    private final ContactMessageRepository contacts;
    private final SubscriberRepository subscribers;

    public AdminController(BookingRepository bookings, ContactMessageRepository contacts,
            SubscriberRepository subscribers) {
        this.bookings = bookings;
        this.contacts = contacts;
        this.subscribers = subscribers;
    }

    public record AdminBooking(Long id, String code, String name, String phone, String email, String address,
            String district, String service, String description, LocalDate date,
            @JsonFormat(pattern = "HH:mm") LocalTime time, BookingStatus status, String adminNotes,
            Instant createdAt) {

        static AdminBooking from(Booking b) {
            return new AdminBooking(b.getId(), b.getCode(), b.getName(), b.getPhone(), b.getEmail(), b.getAddress(),
                    b.getDistrict(), b.getService().label(), b.getDescription(), b.getDate(), b.getTime(),
                    b.getStatus(), b.getAdminNotes(), b.getCreatedAt());
        }
    }

    public record StatusUpdate(@NotNull(message = "Indica el nuevo estado.") BookingStatus status,
            @Size(max = 1000) String adminNotes) {
    }

    public record PageResponse<T>(java.util.List<T> items, int page, int size, long total, int totalPages) {

        static <T> PageResponse<T> of(Page<T> p) {
            return new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(),
                    p.getTotalPages());
        }
    }

    @GetMapping("/me")
    @Operation(summary = "Verifica las credenciales del panel")
    public Map<String, Object> me() {
        return Map.of("ok", true);
    }

    @GetMapping("/stats")
    @Operation(summary = "Resumen para el panel")
    public Map<String, Object> stats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (BookingStatus s : BookingStatus.values()) {
            byStatus.put(s.name(), bookings.countByStatus(s));
        }
        stats.put("bookingsByStatus", byStatus);
        stats.put("totalBookings", bookings.count());
        stats.put("upcomingBookings", bookings.countByDateGreaterThanEqualAndStatusIn(LocalDate.now(),
                java.util.EnumSet.of(BookingStatus.PENDIENTE, BookingStatus.CONFIRMADA)));
        stats.put("unreadMessages", contacts.countByReadFalse());
        stats.put("subscribers", subscribers.count());
        return stats;
    }

    @GetMapping("/bookings")
    @Operation(summary = "Listar reservas (paginado, filtro opcional por estado)")
    public PageResponse<AdminBooking> listBookings(@RequestParam(required = false) BookingStatus status,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        PageRequest pr = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "date", "time"));
        Page<Booking> result = status == null ? bookings.findAll(pr) : bookings.findByStatus(status, pr);
        return PageResponse.of(result.map(AdminBooking::from));
    }

    @PatchMapping("/bookings/{id}/status")
    @Transactional
    @Operation(summary = "Cambiar el estado de una reserva")
    public AdminBooking updateStatus(@PathVariable Long id, @Valid @RequestBody StatusUpdate update) {
        Booking b = bookings.findById(id).orElseThrow(() -> new NotFoundException("Reserva no encontrada."));
        b.setStatus(update.status());
        if (update.adminNotes() != null) {
            b.setAdminNotes(update.adminNotes().isBlank() ? null : update.adminNotes().trim());
        }
        return AdminBooking.from(bookings.saveAndFlush(b));
    }

    @GetMapping("/contacts")
    @Operation(summary = "Listar mensajes de contacto")
    public PageResponse<ContactMessage> listContacts(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return PageResponse.of(contacts.findAll(PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"))));
    }

    @PatchMapping("/contacts/{id}/read")
    @Transactional
    @Operation(summary = "Marcar un mensaje como leído")
    public ContactMessage markRead(@PathVariable Long id) {
        ContactMessage m = contacts.findById(id).orElseThrow(() -> new NotFoundException("Mensaje no encontrado."));
        m.setRead(true);
        return contacts.save(m);
    }

    @GetMapping("/subscribers")
    @Operation(summary = "Listar suscriptores del boletín")
    public PageResponse<Subscriber> listSubscribers(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return PageResponse.of(subscribers.findAll(PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200),
                Sort.by(Sort.Direction.DESC, "createdAt"))));
    }
}
