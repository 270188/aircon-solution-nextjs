package pe.airconsolution.api.invoice;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "doc_type", nullable = false, length = 10)
    private InvoiceType type;

    @Column(nullable = false, length = 4)
    private String series;

    @Column(nullable = false)
    private int number;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(nullable = false, length = 3)
    private String currency = "PEN";

    /** Catálogo 06 de SUNAT: 6 = RUC, 1 = DNI, 4 = carné de extranjería, - = sin documento. */
    @Column(name = "customer_doc_type", nullable = false, length = 1)
    private String customerDocType;

    @Column(name = "customer_doc_number", length = 15)
    private String customerDocNumber;

    @Column(name = "customer_name", nullable = false, length = 200)
    private String customerName;

    @Column(name = "customer_address", length = 250)
    private String customerAddress;

    @Column(name = "customer_email", length = 160)
    private String customerEmail;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal igv;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private InvoiceStatus status = InvoiceStatus.BORRADOR;

    @Column(length = 500)
    private String observations;

    @Column(name = "sunat_description", length = 500)
    private String sunatDescription;

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @Column(length = 100)
    private String hash;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("lineNo")
    private List<InvoiceItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void addItem(InvoiceItem item) {
        item.setInvoice(this);
        items.add(item);
    }

    /** Ej. "F001-00000023" */
    public String fullNumber() {
        return series + "-" + String.format("%08d", number);
    }

    public Long getId() { return id; }
    public InvoiceType getType() { return type; }
    public void setType(InvoiceType type) { this.type = type; }
    public String getSeries() { return series; }
    public void setSeries(String series) { this.series = series; }
    public int getNumber() { return number; }
    public void setNumber(int number) { this.number = number; }
    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }
    public String getCurrency() { return currency; }
    public String getCustomerDocType() { return customerDocType; }
    public void setCustomerDocType(String customerDocType) { this.customerDocType = customerDocType; }
    public String getCustomerDocNumber() { return customerDocNumber; }
    public void setCustomerDocNumber(String customerDocNumber) { this.customerDocNumber = customerDocNumber; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerAddress() { return customerAddress; }
    public void setCustomerAddress(String customerAddress) { this.customerAddress = customerAddress; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public BigDecimal getIgv() { return igv; }
    public void setIgv(BigDecimal igv) { this.igv = igv; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public InvoiceStatus getStatus() { return status; }
    public void setStatus(InvoiceStatus status) { this.status = status; }
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
    public String getSunatDescription() { return sunatDescription; }
    public void setSunatDescription(String sunatDescription) { this.sunatDescription = sunatDescription; }
    public String getPdfUrl() { return pdfUrl; }
    public void setPdfUrl(String pdfUrl) { this.pdfUrl = pdfUrl; }
    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }
    public List<InvoiceItem> getItems() { return items; }
    public Instant getCreatedAt() { return createdAt; }
}
