package pe.airconsolution.api.booking;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.locks.ReentrantLock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.airconsolution.api.booking.BookingDtos.Availability;
import pe.airconsolution.api.booking.BookingDtos.BookingCreated;
import pe.airconsolution.api.booking.BookingDtos.BookingRequest;
import pe.airconsolution.api.booking.BookingDtos.BookingTracking;
import pe.airconsolution.api.booking.BookingDtos.SlotAvailability;
import pe.airconsolution.api.common.BusinessException;
import pe.airconsolution.api.common.NotFoundException;
import pe.airconsolution.api.config.AppProperties;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    static final Set<BookingStatus> ACTIVE = EnumSet.of(BookingStatus.PENDIENTE, BookingStatus.CONFIRMADA,
            BookingStatus.EN_PROCESO, BookingStatus.COMPLETADA);

    private final BookingRepository repository;
    private final BookingCodeGenerator codes;
    private final AppProperties.Booking rules;
    // Evita que dos reservas simultáneas ocupen el último cupo del mismo horario.
    private final ReentrantLock bookingLock = new ReentrantLock();

    public BookingService(BookingRepository repository, BookingCodeGenerator codes, AppProperties props) {
        this.repository = repository;
        this.codes = codes;
        this.rules = props.booking();
    }

    @Transactional(readOnly = true)
    public Availability availability(LocalDate date) {
        if (!isBookableDate(date)) {
            return new Availability(date, false, List.of());
        }
        List<LocalTime> taken = repository.findTakenTimes(date, ACTIVE);
        ZonedDateTime now = ZonedDateTime.now(rules.zone());
        List<SlotAvailability> slots = rules.slots().stream()
                .map(slot -> {
                    long used = taken.stream().filter(slot::equals).count();
                    boolean past = date.equals(now.toLocalDate()) && !slot.isAfter(now.toLocalTime().plusHours(1));
                    return new SlotAvailability(slot, !past && used < rules.capacityPerSlot());
                })
                .toList();
        return new Availability(date, true, slots);
    }

    @Transactional
    public BookingCreated create(BookingRequest req) {
        if (req.website() != null && !req.website().isBlank()) {
            throw new IllegalArgumentException("Solicitud rechazada.");
        }
        if (!isBookableDate(req.date())) {
            throw new BusinessException("La fecha seleccionada no está disponible para reservas.");
        }
        if (!rules.slots().contains(req.time())) {
            throw new BusinessException("El horario seleccionado no es válido.");
        }
        bookingLock.lock();
        try {
            boolean free = availability(req.date()).slots().stream()
                    .anyMatch(s -> s.time().equals(req.time()) && s.available());
            if (!free) {
                throw new BusinessException("Ese horario acaba de ocuparse. Por favor elige otro.");
            }
            Booking b = new Booking();
            b.setCode(uniqueCode());
            b.setName(req.name().trim());
            b.setPhone(req.phone().trim());
            b.setEmail(blankToNull(req.email()));
            b.setAddress(req.address().trim());
            b.setDistrict(blankToNull(req.district()));
            b.setService(req.service());
            b.setDescription(blankToNull(req.description()));
            b.setDate(req.date());
            b.setTime(req.time());
            Booking saved = repository.saveAndFlush(b);
            log.info("Nueva reserva {} para {} {}", saved.getCode(), saved.getDate(), saved.getTime());
            return BookingCreated.from(saved);
        } finally {
            bookingLock.unlock();
        }
    }

    @Transactional(readOnly = true)
    public BookingTracking track(String code) {
        return repository.findByCodeIgnoreCase(code.trim())
                .map(BookingTracking::from)
                .orElseThrow(() -> new NotFoundException("No encontramos una reserva con ese código."));
    }

    boolean isBookableDate(LocalDate date) {
        LocalDate today = LocalDate.now(rules.zone());
        return date != null
                && !date.isBefore(today)
                && !date.isAfter(today.plusDays(rules.maxDaysAhead()))
                && !rules.closedDays().contains(date.getDayOfWeek());
    }

    private String uniqueCode() {
        String code;
        do {
            code = codes.next();
        } while (repository.existsByCode(code));
        return code;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
