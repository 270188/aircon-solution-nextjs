package pe.airconsolution.api.invoice;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "invoice_items")
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @Column(name = "line_no", nullable = false)
    private int lineNo;

    @Column(nullable = false, length = 250)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    /** Precio unitario con IGV incluido. */
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    /** Valor unitario sin IGV. */
    @Column(name = "unit_value", nullable = false, precision = 16, scale = 6)
    private BigDecimal unitValue;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal igv;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    public Long getId() { return id; }
    void setInvoice(Invoice invoice) { this.invoice = invoice; }
    public int getLineNo() { return lineNo; }
    public void setLineNo(int lineNo) { this.lineNo = lineNo; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public BigDecimal getUnitValue() { return unitValue; }
    public void setUnitValue(BigDecimal unitValue) { this.unitValue = unitValue; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public BigDecimal getIgv() { return igv; }
    public void setIgv(BigDecimal igv) { this.igv = igv; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
}
