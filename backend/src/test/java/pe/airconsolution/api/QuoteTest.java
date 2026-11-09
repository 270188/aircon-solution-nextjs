package pe.airconsolution.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class QuoteTest {

    @Autowired
    MockMvc mvc;

    @Test
    void createsQuoteAndDownloadsExcelWithLogo() throws Exception {
        String created = mvc.perform(post("/api/v1/admin/quotes").with(httpBasic("admin", "test-secret"))
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"customerName":"Restaurante El Sabor SAC","customerDoc":"20616633733",
                                 "customerContact":"Sr. Pérez","customerPhone":"985899731","customerEmail":"compras@sabor.pe",
                                 "customerAddress":"Av. Brasil 450, Jesús María","validDays":10,"pricesIncludeIgv":true,
                                 "items":[{"description":"Mantenimiento preventivo de split 18000 BTU","quantity":3,"unitPrice":150},
                                          {"description":"Recarga de gas R410A","quantity":1,"unitPrice":180.5}]}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(org.hamcrest.Matchers.startsWith("COT-")))
                .andExpect(jsonPath("$.total").value(630.50))
                .andExpect(jsonPath("$.status").value("PENDIENTE"))
                .andReturn().getResponse().getContentAsString();
        String id = created.replaceAll("(?s).*?\"id\":(\\d+).*", "$1");
        String code = created.replaceAll("(?s).*?\"code\":\"([A-Z0-9-]+)\".*", "$1");

        byte[] xlsx = mvc.perform(get("/api/v1/admin/quotes/" + id + "/excel").with(httpBasic("admin", "test-secret")))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("Cotizacion-" + code + ".xlsx")))
                .andReturn().getResponse().getContentAsByteArray();
        Files.write(Path.of("target", "cotizacion-prueba.xlsx"), xlsx);

        try (XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(xlsx))) {
            XSSFSheet sh = wb.getSheet("Cotización");
            assertThat(wb.getAllPictures()).hasSize(1);
            assertThat(sh.getRow(0).getCell(1).getStringCellValue()).isEqualTo("AIRCONSOLUTION SERVICES SAC");
            assertThat(sh.getRow(1).getCell(3).getStringCellValue()).isEqualTo(code);
            boolean hasSumFormula = false;
            for (var row : sh) {
                var c = row.getCell(4);
                if (c != null && c.getCellType() == org.apache.poi.ss.usermodel.CellType.FORMULA
                        && c.getCellFormula().startsWith("SUM(")) {
                    hasSumFormula = true;
                }
            }
            assertThat(hasSumFormula).isTrue();
        }

        mvc.perform(patch("/api/v1/admin/quotes/" + id + "/status").with(httpBasic("admin", "test-secret"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"ACEPTADA\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACEPTADA"));
    }

    @Test
    void addsIgvWhenPricesExcludeIt() throws Exception {
        String created = mvc.perform(post("/api/v1/admin/quotes").with(httpBasic("admin", "test-secret"))
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"customerName":"Clínica Norte","pricesIncludeIgv":false,
                                 "items":[{"description":"Instalación de split 24000 BTU","quantity":2,"unitPrice":500}]}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pricesIncludeIgv").value(false))
                .andExpect(jsonPath("$.subtotal").value(1000.00))
                .andExpect(jsonPath("$.igv").value(180.00))
                .andExpect(jsonPath("$.total").value(1180.00))
                .andReturn().getResponse().getContentAsString();
        String id = created.replaceAll("(?s).*?\"id\":(\\d+).*", "$1");
        byte[] xlsx = mvc.perform(get("/api/v1/admin/quotes/" + id + "/excel").with(httpBasic("admin", "test-secret")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
        Files.write(Path.of("target", "cotizacion-sin-igv.xlsx"), xlsx);
    }

    @Test
    void quotesRequireLogin() throws Exception {
        mvc.perform(get("/api/v1/admin/quotes")).andExpect(status().isUnauthorized());
    }
}
