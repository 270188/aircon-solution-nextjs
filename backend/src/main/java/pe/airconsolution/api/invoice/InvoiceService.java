package pe.airconsolution.api.invoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Base64;
import java.util.EnumSet;
import java.util.List;
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
    private final ElectronicInvoicing provider;
    private final AppProperties.Invoicing config;
    private final ReentrantLock numberingLock = new ReentrantLock();

    public InvoiceService(InvoiceRepository repository, SunatClient sunat, NubefactClient nubefact, AppProperties props) {
        this.repository = repository;
        this.config = props.invoicing();
        this.provider = choose(config.provider(), sunat, nubefact);
    }

    /** INVOICE_PROVIDER manda; si está vacío se usa SUNAT directo si está configurado, si no Nubefact. */
    static ElectronicInvoicing choose(String name, SunatClient sunat, NubefactClient nubefact) {
        if ("SUNAT".equalsIgnoreCase(name)) return sunat;
        if ("NUBEFACT".equalsIgnoreCase(name)) return nubefact;
        for (ElectronicInvoicing p : List.<ElectronicInvoicing>of(sunat, nubefact)) {
            if (p.enabled()) return p;
        }
        return nubefact;
    }

    public InvoicingSettings settings() {
        return new InvoicingSettings(issuer(), config.seriesFactura(), config.seriesBoleta(), provider.enabled(),
                provider.label());
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
        boolean includesIgv = Boolean.TRUE.equals(req.pricesIncludeIgv());
        for (ItemRequest r : req.items()) {
            InvoiceItem it = computeItem(r, includesIgv);
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

        if (provider.enabled()) {
            applyResult(saved, provider.send(saved));
        }
        return toResponse(saved);
    }

    /** Envía (o reintenta) un borrador o un comprobante con error de envío. */
    @Transactional
    public InvoiceResponse send(Long id) {
        Invoice inv = load(id);
        if (!provider.enabled()) {
            throw new BusinessException("La facturación electrónica no está configurada. Revisa las variables SUNAT_* (o NUBEFACT_*).");
        }
        if (!EnumSet.of(InvoiceStatus.BORRADOR, InvoiceStatus.ERROR_ENVIO, InvoiceStatus.RECHAZADA).contains(inv.getStatus())) {
            throw new BusinessException("Este comprobante ya fue enviado.");
        }
        applyResult(inv, provider.send(inv));
        return toResponse(inv);
    }

    @Transactional
    public InvoiceResponse voidInvoice(Long id, String reason) {
        Invoice inv = load(id);
        switch (inv.getStatus()) {
            case ANULADA -> throw new BusinessException("El comprobante ya está anulado.");
            case BAJA_PENDIENTE -> throw new BusinessException("La anulación ya está en proceso en SUNAT. Consulta su estado.");
            case ACEPTADA -> {
                if (!provider.enabled()) {
                    throw new BusinessException("Para anular un comprobante aceptado por SUNAT se necesita la facturación electrónica configurada.");
                }
                ElectronicInvoicing.Result r = provider.voidInvoice(inv, reason);
                if (r.pending()) {
                    inv.setStatus(InvoiceStatus.BAJA_PENDIENTE);
                    inv.setSunatTicket(r.ticket());
                    inv.setSunatDescription(limit("Anulación en proceso (" + reason + "). " + r.description()));
                    return toResponse(inv);
                }
                if (!Boolean.TRUE.equals(r.accepted())) {
                    throw new BusinessException("No se pudo anular: " + r.description());
                }
                inv.setSunatTicket(r.ticket());
                inv.setSunatDescription(limit("Anulado: " + reason));
            }
            default -> inv.setSunatDescription("Anulado en el sistema: " + reason);
        }
        inv.setStatus(InvoiceStatus.ANULADA);
        return toResponse(inv);
    }

    /** Consulta en SUNAT una anulación que quedó en proceso. */
    @Transactional
    public InvoiceResponse checkVoid(Long id) {
        Invoice inv = load(id);
        if (inv.getStatus() != InvoiceStatus.BAJA_PENDIENTE) {
            throw new BusinessException("Este comprobante no tiene una anulación en proceso.");
        }
        ElectronicInvoicing.Result r = provider.checkVoid(inv);
        if (r.pending()) {
            inv.setSunatDescription(limit(r.description()));
        } else if (Boolean.TRUE.equals(r.accepted())) {
            inv.setStatus(InvoiceStatus.ANULADA);
            inv.setSunatDescription(limit("Anulado. " + r.description()));
        } else {
            // SUNAT rechazó la baja: el comprobante sigue vigente.
            inv.setStatus(InvoiceStatus.ACEPTADA);
            inv.setSunatTicket(null);
            inv.setSunatDescription(limit("No se pudo anular: " + r.description()));
        }
        return toResponse(inv);
    }

    /** XML firmado tal como se envió a SUNAT. */
    @Transactional(readOnly = true)
    public Download xml(Long id) {
        Invoice inv = load(id);
        if (inv.getSignedXml() == null) throw new NotFoundException("Este comprobante no tiene XML firmado.");
        return new Download(config.ruc() + "-" + inv.getType().sunatCode() + "-" + inv.getSeries() + "-" + inv.getNumber() + ".xml",
                "application/xml", inv.getSignedXml().getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    /** Constancia de recepción (CDR) de SUNAT, en ZIP. */
    @Transactional(readOnly = true)
    public Download cdr(Long id) {
        Invoice inv = load(id);
        if (inv.getCdrZip() == null) throw new NotFoundException("Este comprobante no tiene constancia de SUNAT.");
        return new Download("R-" + config.ruc() + "-" + inv.getType().sunatCode() + "-" + inv.getSeries() + "-" + inv.getNumber() + ".zip",
                "application/zip", Base64.getMimeDecoder().decode(inv.getCdrZip()));
    }

    public record Download(String fileName, String contentType, byte[] content) {
    }

    /**
     * Calcula una línea. Con precios sin IGV el valor unitario es el precio ingresado y se suma el 18 %;
     * con precios con IGV el valor unitario se obtiene dividiendo entre 1.18.
     */
    static InvoiceItem computeItem(ItemRequest r, boolean pricesIncludeIgv) {
        InvoiceItem it = new InvoiceItem();
        it.setDescription(r.description().trim());
        if (pricesIncludeIgv) {
            Igv.Line line = Igv.split(r.quantity(), r.unitPrice());
            it.setQuantity(line.quantity());
            it.setUnitPrice(line.unitPrice());
            it.setUnitValue(line.unitValue());
            it.setSubtotal(line.subtotal());
            it.setIgv(line.igv());
            it.setTotal(line.total());
        } else {
            Igv.Line line = Igv.addTo(r.quantity(), r.unitPrice());
            it.setQuantity(line.quantity());
            it.setUnitValue(line.unitValue().setScale(6, java.math.RoundingMode.HALF_UP));
            // precio_unitario (con IGV) que exige SUNAT para la línea
            it.setUnitPrice(line.unitValue().multiply(BigDecimal.ONE.add(Igv.RATE)).setScale(2, java.math.RoundingMode.HALF_UP));
            it.setSubtotal(line.subtotal());
            it.setIgv(line.igv());
            it.setTotal(line.total());
        }
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

    private void applyResult(Invoice inv, ElectronicInvoicing.Result r) {
        inv.setSunatDescription(limit(r.description()));
        if (r.signedXml() != null) inv.setSignedXml(r.signedXml());
        if (r.cdrBase64() != null) inv.setCdrZip(r.cdrBase64());
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
                i.getSunatDescription(), i.getPdfUrl(), i.getHash(), i.getSignedXml() != null, i.getCdrZip() != null,
                i.getCreatedAt(), issuer(),
                i.getItems().stream().map(ItemResponse::from).toList());
    }

    private static String limit(String s) {
        return s == null || s.length() <= 500 ? s : s.substring(0, 497) + "...";
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
