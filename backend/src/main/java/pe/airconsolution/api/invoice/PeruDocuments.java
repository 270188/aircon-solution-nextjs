package pe.airconsolution.api.invoice;

/** Validaciones de documentos de identidad peruanos. */
public final class PeruDocuments {

    private static final int[] RUC_WEIGHTS = {5, 4, 3, 2, 7, 6, 5, 4, 3, 2};

    private PeruDocuments() {
    }

    /** RUC de 11 dígitos, prefijo 10/15/17/20 y dígito verificador correcto (módulo 11). */
    public static boolean isValidRuc(String ruc) {
        if (ruc == null || !ruc.matches("(10|15|17|20)\\d{9}")) {
            return false;
        }
        int sum = 0;
        for (int i = 0; i < 10; i++) {
            sum += (ruc.charAt(i) - '0') * RUC_WEIGHTS[i];
        }
        int check = 11 - sum % 11;
        if (check == 10) check = 0;
        if (check == 11) check = 1;
        return check == ruc.charAt(10) - '0';
    }

    public static boolean isValidDni(String dni) {
        return dni != null && dni.matches("\\d{8}");
    }
}
