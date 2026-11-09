package pe.airconsolution.api.quote;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import pe.airconsolution.api.admin.AdminController.PageResponse;
import pe.airconsolution.api.quote.QuoteDtos.QuoteRequest;
import pe.airconsolution.api.quote.QuoteDtos.QuoteResponse;
import pe.airconsolution.api.quote.QuoteDtos.QuoteSummary;
import pe.airconsolution.api.quote.QuoteDtos.StatusRequest;

/** Cotizaciones desde el panel (protegido: está bajo /api/v1/admin). */
@RestController
@RequestMapping("/api/v1/admin/quotes")
@Tag(name = "Cotizaciones")
@SecurityRequirement(name = "basicAuth")
public class QuoteController {

    private static final MediaType XLSX =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final QuoteService service;
    private final QuoteExcelExporter excel;

    public QuoteController(QuoteService service, QuoteExcelExporter excel) {
        this.service = service;
        this.excel = excel;
    }

    @GetMapping
    @Operation(summary = "Listar cotizaciones")
    public PageResponse<QuoteSummary> list(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return PageResponse.of(service.list(page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Ver una cotización")
    public QuoteResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear una cotización")
    public QuoteResponse create(@Valid @RequestBody QuoteRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Marcar una cotización como aceptada, rechazada o vencida")
    public QuoteResponse status(@PathVariable Long id, @Valid @RequestBody StatusRequest request) {
        return service.updateStatus(id, request.status());
    }

    @GetMapping("/{id}/excel")
    @Operation(summary = "Descargar la cotización en Excel con el logo de la empresa")
    public ResponseEntity<byte[]> excel(@PathVariable Long id) {
        Quote q = service.loadForExport(id);
        byte[] file = excel.export(q);
        return ResponseEntity.ok()
                .contentType(XLSX)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("Cotizacion-" + q.code() + ".xlsx").build().toString())
                .body(file);
    }
}
