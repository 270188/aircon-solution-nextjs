package pe.airconsolution.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import pe.airconsolution.api.invoice.AmountInWords;
import pe.airconsolution.api.invoice.PeruDocuments;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InvoiceTest {

    @Autowired
    MockMvc mvc;

    @Test
    void validatesRuc() {
        assertThat(PeruDocuments.isValidRuc("20616633733")).isTrue();
        assertThat(PeruDocuments.isValidRuc("20616633734")).isFalse();
        assertThat(PeruDocuments.isValidRuc("2061663373")).isFalse();
    }

    @Test
    void writesAmountsInSpanish() {
        assertThat(AmountInWords.soles(new BigDecimal("118.00"))).isEqualTo("SON: CIENTO DIECIOCHO CON 00/100 SOLES");
        assertThat(AmountInWords.soles(new BigDecimal("1521.50"))).isEqualTo("SON: MIL QUINIENTOS VEINTIUNO CON 50/100 SOLES");
        assertThat(AmountInWords.soles(new BigDecimal("21000"))).isEqualTo("SON: VEINTIÚN MIL CON 00/100 SOLES");
        assertThat(AmountInWords.soles(new BigDecimal("100"))).isEqualTo("SON: CIEN CON 00/100 SOLES");
    }

    @Test
    void issuesFacturaWithIgvAndConsecutiveNumbers() throws Exception {
        String body = """
                {"type":"FACTURA","customerDocType":"6","customerDocNumber":"20616633733",
                 "customerName":"CLIENTE DE PRUEBA SAC","customerAddress":"Av. Perú 123, Lima","pricesIncludeIgv":true,
                 "items":[{"description":"Mantenimiento preventivo split 12000 BTU","quantity":2,"unitPrice":118}]}""";
        mvc.perform(post("/api/v1/admin/invoices").with(httpBasic("admin", "test-secret"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.series").value("F001"))
                .andExpect(jsonPath("$.subtotal").value(200.00))
                .andExpect(jsonPath("$.igv").value(36.00))
                .andExpect(jsonPath("$.total").value(236.00))
                .andExpect(jsonPath("$.status").value("BORRADOR"))
                .andExpect(jsonPath("$.issuer.ruc").value("20616633733"))
                .andExpect(jsonPath("$.totalInWords").value("SON: DOSCIENTOS TREINTA Y SEIS CON 00/100 SOLES"));
        String second = mvc.perform(post("/api/v1/admin/invoices").with(httpBasic("admin", "test-secret"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        assertThat(second).contains("\"fullNumber\":\"F001-0000000");
        mvc.perform(get("/api/v1/admin/invoices").with(httpBasic("admin", "test-secret")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].fullNumber", is(org.hamcrest.Matchers.startsWith("F001-"))));
    }

    @Test
    void addsIgvToPricesWithoutIgvByDefault() throws Exception {
        mvc.perform(post("/api/v1/admin/invoices").with(httpBasic("admin", "test-secret"))
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"type":"FACTURA","customerDocType":"6","customerDocNumber":"20616633733",
                                 "customerName":"CLIENTE SIN IGV SAC","customerAddress":"Lima",
                                 "items":[{"description":"Instalación","quantity":2,"unitPrice":100},
                                          {"description":"Materiales","quantity":1,"unitPrice":55.50}]}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.subtotal").value(255.50))
                .andExpect(jsonPath("$.igv").value(45.99))
                .andExpect(jsonPath("$.total").value(301.49))
                .andExpect(jsonPath("$.items[0].unitValue").value(100.0))
                .andExpect(jsonPath("$.items[0].unitPrice").value(118.00))
                .andExpect(jsonPath("$.items[0].subtotal").value(200.00));
    }

    @Test
    void rejectsFacturaWithoutValidRuc() throws Exception {
        mvc.perform(post("/api/v1/admin/invoices").with(httpBasic("admin", "test-secret"))
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"type":"FACTURA","customerDocType":"1","customerDocNumber":"12345678",
                                 "customerName":"Juan","customerAddress":"Lima",
                                 "items":[{"description":"Servicio","quantity":1,"unitPrice":50}]}"""))
                .andExpect(status().isConflict());
    }

    @Test
    void boletaOver700RequiresDni() throws Exception {
        mvc.perform(post("/api/v1/admin/invoices").with(httpBasic("admin", "test-secret"))
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"type":"BOLETA","customerDocType":"-","customerName":"Cliente varios",
                                 "items":[{"description":"Instalación","quantity":1,"unitPrice":800}]}"""))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/v1/admin/invoices").with(httpBasic("admin", "test-secret"))
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"type":"BOLETA","customerDocType":"1","customerDocNumber":"45678912","customerName":"Rosa",
                                 "items":[{"description":"Instalación","quantity":1,"unitPrice":800}]}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.series").value("B001"));
    }

    @Test
    void invoicesRequireLogin() throws Exception {
        mvc.perform(get("/api/v1/admin/invoices")).andExpect(status().isUnauthorized());
    }
}
