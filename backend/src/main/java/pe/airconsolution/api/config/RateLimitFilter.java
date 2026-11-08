package pe.airconsolution.api.config;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Limita los envíos públicos (reservas, contacto, boletín) por IP con una
 * ventana fija de un minuto. Protege contra spam y abuso de formularios.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final int limit;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimitFilter(AppProperties props) {
        this.limit = props.rateLimit().requestsPerMinute();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !"POST".equals(request.getMethod())
                || !(path.startsWith("/api/v1/bookings") || path.startsWith("/api/v1/contact")
                        || path.startsWith("/api/v1/newsletter"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long minute = System.currentTimeMillis() / 60_000;
        Window window = windows.compute(clientIp(request),
                (ip, w) -> w == null || w.minute != minute ? new Window(minute) : w);
        if (window.count.incrementAndGet() > limit) {
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("""
                    {"title":"Demasiadas solicitudes","status":429,\
                    "detail":"Has enviado muchas solicitudes seguidas. Intenta de nuevo en un minuto."}""");
            return;
        }
        chain.doFilter(request, response);
    }

    @Scheduled(fixedRate = 300_000)
    void evictOldWindows() {
        long minute = System.currentTimeMillis() / 60_000;
        windows.values().removeIf(w -> w.minute < minute);
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static final class Window {
        final long minute;
        final AtomicInteger count = new AtomicInteger();

        Window(long minute) {
            this.minute = minute;
        }
    }
}
