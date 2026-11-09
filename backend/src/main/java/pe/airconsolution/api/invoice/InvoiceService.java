package pe.airconsolution.api.invoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.airconsolution.api.common.BusinessException;
import pe.airconsolution.api.common.NotFoundException;
import pe.airconsolution.api.config.AppProperties;
import pe.airconsolution.api.invoice.InvoiceDtos.InvoiceRequest;
import pe.airconsolution.api.invoice.InvoiceDtos.InvoiceResponse;
import pe.airconsolution.api.invoice.InvoiceDtos.InvoiceSummary;
import pe.airconsolution.api.invoice.InvoiceDtos.InvoicingSettings;
import pe.airconsolution.api.invoice.InvoiceDtos.Issuer;
import pe.airconsolution.api.invoice.InvoiceDtos.ItemRequest;
import pe.airconsolution.api.invoice.InvoiceDtos.ItemResponse;

@Service
public class InvoiceService {

    /** SUNAT exige identificar al cliente en boletas desde S/ 700. */
    static final BigDecimal BOLETA_ID_THRESHOLD = new BigDecimal("700.00");

    private final InvoiceRepository repository;
    private final NubefactClient nubefact;
    private final AppProperties.Invoicing config;
    private final ReentrantLock numberingLock = new ReentrantLock();

    public InvoiceService(InvoiceRepository repository, NubefactClient nubefact, AppProperties props) {
        this.repository = repository;
        this.nubefact = nubefact;
        this.config = props.invoicing();
    }

    public InvoicingSettings settings() {
        return new InvoicingSettings(issuer(), config.seriesFactura(), config.seriesBoleta(), nubefact.enabled());
    }

