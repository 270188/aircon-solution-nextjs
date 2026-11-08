package pe.airconsolution.api.booking;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByCodeIgnoreCase(String code);

    boolean existsByCode(String code);

    long countByDateAndTimeAndStatusIn(LocalDate date, LocalTime time, Collection<BookingStatus> statuses);

    @Query("select b.time from Booking b where b.date = :date and b.status in :statuses")
    List<LocalTime> findTakenTimes(LocalDate date, Collection<BookingStatus> statuses);

    Page<Booking> findByStatus(BookingStatus status, Pageable pageable);

    long countByStatus(BookingStatus status);

    long countByDateGreaterThanEqualAndStatusIn(LocalDate date, Collection<BookingStatus> statuses);
}
