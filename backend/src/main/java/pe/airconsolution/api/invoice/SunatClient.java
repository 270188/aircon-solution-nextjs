package pe.airconsolution.api.invoice;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.locks.ReentrantLock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import pe.airconsolution.api.config.AppProperties;
import pe.airconsolution.api.invoice.sunat.SunatCertificate;
import pe.airconsolution.api.invoice.sunat.SunatSoapClient;
import pe.airconsolution.api.invoice.sunat.SunatSoapClient.Cdr;
import pe.airconsolution.api.invoice.sunat.SunatSoapClient.SunatFault;
import pe.airconsolution.api.invoice.sunat.SunatSoapClient.SunatUnavailable;
import pe.airconsolution.api.invoice.sunat.SunatSummary;
import pe.airconsolution.api.invoice.sunat.SunatSummaryRepository;
import pe.airconsolution.api.invoice.sunat.UblBuilder;
import pe.airconsolution.api.invoice.sunat.UblBuilder.Emitter;
import pe.airconsolution.api.invoice.sunat.XmlSigner;

/**
 * Envío directo a SUNAT (SEE - Del contribuyente): arma el XML UBL 2.1, lo firma con el certificado
 * digital de la empresa y lo envía al servicio billService. Las facturas y boletas se envían una por una
 * (sendBill); las anulaciones van por comunicación de baja (facturas) o resumen diario (boletas).
 */
@Component
public class SunatClient implements ElectronicInvoicing {

    private static final Logger log = LoggerFactory.getLogger(SunatClient.class);
    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private static final int STATUS_POLLS = 3;

    private final AppProperties.Invoicing invoicing;
    private final AppProperties.Sunat config;
    private final SunatSummaryRepository summaries;
    private final ReentrantLock summaryLock = new ReentrantLock();
    private volatile SunatCertificate certificate;
    private SunatSoapClient soapOverride;

    public SunatClient(AppProperties props, SunatSummaryRepository summaries) {
        this.invoicing = props.invoicing();
        this.config = invoicing.sunat();
        this.summaries = summaries;
    }

    /** Para pruebas: permite usar un cliente SOAP simulado. */
    void useSoapClient(SunatSoapClient client) {
        this.soapOverride = client;
    }

    @Override
    public String label() {
        return config != null && config.production() ? "SUNAT" : "SUNAT (pruebas beta)";
    }

    @Override
    public boolean enabled() {
        return config != null && config.configured();
    }

    // ---------------------------------------------------------------- emisión

    @Override
    public Result send(Invoice inv) {
        String xml = null;
        String hash = null;
        try {
            LocalTime time = inv.getCreatedAt() == null ? LocalTime.now(LIMA) : inv.getCreatedAt().atZone(LIMA).toLocalTime();
            XmlSigner.Signed signed = XmlSigner.sign(UblBuilder.invoice(emitter(), inv, time), certificate());
            xml = signed.xml();
            hash = signed.digestValue();
            Cdr cdr = soap().sendBill(UblBuilder.fileName(emitter(), inv), xml);
            log.info("{} enviado a SUNAT: código {}", inv.fullNumber(), cdr.code());
            String description = describe(cdr);
            return new Result(cdr.accepted(), false, description, null, cdr.accepted() ? hash : null, xml, cdr.zipBase64(), null);
        } catch (SunatFault f) {
            log.warn("SUNAT respondió {} para {}: {}", f.code(), inv.fullNumber(), f.getMessage());
            String msg = faultMessage(f);
            return new Result(f.rejection() ? false : null, false, msg, null, null, xml, null, null);
        } catch (SunatUnavailable e) {
            log.warn("SUNAT no disponible para {}", inv.fullNumber(), e);
            return new Result(null, false, e.getMessage(), null, null, xml, null, null);
        } catch (IllegalStateException e) {
            log.warn("Configuración de SUNAT incompleta", e);
            return Result.unreachable("Configuración SUNAT: " + e.getMessage());
        }
    }

    // ---------------------------------------------------------------- anulación

