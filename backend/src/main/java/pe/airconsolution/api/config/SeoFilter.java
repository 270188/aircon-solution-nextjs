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
 *  - Cada página (/refrigeracion-comercial, /privacidad, ...) se genera al compilar como
 *    static/<ruta>.html, con su propio título y descripción; aquí se entrega con código 200.
 *  - Una sola dirección por página: /ruta/, /ruta.html e /index.html redirigen (301) a la limpia.
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
        String uri = request.getRequestURI();
        String canonical = canonicalPath(uri);
        if (!canonical.equals(uri)) {
            // Una sola dirección por página: /pagina/, /pagina.html e /index.html llevan a la dirección limpia.
            String query = request.getQueryString();
            response.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
            response.setHeader("Location", query == null ? canonical : canonical + "?" + query);
            return;
        }
        String path = normalize(uri);
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

    /** La dirección limpia de una página, o la misma si ya lo es (o si es un archivo). */
    static String canonicalPath(String uri) {
        if (uri.equals("/index.html")) {
            return "/";
        }
        if (uri.length() > 1 && uri.endsWith("/")) {
            return uri.replaceAll("/+$", "").isEmpty() ? "/" : uri.replaceAll("/+$", "");
        }
        if (uri.endsWith(".html") && SLUG.matcher(uri.substring(0, uri.length() - 5)).matches()) {
            return uri.substring(0, uri.length() - 5);
        }
        return uri;
    }

    private static String normalize(String path) {
        return path.length() > 1 && path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
    }
}
