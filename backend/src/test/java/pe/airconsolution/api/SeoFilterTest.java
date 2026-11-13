package pe.airconsolution.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import pe.airconsolution.api.config.SeoFilter;

class SeoFilterTest {

    private final SeoFilter filter = new SeoFilter();

    private MockHttpServletResponse get(String path) throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", path);
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req, res, new MockFilterChain());
        return res;
    }

    @Test
    void adminIsNeverIndexed() throws Exception {
        assertThat(get("/admin").getHeader("X-Robots-Tag")).isEqualTo("noindex, nofollow");
    }

    @Test
    void realPagesAndFilesPassThrough() throws Exception {
        assertThat(get("/").getStatus()).isEqualTo(200);
        assertThat(get("/seguimiento").getStatus()).isEqualTo(200);
        assertThat(get("/images/logo.jpg").getStatus()).isEqualTo(200);
        assertThat(get("/").getHeader("X-Robots-Tag")).isNull();
    }
}