    @Override
    public Result voidInvoice(Invoice inv, String reason) {
        LocalDate today = LocalDate.now(LIMA);
        boolean factura = inv.getType() == InvoiceType.FACTURA;
        String kind = factura ? "RA" : "RC";
        summaryLock.lock();
        try {
            int correlative = summaries.maxCorrelative(kind, today) + 1;
            String id = kind + "-" + today.format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + correlative;
            String unsigned = factura
                    ? UblBuilder.voided(emitter(), id, today, inv, reason)
                    : UblBuilder.voidBoletaSummary(emitter(), id, today, inv);
            XmlSigner.Signed signed = XmlSigner.sign(unsigned, certificate());
            String ticket = soap().sendSummary(invoicing.ruc() + "-" + id, signed.xml());
            summaries.save(new SunatSummary(kind, today, correlative, inv.getId(), ticket));
            log.info("Anulación {} de {} enviada a SUNAT, ticket {}", id, inv.fullNumber(), ticket);
            return poll(ticket, STATUS_POLLS);
        } catch (SunatFault f) {
            return Result.rejected(faultMessage(f));
        } catch (SunatUnavailable e) {
            return Result.unreachable(e.getMessage());
        } catch (IllegalStateException e) {
            return Result.unreachable("Configuración SUNAT: " + e.getMessage());
        } finally {
            summaryLock.unlock();
        }
    }

    @Override
    public Result checkVoid(Invoice inv) {
        if (inv.getSunatTicket() == null) {
            return Result.rejected("No hay un ticket de anulación para consultar.");
        }
        try {
            return poll(inv.getSunatTicket(), 1);
        } catch (SunatFault f) {
            return Result.rejected(faultMessage(f));
        } catch (SunatUnavailable e) {
            return pending(inv.getSunatTicket(), e.getMessage());
        }
    }

    private Result poll(String ticket, int attempts) {
        for (int i = 0; i < attempts; i++) {
            if (i > 0) {
                try {
                    Thread.sleep(2_000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
            SunatSoapClient.Status status;
            try {
                status = soap().getStatus(ticket);
            } catch (SunatUnavailable e) {
                continue;
            }
            if (status.statusCode() == 98) {
                continue;
            }
            Cdr cdr = status.cdr();
            boolean ok = status.statusCode() == 0 && (cdr == null || cdr.accepted());
            String description = cdr == null ? (ok ? "Anulación aceptada por SUNAT." : "SUNAT rechazó la anulación.")
                    : describe(cdr);
            return new Result(ok, false, description, null, null, null, cdr == null ? null : cdr.zipBase64(), ticket);
        }
        return pending(ticket, "SUNAT está procesando la anulación (ticket " + ticket + "). Consulta el estado en unos minutos.");
    }

    private static Result pending(String ticket, String description) {
        return new Result(null, true, description, null, null, null, null, ticket);
    }

    // ---------------------------------------------------------------- soporte

    private static String describe(Cdr cdr) {
        StringBuilder b = new StringBuilder(cdr.description());
        if (!cdr.accepted()) {
            b.insert(0, "Rechazado por SUNAT (código " + cdr.code() + "): ");
        }
        if (!cdr.notes().isEmpty()) {
            b.append(" Observaciones: ").append(String.join("; ", cdr.notes()));
        }
        return b.toString();
    }

    private static String faultMessage(SunatFault f) {
        String hint = switch (f.code()) {
            case 102, 103, 104 -> " Revisa el usuario y la clave SOL secundarios.";
            case 109, 111 -> " El usuario SOL secundario no tiene permiso para emitir comprobantes electrónicos.";
            case 1033 -> " SUNAT ya tiene registrado este número: revísalo en SOL antes de volver a enviar.";
            case 2335 -> " El certificado digital no está registrado en SUNAT o venció.";
            default -> "";
        };
        String prefix = f.rejection() ? "Rechazado por SUNAT" : "SUNAT no recibió el comprobante";
        return prefix + " (código " + f.code() + "): " + f.getMessage() + hint;
    }

    private Emitter emitter() {
        return new Emitter(invoicing.ruc(), invoicing.businessName(), invoicing.address(), config.ubigeo(),
                config.establishment() == null || config.establishment().isBlank() ? "0000" : config.establishment());
    }

    private SunatCertificate certificate() {
        SunatCertificate c = certificate;
        if (c == null) {
            c = SunatCertificate.load(config.certBase64(), config.certPath(), config.certPassword());
            certificate = c;
        }
        return c;
    }

    SunatSoapClient soap() {
        if (soapOverride != null) {
            return soapOverride;
        }
        if (config.production()) {
            return new SunatSoapClient(SunatSoapClient.PRODUCTION_URL, invoicing.ruc() + config.solUser(), config.solPassword());
        }
        // Ambiente beta: SUNAT usa credenciales genéricas de prueba.
        return new SunatSoapClient(SunatSoapClient.BETA_URL, invoicing.ruc() + "MODDATOS", "moddatos");
    }
}
