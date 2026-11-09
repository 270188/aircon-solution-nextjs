package pe.airconsolution.api.quote;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.airconsolution.api.common.NotFoundException;
import pe.airconsolution.api.invoice.AmountInWords;
import pe.airconsolution.api.invoice.Igv;
import pe.airconsolution.api.invoice.InvoiceDtos.ItemRequest;
import pe.airconsolution.api.quote.QuoteDtos.QuoteItemResponse;
import pe.airconsolution.api.quote.QuoteDtos.QuoteRequest;
import pe.airconsolution.api.quote.QuoteDtos.QuoteResponse;
import pe.airconsolution.api.quote.QuoteDtos.QuoteSummary;

@Service
public class QuoteService {

    static final String DEFAULT_NOTES = """
            • Forma de pago: 50 % de adelanto y 50 % al finalizar el trabajo.
            • Garantía por escrito sobre el servicio realizado.
            • Tiempo de ejecución a coordinar con el cliente.""";

    private final QuoteRepository repository;
    private final ReentrantLock numberingLock = new ReentrantLock();

    public QuoteService(QuoteRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Page<QuoteSummary> list(int page, int size) {
        return repository.findAll(PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "number"))).map(QuoteSummary::from);
    }

    @Transactional(readOnly = true)
    public QuoteResponse get(Long id) {
        return toResponse(load(id));
    }

    @Transactional(readOnly = true)
    public Quote loadForExport(Long id) {
        Quote q = load(id);
        q.getItems().size();
        return q;
    }

    @Transactional
    public QuoteResponse create(QuoteRequest req) {
        LocalDate today = LocalDate.now(ZoneId.of("America/Lima"));
        Quote q = new Quote();
        q.setIssueDate(today);
        q.setValidUntil(today.plusDays(req.validDays() == null ? 15 : req.validDays()));
        q.setCustomerDoc(blankToNull(req.customerDoc()));
        q.setCustomerName(req.customerName().trim());
        q.setCustomerContact(blankToNull(req.customerContact()));
        q.setCustomerPhone(blankToNull(req.customerPhone()));
        q.setCustomerEmail(blankToNull(req.customerEmail()));
        q.setCustomerAddress(blankToNull(req.customerAddress()));
        q.setBookingId(req.bookingId());
        boolean includesIgv = Boolean.TRUE.equals(req.pricesIncludeIgv());
        q.setPricesIncludeIgv(includesIgv);
        String igvNote = includesIgv ? "• Los precios incluyen IGV.\n" : "• Los precios unitarios no incluyen IGV; el 18 % se suma al total.\n";
        q.setNotes(req.notes() == null || req.notes().isBlank() ? igvNote + DEFAULT_NOTES : req.notes().trim());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal igv = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        int lineNo = 1;
        for (ItemRequest r : req.items()) {
            Igv.Line line = includesIgv ? Igv.split(r.quantity(), r.unitPrice()) : Igv.addTo(r.quantity(), r.unitPrice());
            QuoteItem it = new QuoteItem();
            it.setLineNo(lineNo++);
            it.setDescription(r.description().trim());
            it.setQuantity(line.quantity());
            it.setUnitPrice(line.unitPrice());
            it.setSubtotal(line.subtotal());
            it.setIgv(line.igv());
            it.setTotal(line.total());
            q.addItem(it);
            subtotal = subtotal.add(line.subtotal());
            igv = igv.add(line.igv());
            total = total.add(line.total());
        }
        if (includesIgv) {
            // Igual que el Excel: el IGV se desglosa del total, no línea por línea.
            subtotal = total.divide(BigDecimal.ONE.add(Igv.RATE), 2, java.math.RoundingMode.HALF_UP);
            igv = total.subtract(subtotal);
        }
        q.setSubtotal(subtotal);
        q.setIgv(igv);
        q.setTotal(total);

        numberingLock.lock();
        try {
            q.setNumber(repository.maxNumber() + 1);
            return toResponse(repository.saveAndFlush(q));
        } finally {
            numberingLock.unlock();
        }
    }

    @Transactional
    public QuoteResponse updateStatus(Long id, QuoteStatus status) {
        Quote q = load(id);
        q.setStatus(status);
        return toResponse(q);
    }

    private Quote load(Long id) {
        return repository.findWithItemsById(id).orElseThrow(() -> new NotFoundException("Cotización no encontrada."));
    }

    private QuoteResponse toResponse(Quote q) {
        return new QuoteResponse(q.getId(), q.code(), q.getIssueDate(), q.getValidUntil(), q.getCustomerDoc(),
                q.getCustomerName(), q.getCustomerContact(), q.getCustomerPhone(), q.getCustomerEmail(),
                q.getCustomerAddress(), q.getBookingId(), q.isPricesIncludeIgv(), q.getSubtotal(), q.getIgv(), q.getTotal(),
                AmountInWords.soles(q.getTotal()), q.getStatus(), q.getNotes(), q.getCreatedAt(),
                q.getItems().stream().map(QuoteItemResponse::from).toList());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
