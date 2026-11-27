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

    /**
     * Datos del emisor y del canal de facturación electrónica.
     * provider: SUNAT (envío directo, SEE-Del contribuyente), NUBEFACT o vacío (se elige solo según lo configurado).
     */
    public record Invoicing(
            String ruc,
            String businessName,
            String address,
            String seriesFactura,
            String seriesBoleta,
            int firstNumberFactura,
            int firstNumberBoleta,
            String provider,
            String nubefactUrl,
            String nubefactToken,
            Sunat sunat) {

        public boolean nubefactConfigured() {
            return notBlank(nubefactUrl) && notBlank(nubefactToken);
        }
    }

    /**
     * Envío directo a SUNAT. Las credenciales se cargan solo desde variables de entorno.
     *
     * @param mode            BETA (pruebas, no tiene validez tributaria) o PRODUCCION
     * @param solUser         usuario SOL secundario (sin el RUC delante)
     * @param solPassword     clave de ese usuario SOL
     * @param certBase64      certificado digital .pfx/.p12 codificado en Base64
     * @param certPath        alternativa: ruta al archivo .pfx/.p12
     * @param certPassword    contraseña del certificado
     * @param ubigeo          ubigeo del domicilio fiscal (Los Olivos = 150117)
     * @param establishment   código de establecimiento anexo (0000 = domicilio fiscal)
     */
    public record Sunat(
            String mode,
            String solUser,
            String solPassword,
            String certBase64,
            String certPath,
            String certPassword,
            String ubigeo,
            String establishment) {

        public boolean production() {
            return "PRODUCCION".equalsIgnoreCase(mode);
        }

        public boolean configured() {
            boolean credentials = production() ? notBlank(solUser) && notBlank(solPassword) : true;
            return credentials && (notBlank(certBase64) || notBlank(certPath));
        }
    }

    static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
