package pe.airconsolution.api.invoice;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Cálculo de IGV (18 %) para precios que ya lo incluyen. Lo usan facturas y cotizaciones. */
public final class Igv {

    public static final BigDecimal RATE = new BigDecimal("0.18");
    private static final BigDecimal FACTOR = BigDecimal.ONE.add(RATE);

    public record Line(BigDecimal quantity, BigDecimal unitPrice, BigDecimal unitValue, BigDecimal subtotal,
            BigDecimal igv, BigDecimal total) {
    }

    private Igv() {
    }

    public static Line split(BigDecimal quantity, BigDecimal unitPriceWithIgv) {
        BigDecimal qty = quantity.setScale(2, RoundingMode.HALF_UP);
        BigDecimal price = unitPriceWithIgv.setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = price.multiply(qty).setScale(2, RoundingMode.HALF_UP);
        BigDecimal subtotal = total.divide(FACTOR, 2, RoundingMode.HALF_UP);
        return new Line(qty, price, price.divide(FACTOR, 6, RoundingMode.HALF_UP), subtotal, total.subtract(subtotal),
                total);
    }

    /** Para precios SIN IGV: el 18 % se suma encima. */
    public static Line addTo(BigDecimal quantity, BigDecimal netUnitPrice) {
        BigDecimal qty = quantity.setScale(2, RoundingMode.HALF_UP);
        BigDecimal price = netUnitPrice.setScale(2, RoundingMode.HALF_UP);
        BigDecimal subtotal = price.multiply(qty).setScale(2, RoundingMode.HALF_UP);
        BigDecimal igv = subtotal.multiply(RATE).setScale(2, RoundingMode.HALF_UP);
        return new Line(qty, price, price, subtotal, igv, subtotal.add(igv));
    }
}
