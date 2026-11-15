package pe.airconsolution.api.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Set;
import java.util.regex.Pattern;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Reglas para buscadores sobre la página web:
 *  - /admin lleva "X-Robots-Tag: noindex" para que el panel nunca aparezca en Google.
 *  - Las rutas que no existen responden 404 (con la página de React que muestra "no encontrada"),
 *    así Google no las indexa como páginas duplicadas de la portada.
 *  - Las páginas de soluciones (/refrigeracion-comercial, ...) se generan al compilar como
 *    static/<ruta>.html, con su propio título y descripción; aquí se entregan con código 200.
 */
@Component
public class SeoFilter extends OncePerRequestFilter {

    /** Rutas que existen en la aplicación React. */
    static final Set<String> PAGES = Set.of("/", "/seguimiento", "/privacidad", "/admin");

    /** Una ruta de un solo nivel con letras, números y guiones, como /refrigeracion-comercial. */
    private static final Pattern SLUG = Pattern.compile("/[a-z0-9]+(-[a-z0-9]+)*");

    private final ClassPathResource index = new ClassPathResource("static/index.html");

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        return !("GET".equals(method) || "HEAD".equals(method)) || path.startsWith("/api/") || path.startsWith("/actuator")
                || path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = normalize(request.getRequestURI());
        if (path.equals("/admin")) {
            response.setHeader("X-Robots-Tag", "noindex, nofollow");
        }
        boolean isFile = path.substring(path.lastIndexOf('/') + 1).contains(".");
        if (!isFile && SLUG.matcher(path).matches()) {
            ClassPathResource page = new ClassPathResource("static" + path + ".html");
            if (page.exists()) {
                response.setHeader("Cache-Control", "no-cache");
                send(page, response);
                return;
            }
        }
        if (!isFile && !PAGES.contains(path) && index.exists()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.setHeader("X-Robots-Tag", "noindex");
            send(index, response);
            return;
        }
        chain.doFilter(request, response);
    }

    private static void send(ClassPathResource html, HttpServletResponse response) throws IOException {
        response.setContentType(MediaType.TEXT_HTML_VALUE);
        response.setCharacterEncoding("UTF-8");
        try (InputStream in = html.getInputStream()) {
            in.transferTo(response.getOutputStream());
        }
    }

    private static String normalize(String path) {
        return path.length() > 1 && path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
    }
}
