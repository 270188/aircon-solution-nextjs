package pe.airconsolution.api.quote;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import pe.airconsolution.api.invoice.InvoiceDtos.ItemRequest;

public final class QuoteDtos {

    private QuoteDtos() {
    }

    public record QuoteRequest(
            @Size(max = 15) String customerDoc,
            @NotBlank(message = "Ingresa el nombre o razón social del cliente.") @Size(max = 200) String customerName,
            @Size(max = 120) String customerContact,
            @Size(max = 20) String customerPhone,
            @Email(message = "Correo no válido.") @Size(max = 160) String customerEmail,
            @Size(max = 250) String customerAddress,
            Long bookingId,
            @Min(value = 1, message = "La validez mínima es 1 día.") @Max(value = 90, message = "La validez máxima es 90 días.")
            Integer validDays,
            /** false (por defecto): precios sin IGV, se suma el 18 %; true: los precios ya incluyen IGV. */
            Boolean pricesIncludeIgv,
            @Size(max = 1500) String notes,
            @NotEmpty(message = "Agrega al menos un ítem.") @Size(max = 50) List<@Valid ItemRequest> items) {
    }

    public record QuoteItemResponse(int lineNo, String description, BigDecimal quantity, BigDecimal unitPrice,
            BigDecimal subtotal, BigDecimal igv, BigDecimal total) {

        static QuoteItemResponse from(QuoteItem i) {
            return new QuoteItemResponse(i.getLineNo(), i.getDescription(), i.getQuantity(), i.getUnitPrice(),
                    i.getSubtotal(), i.getIgv(), i.getTotal());
        }
    }

    public record QuoteResponse(Long id, String code, LocalDate issueDate, LocalDate validUntil, String customerDoc,
            String customerName, String customerContact, String customerPhone, String customerEmail,
            String customerAddress, Long bookingId, boolean pricesIncludeIgv, BigDecimal subtotal, BigDecimal igv,
            BigDecimal total, String totalInWords, QuoteStatus status, String notes, Instant createdAt, List<QuoteItemResponse> items) {
    }

    public record QuoteSummary(Long id, String code, LocalDate issueDate, LocalDate validUntil, String customerName,
            BigDecimal total, QuoteStatus status) {

        static QuoteSummary from(Quote q) {
            return new QuoteSummary(q.getId(), q.code(), q.getIssueDate(), q.getValidUntil(), q.getCustomerName(),
                    q.getTotal(), q.getStatus());
        }
    }

    public record StatusRequest(@NotNull(message = "Indica el estado.") QuoteStatus status) {
    }
}
