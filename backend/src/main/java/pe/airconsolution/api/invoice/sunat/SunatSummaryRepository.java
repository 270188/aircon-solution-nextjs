package pe.airconsolution.api.invoice.sunat;

import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SunatSummaryRepository extends JpaRepository<SunatSummary, Long> {

    @Query("select coalesce(max(s.correlative), 0) from SunatSummary s where s.kind = :kind and s.issueDate = :date")
    int maxCorrelative(@Param("kind") String kind, @Param("date") LocalDate date);
}
