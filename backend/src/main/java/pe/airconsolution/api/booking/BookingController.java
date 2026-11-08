package pe.airconsolution.api.booking;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import pe.airconsolution.api.booking.BookingDtos.Availability;
import pe.airconsolution.api.booking.BookingDtos.BookingCreated;
import pe.airconsolution.api.booking.BookingDtos.BookingRequest;
import pe.airconsolution.api.booking.BookingDtos.BookingTracking;
import pe.airconsolution.api.booking.BookingDtos.ServiceOption;

@RestController
@RequestMapping("/api/v1/bookings")
@Tag(name = "Reservas")
public class BookingController {

    private final BookingService service;

    public BookingController(BookingService service) {
        this.service = service;
    }

    @GetMapping("/services")
    @Operation(summary = "Servicios que se pueden reservar")
    public List<ServiceOption> services() {
        return Arrays.stream(ServiceType.values()).map(s -> new ServiceOption(s, s.label())).toList();
    }

    @GetMapping("/availability")
    @Operation(summary = "Horarios disponibles para una fecha")
    public Availability availability(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.availability(date);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear una reserva de visita técnica")
    public BookingCreated create(@Valid @RequestBody BookingRequest request) {
        return service.create(request);
    }

    @GetMapping("/{code}")
    @Operation(summary = "Consultar el estado de una reserva por su código")
    public BookingTracking track(@PathVariable String code) {
        return service.track(code);
    }
}
