package pe.airconsolution.api.invoice.sunat;

import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.Base64;
import java.util.Collections;

/** Certificado digital (.pfx / .p12) con el que se firman los comprobantes. */
public record SunatCertificate(PrivateKey privateKey, X509Certificate certificate) {

    /** Carga el certificado desde Base64 o, si no hay, desde una ruta de archivo. */
    public static SunatCertificate load(String base64, String path, String password) {
        try {
            byte[] bytes;
            if (base64 != null && !base64.isBlank()) {
                bytes = Base64.getMimeDecoder().decode(base64.trim());
            } else if (path != null && !path.isBlank()) {
                bytes = Files.readAllBytes(Path.of(path));
            } else {
                throw new IllegalStateException("Falta el certificado digital (SUNAT_CERT_BASE64 o SUNAT_CERT_PATH).");
            }
            return fromPkcs12(bytes, password == null ? "" : password);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo leer el certificado digital: revisa el archivo y su contraseña.", e);
        }
    }

    public static SunatCertificate fromPkcs12(byte[] bytes, String password) throws Exception {
        KeyStore ks = KeyStore.getInstance("PKCS12");
        ks.load(new ByteArrayInputStream(bytes), password.toCharArray());
        for (String alias : Collections.list(ks.aliases())) {
            if (ks.isKeyEntry(alias)) {
                PrivateKey key = (PrivateKey) ks.getKey(alias, password.toCharArray());
                X509Certificate cert = (X509Certificate) ks.getCertificate(alias);
                if (key != null && cert != null) {
                    return new SunatCertificate(key, cert);
                }
            }
        }
        throw new IllegalStateException("El certificado no contiene una clave privada.");
    }
}
