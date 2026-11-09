package pe.airconsolution.api.invoice;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @Query("select coalesce(max(i.number), 0) from Invoice i where i.series = :series")
    int maxNumber(String series);

    @EntityGraph(attributePaths = "items")
    Optional<Invoice> findWithItemsById(Long id);

    Page<Invoice> findByType(InvoiceType type, Pageable pageable);
}
