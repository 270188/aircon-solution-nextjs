package pe.airconsolution.api.quote;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface QuoteRepository extends JpaRepository<Quote, Long> {

    @Query("select coalesce(max(q.number), 0) from Quote q")
    int maxNumber();

    @EntityGraph(attributePaths = "items")
    Optional<Quote> findWithItemsById(Long id);
}
