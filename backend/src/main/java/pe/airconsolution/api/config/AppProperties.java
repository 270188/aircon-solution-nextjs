package pe.airconsolution.api.config;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuración del negocio. Todos los valores se pueden sobreescribir con
 * variables de entorno (ver application.yml).
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Cors cors,
        Admin admin,
        Booking booking,
        RateLimit rateLimit,
        Invoicing invoicing) {

    public record Cors(List<String> allowedOrigins) {
    }

    public record Admin(String username, String password) {
    }

    public record Booking(
            ZoneId zone,
            List<LocalTime> slots,
            int capacityPerSlot,
            int maxDaysAhead,
            Set<DayOfWeek> closedDays) {
    }

    public record RateLimit(int requestsPerMinute) {
    }

    /** Datos del emisor de comprobantes y del proveedor de facturación electrónica (Nubefact). */
    public record Invoicing(
            String ruc,
            String businessName,
            String address,
            String seriesFactura,
            String seriesBoleta,
            int firstNumberFactura,
            int firstNumberBoleta,
            String nubefactUrl,
            String nubefactToken) {

        public boolean electronicEnabled() {
            return nubefactUrl != null && !nubefactUrl.isBlank() && nubefactToken != null && !nubefactToken.isBlank();
        }
    }
}
