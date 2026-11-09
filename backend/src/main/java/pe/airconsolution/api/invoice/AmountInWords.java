package pe.airconsolution.api.invoice;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Convierte importes a letras para el comprobante: "SON: CIENTO DIECIOCHO CON 00/100 SOLES". */
public final class AmountInWords {

    private static final String[] UNITS = {"", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO",
            "NUEVE", "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO",
            "DIECINUEVE", "VEINTE", "VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO",
            "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"};
    private static final String[] TENS = {"", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA",
            "OCHENTA", "NOVENTA"};
    private static final String[] HUNDREDS = {"", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS",
            "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"};

    private AmountInWords() {
    }

    public static String soles(BigDecimal amount) {
        BigDecimal value = amount.setScale(2, RoundingMode.HALF_UP);
        long integer = value.longValue();
        int cents = value.remainder(BigDecimal.ONE).movePointRight(2).abs().intValue();
        String words = integer == 0 ? "CERO" : words(integer);
        return "SON: " + words + " CON " + String.format("%02d", cents) + "/100 SOLES";
    }

    static String words(long n) {
        if (n >= 1_000_000) {
            long millions = n / 1_000_000;
            String head = millions == 1 ? "UN MILLÓN" : apocope(words(millions)) + " MILLONES";
            long rest = n % 1_000_000;
            return rest == 0 ? head : head + " " + words(rest);
        }
        if (n >= 1000) {
            long thousands = n / 1000;
            String head = thousands == 1 ? "MIL" : apocope(words(thousands)) + " MIL";
            long rest = n % 1000;
            return rest == 0 ? head : head + " " + words(rest);
        }
        if (n == 100) {
            return "CIEN";
        }
        if (n > 100) {
            long rest = n % 100;
            return HUNDREDS[(int) (n / 100)] + (rest == 0 ? "" : " " + words(rest));
        }
        if (n < 30) {
            return UNITS[(int) n];
        }
        long unit = n % 10;
        return TENS[(int) (n / 10)] + (unit == 0 ? "" : " Y " + UNITS[(int) unit]);
    }

    /** "VEINTIUNO MIL" -> "VEINTIÚN MIL", "UNO MIL" no ocurre por el caso especial. */
    private static String apocope(String s) {
        if (s.endsWith("VEINTIUNO")) return s.substring(0, s.length() - 9) + "VEINTIÚN";
        if (s.endsWith("UNO")) return s.substring(0, s.length() - 3) + "UN";
        return s;
    }
}
