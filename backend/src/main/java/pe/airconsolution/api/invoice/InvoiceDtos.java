package pe.airconsolution.api.invoice;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class InvoiceDtos {

    private InvoiceDtos() {
    }

    public record ItemRequest(
            @NotBlank(message = "Describe el servicio o producto.")
            @Size(max = 250, message = "La descripción es demasiado larga.")
            String description,
            @NotNull(message = "Indica la cantidad.")
            @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor a 0.")
            @Digits(integer = 8, fraction = 2)
            BigDecimal quantity,
            @NotNull(message = "Indica el precio.")
            @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0.")
            @Digits(integer = 9, fraction = 2)
            BigDecimal unitPrice) {
    }

    public record InvoiceRequest(
            @NotNull(message = "Elige factura o boleta.")
            InvoiceType type,
            /** 6 = RUC, 1 = DNI, 4 = carné de extranjería, - = sin documento (solo boletas). */
            @NotBlank @Pattern(regexp = "[614-]", message = "Tipo de documento no válido.")
            String customerDocType,
            @Size(max = 15)
            String customerDocNumber,
            @NotBlank(message = "Ingresa el nombre o razón social del cliente.")
            @Size(max = 200)
            String customerName,
            @Size(max = 250)
            String customerAddress,
            @Email(message = "Correo no válido.")
            @Size(max = 160)
            String customerEmail,
            Long bookingId,
            LocalDate issueDate,
            @Size(max = 500)
            String observations,
            /** false (por defecto): precios sin IGV, se suma el 18 %; true: los precios ya incluyen IGV. */
            Boolean pricesIncludeIgv,
            @NotEmpty(message = "Agrega al menos un ítem.")
            @Size(max = 50)
            List<@Valid ItemRequest> items) {
    }

    public record ItemResponse(int lineNo, String description, BigDecimal quantity, BigDecimal unitPrice,
            BigDecimal unitValue, BigDecimal subtotal, BigDecimal igv, BigDecimal total) {

        static ItemResponse from(InvoiceItem i) {
            return new ItemResponse(i.getLineNo(), i.getDescription(), i.getQuantity(), i.getUnitPrice(),
                    i.getUnitValue(), i.getSubtotal(), i.getIgv(), i.getTotal());
        }
    }

    public record Issuer(String ruc, String businessName, String address) {
    }

    public record InvoiceResponse(
            Long id,
            InvoiceType type,
            String title,
            String series,
            int number,
            String fullNumber,
            LocalDate issueDate,
            String currency,
            String customerDocType,
            String customerDocNumber,
            String customerName,
            String customerAddress,
            String customerEmail,
            Long bookingId,
            BigDecimal subtotal,
            BigDecimal igv,
            BigDecimal total,
            String totalInWords,
            InvoiceStatus status,
            String observations,
            String sunatDescription,
            String pdfUrl,
            String hash,
            Instant createdAt,
            Issuer issuer,
            List<ItemResponse> items) {
    }

    public record InvoiceSummary(Long id, InvoiceType type, String fullNumber, LocalDate issueDate,
            String customerDocNumber, String customerName, BigDecimal total, InvoiceStatus status, String pdfUrl) {

        static InvoiceSummary from(Invoice i) {
            return new InvoiceSummary(i.getId(), i.getType(), i.fullNumber(), i.getIssueDate(),
                    i.getCustomerDocNumber(), i.getCustomerName(), i.getTotal(), i.getStatus(), i.getPdfUrl());
        }
    }

    public record VoidRequest(@NotBlank(message = "Indica el motivo de la anulación.") @Size(max = 100) String reason) {
    }

    public record InvoicingSettings(Issuer issuer, String seriesFactura, String seriesBoleta,
            boolean electronicEnabled) {
    }
}
