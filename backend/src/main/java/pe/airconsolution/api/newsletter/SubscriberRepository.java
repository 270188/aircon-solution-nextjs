package pe.airconsolution.api.newsletter;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriberRepository extends JpaRepository<Subscriber, Long> {

    boolean existsByEmailIgnoreCase(String email);
}
