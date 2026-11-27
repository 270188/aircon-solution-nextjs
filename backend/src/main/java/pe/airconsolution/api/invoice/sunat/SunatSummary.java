package pe.airconsolution.api.invoice.sunat;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** Comunicación de baja (RA) o resumen diario (RC) enviado a SUNAT. Lleva la numeración diaria. */
@Entity
@Table(name = "sunat_summaries")
public class SunatSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** RA = comunicación de baja, RC = resumen diario. */
    @Column(nullable = false, length = 2)
    private String kind;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(nullable = false)
    private int correlative;

    @Column(name = "invoice_id", nullable = false)
    private Long invoiceId;

    @Column(length = 40)
    private String ticket;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected SunatSummary() {
    }

    public SunatSummary(String kind, LocalDate issueDate, int correlative, Long invoiceId, String ticket) {
        this.kind = kind;
        this.issueDate = issueDate;
        this.correlative = correlative;
        this.invoiceId = invoiceId;
        this.ticket = ticket;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getKind() { return kind; }
    public LocalDate getIssueDate() { return issueDate; }
    public int getCorrelative() { return correlative; }
    public Long getInvoiceId() { return invoiceId; }
    public String getTicket() { return ticket; }
}
