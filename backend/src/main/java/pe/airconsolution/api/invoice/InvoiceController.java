package pe.airconsolution.api.invoice;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import pe.airconsolution.api.admin.AdminController.PageResponse;
import pe.airconsolution.api.invoice.InvoiceDtos.InvoiceRequest;
import pe.airconsolution.api.invoice.InvoiceDtos.InvoiceResponse;
import pe.airconsolution.api.invoice.InvoiceDtos.InvoiceSummary;
import pe.airconsolution.api.invoice.InvoiceDtos.InvoicingSettings;
import pe.airconsolution.api.invoice.InvoiceDtos.VoidRequest;

/** Facturación desde el panel (protegido: está bajo /api/v1/admin). */
@RestController
@RequestMapping("/api/v1/admin/invoices")
@Tag(name = "Facturación")
@SecurityRequirement(name = "basicAuth")
public class InvoiceController {

    private final InvoiceService service;

    public InvoiceController(InvoiceService service) {
        this.service = service;
    }

    @GetMapping("/settings")
    @Operation(summary = "Datos del emisor y estado de la facturación electrónica")
    public InvoicingSettings settings() {
        return service.settings();
    }

    @GetMapping
    @Operation(summary = "Listar comprobantes")
    public PageResponse<InvoiceSummary> list(@RequestParam(required = false) InvoiceType type,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return PageResponse.of(service.list(type, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Ver un comprobante con su detalle")
    public InvoiceResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Emitir una factura o boleta")
    public InvoiceResponse create(@Valid @RequestBody InvoiceRequest request) {
        return service.create(request);
    }

    @PostMapping("/{id}/send")
    @Operation(summary = "Enviar (o reintentar) un comprobante a SUNAT vía Nubefact")
    public InvoiceResponse send(@PathVariable Long id) {
        return service.send(id);
    }

    @PostMapping("/{id}/void")
    @Operation(summary = "Anular un comprobante")
    public InvoiceResponse voidInvoice(@PathVariable Long id, @Valid @RequestBody VoidRequest request) {
        return service.voidInvoice(id, request.reason());
    }
}
