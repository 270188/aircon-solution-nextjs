package pe.airconsolution.api;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;

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
class ApiIntegrationTest {

    @Autowired
    MockMvc mvc;

    /** Próximo día hábil (no domingo) a partir de mañana. */
    static LocalDate nextOpenDay(int offset) {
        LocalDate d = LocalDate.now(ZoneId.of("America/Lima")).plusDays(offset);
        while (d.getDayOfWeek() == DayOfWeek.SUNDAY) {
            d = d.plusDays(1);
        }
        return d;
    }

    static String booking(LocalDate date, String time) {
        return """
                {"name":"Juan Pérez","phone":"+51 985 899 731","address":"Av. Universitaria 123",
                 "service":"MANTENIMIENTO","description":"El equipo gotea","date":"%s","time":"%s",
                 "privacyAccepted":true}""".formatted(date, time);
    }

    @Test
    void createsBookingAndTracksIt() throws Exception {
        LocalDate date = nextOpenDay(3);
        String body = mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content(booking(date, "09:00")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(startsWith("ACS-")))
                .andExpect(jsonPath("$.status").value("PENDIENTE"))
                .andReturn().getResponse().getContentAsString();
        String code = body.replaceAll(".*\"code\":\"([A-Z0-9-]+)\".*", "$1");

        mvc.perform(get("/api/v1/bookings/" + code.toLowerCase()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("Mantenimiento Preventivo"))
                .andExpect(jsonPath("$.time").value("09:00"));
    }

    @Test
    void fullSlotIsRejectedAndShownAsUnavailable() throws Exception {
        LocalDate date = nextOpenDay(5);
        for (int i = 0; i < 2; i++) {
            mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON)
                    .content(booking(date, "15:00"))).andExpect(status().isCreated());
        }
        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON)
                .content(booking(date, "15:00"))).andExpect(status().isConflict());

        mvc.perform(get("/api/v1/bookings/availability").param("date", date.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.open").value(true))
                .andExpect(jsonPath("$.slots[?(@.time=='15:00')].available").value(hasItem(false)));
    }

    @Test
    void sundaysAndPastDatesAreClosed() throws Exception {
        LocalDate sunday = LocalDate.now().plusWeeks(1).with(DayOfWeek.SUNDAY);
        mvc.perform(get("/api/v1/bookings/availability").param("date", sunday.toString()))
                .andExpect(jsonPath("$.open").value(false));
        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON)
                .content(booking(LocalDate.now().minusDays(2), "09:00"))).andExpect(status().isConflict());
    }

    @Test
    void invalidBookingReturnsFieldErrors() throws Exception {
        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"J\",\"phone\":\"abc\",\"privacyAccepted\":false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.phone").value("Ingresa un teléfono válido."))
                .andExpect(jsonPath("$.errors.privacyAccepted").exists());
    }

    @Test
    void contactAndNewsletterAreAccepted() throws Exception {
        mvc.perform(post("/api/v1/contact").contentType(MediaType.APPLICATION_JSON).content("""
                {"name":"Rosa","phone":"985899731","email":"rosa@example.com",
                 "message":"Necesito una cotización","privacyAccepted":true}"""))
                .andExpect(status().isCreated());
        for (int i = 0; i < 2; i++) {
            mvc.perform(post("/api/v1/newsletter").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"Cliente@Example.com\"}")).andExpect(status().isOk());
        }
    }

    @Test
    void adminRequiresCredentials() throws Exception {
        mvc.perform(get("/api/v1/admin/bookings")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/admin/bookings").with(httpBasic("admin", "incorrecta")))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/admin/stats").with(httpBasic("admin", "test-secret")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingsByStatus.PENDIENTE").exists());
    }

    @Test
    void adminCanChangeBookingStatus() throws Exception {
        LocalDate date = nextOpenDay(7);
        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON)
                .content(booking(date, "17:00"))).andExpect(status().isCreated());
        String list = mvc.perform(get("/api/v1/admin/bookings").with(httpBasic("admin", "test-secret")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String id = list.replaceAll("(?s).*?\"id\":(\\d+).*", "$1");
        mvc.perform(patch("/api/v1/admin/bookings/" + id + "/status").with(httpBasic("admin", "test-secret"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMADA\",\"adminNotes\":\"Técnico: Luis\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMADA"));
    }

    @Test
    void healthEndpointIsPublic() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