    @Transactional(readOnly = true)
    public Page<InvoiceSummary> list(InvoiceType type, int page, int size) {
        PageRequest pr = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "issueDate", "id"));
        Page<Invoice> result = type == null ? repository.findAll(pr) : repository.findByType(type, pr);
        return result.map(InvoiceSummary::from);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse get(Long id) {
        return toResponse(load(id));
    }

    @Transactional
    public InvoiceResponse create(InvoiceRequest req) {
        validateCustomer(req);
        LocalDate today = LocalDate.now(java.time.ZoneId.of("America/Lima"));
        LocalDate issueDate = req.issueDate() == null ? today : req.issueDate();
        if (issueDate.isAfter(today) || issueDate.isBefore(today.minusDays(3))) {
            throw new BusinessException("La fecha de emisión debe ser de hoy o de hasta 3 días atrás.");
        }

        Invoice inv = new Invoice();
        inv.setType(req.type());
        inv.setIssueDate(issueDate);
        inv.setCustomerDocType(req.customerDocType());
        inv.setCustomerDocNumber(blankToNull(req.customerDocNumber()));
        inv.setCustomerName(req.customerName().trim());
        inv.setCustomerAddress(blankToNull(req.customerAddress()));
        inv.setCustomerEmail(blankToNull(req.customerEmail()));
        inv.setBookingId(req.bookingId());
        inv.setObservations(blankToNull(req.observations()));

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal igv = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        int line = 1;
        for (ItemRequest r : req.items()) {
            InvoiceItem it = computeItem(r);
            it.setLineNo(line++);
            inv.addItem(it);
            subtotal = subtotal.add(it.getSubtotal());
            igv = igv.add(it.getIgv());
            total = total.add(it.getTotal());
        }
        inv.setSubtotal(subtotal);
        inv.setIgv(igv);
        inv.setTotal(total);

        if (req.type() == InvoiceType.BOLETA && total.compareTo(BOLETA_ID_THRESHOLD) >= 0
                && "-".equals(req.customerDocType())) {
            throw new BusinessException("Para boletas desde S/ 700 debes indicar el DNI del cliente.");
        }

        Invoice saved;
        numberingLock.lock();
        try {
            String series = req.type() == InvoiceType.FACTURA ? config.seriesFactura() : config.seriesBoleta();
            int first = req.type() == InvoiceType.FACTURA ? config.firstNumberFactura() : config.firstNumberBoleta();
            inv.setSeries(series);
            inv.setNumber(Math.max(repository.maxNumber(series) + 1, first));
            saved = repository.saveAndFlush(inv);
        } finally {
            numberingLock.unlock();
        }

        if (nubefact.enabled()) {
            applyResult(saved, nubefact.send(saved));
        }
        return toResponse(saved);
    }

    /** Envía (o reintenta) un borrador o un comprobante con error de envío. */
    @Transactional
    public InvoiceResponse send(Long id) {
        Invoice inv = load(id);
        if (!nubefact.enabled()) {
            throw new BusinessException("La facturación electrónica no está configurada. Agrega NUBEFACT_URL y NUBEFACT_TOKEN.");
        }
        if (!EnumSet.of(InvoiceStatus.BORRADOR, InvoiceStatus.ERROR_ENVIO, InvoiceStatus.RECHAZADA).contains(inv.getStatus())) {
            throw new BusinessException("Este comprobante ya fue enviado.");
        }
        applyResult(inv, nubefact.send(inv));
        return toResponse(inv);
    }

    @Transactional
    public InvoiceResponse voidInvoice(Long id, String reason) {
        Invoice inv = load(id);
        switch (inv.getStatus()) {
            case ANULADA -> throw new BusinessException("El comprobante ya está anulado.");
            case ACEPTADA -> {
                if (!nubefact.enabled()) {
                    throw new BusinessException("Para anular un comprobante aceptado por SUNAT se necesita el proveedor electrónico.");
                }
                NubefactClient.Result r = nubefact.voidInvoice(inv, reason);
                if (!Boolean.TRUE.equals(r.accepted())) {
                    throw new BusinessException("No se pudo anular: " + r.description());
                }
                inv.setSunatDescription("Anulado: " + reason);
            }
            default -> inv.setSunatDescription("Anulado en el sistema: " + reason);
        }
        inv.setStatus(InvoiceStatus.ANULADA);
        return toResponse(inv);
    }

    static InvoiceItem computeItem(ItemRequest r) {
        Igv.Line line = Igv.split(r.quantity(), r.unitPrice());
        InvoiceItem it = new InvoiceItem();
        it.setDescription(r.description().trim());
        it.setQuantity(line.quantity());
        it.setUnitPrice(line.unitPrice());
        it.setUnitValue(line.unitValue());
        it.setSubtotal(line.subtotal());
        it.setIgv(line.igv());
        it.setTotal(line.total());
        return it;
    }

    private void validateCustomer(InvoiceRequest req) {
        String doc = req.customerDocNumber() == null ? "" : req.customerDocNumber().trim();
        if (req.type() == InvoiceType.FACTURA) {
            if (!"6".equals(req.customerDocType()) || !PeruDocuments.isValidRuc(doc)) {
                throw new BusinessException("Para emitir factura ingresa un RUC válido de 11 dígitos.");
            }
            if (req.customerAddress() == null || req.customerAddress().isBlank()) {
                throw new BusinessException("Para emitir factura ingresa la dirección fiscal del cliente.");
            }
            return;
        }
        switch (req.customerDocType()) {
            case "1" -> {
                if (!PeruDocuments.isValidDni(doc)) throw new BusinessException("El DNI debe tener 8 dígitos.");
            }
            case "6" -> {
                if (!PeruDocuments.isValidRuc(doc)) throw new BusinessException("El RUC ingresado no es válido.");
            }
            case "4" -> {
                if (!doc.matches("[A-Za-z0-9]{6,12}")) throw new BusinessException("El carné de extranjería no es válido.");
            }
            default -> {
                // Boleta sin documento: permitido para montos menores a S/ 700.
            }
        }
    }

    private void applyResult(Invoice inv, NubefactClient.Result r) {
        inv.setSunatDescription(r.description());
        if (r.accepted() == null) {
            inv.setStatus(InvoiceStatus.ERROR_ENVIO);
        } else if (r.accepted()) {
            inv.setStatus(InvoiceStatus.ACEPTADA);
            inv.setPdfUrl(r.pdfUrl());
            inv.setHash(r.hash());
        } else {
            inv.setStatus(InvoiceStatus.RECHAZADA);
        }
    }

    private Invoice load(Long id) {
        return repository.findWithItemsById(id).orElseThrow(() -> new NotFoundException("Comprobante no encontrado."));
    }

    private Issuer issuer() {
        return new Issuer(config.ruc(), config.businessName(), config.address());
    }

    private InvoiceResponse toResponse(Invoice i) {
        return new InvoiceResponse(i.getId(), i.getType(), i.getType().title(), i.getSeries(), i.getNumber(),
                i.fullNumber(), i.getIssueDate(), i.getCurrency(), i.getCustomerDocType(), i.getCustomerDocNumber(),
                i.getCustomerName(), i.getCustomerAddress(), i.getCustomerEmail(), i.getBookingId(), i.getSubtotal(),
                i.getIgv(), i.getTotal(), AmountInWords.soles(i.getTotal()), i.getStatus(), i.getObservations(),
                i.getSunatDescription(), i.getPdfUrl(), i.getHash(), i.getCreatedAt(), issuer(),
                i.getItems().stream().map(ItemResponse::from).toList());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
