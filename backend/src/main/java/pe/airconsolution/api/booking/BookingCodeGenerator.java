package pe.airconsolution.api.booking;

import java.security.SecureRandom;

import org.springframework.stereotype.Component;

/** Genera códigos legibles tipo ACS-7KQ2MX, sin caracteres ambiguos (0/O, 1/I). */
@Component
public class BookingCodeGenerator {

    private static final char[] ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private final SecureRandom random = new SecureRandom();

    public String next() {
        StringBuilder sb = new StringBuilder("ACS-");
        for (int i = 0; i < 6; i++) {
            sb.append(ALPHABET[random.nextInt(ALPHABET.length)]);
        }
        return sb.toString();
    }
}
