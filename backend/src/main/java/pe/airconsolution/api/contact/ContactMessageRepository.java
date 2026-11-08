package pe.airconsolution.api.contact;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {

    long countByReadFalse();
}
