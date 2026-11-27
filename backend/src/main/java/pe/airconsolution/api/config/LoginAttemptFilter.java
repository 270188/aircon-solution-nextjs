package pe.airconsolution.api.config;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Frena a quien prueba contraseñas del panel: tras {@value #MAX_PER_IP} claves equivocadas desde la misma IP,
 * o {@value #MAX_TOTAL} entre todas (por si alguien cambia de IP), el panel responde 429 durante
 * {@value #WINDOW_MINUTES} minutos. Un ingreso correcto borra los intentos de esa IP.
 */
@Component
public class LoginAttemptFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(LoginAttemptFilter.class);

    static final int MAX_PER_IP = 10;
    static final int MAX_TOTAL = 50;
    static final int WINDOW_MINUTES = 15;
    private static final Duration WINDOW = Duration.ofMinutes(WINDOW_MINUTES);

    private final Map<String, Deque<Instant>> failuresByIp = new ConcurrentHashMap<>();
    private final Deque<Instant> allFailures = new ConcurrentLinkedDeque<>();
    private final Clock clock;

    public LoginAttemptFilter() {
        this(Clock.systemUTC());
    }

    LoginAttemptFilter(Clock clock) {
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/v1/admin/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        boolean credentials = header != null && !header.isBlank();
        String ip = request.getRemoteAddr();

        if (credentials && locked(ip)) {
            response.setStatus(429);
            response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(WINDOW_MINUTES * 60));
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"title\":\"Demasiados intentos\",\"status\":429,"
                    + "\"detail\":\"Demasiados intentos fallidos. Espera " + WINDOW_MINUTES + " minutos.\"}");
            return;
        }

        chain.doFilter(request, response);

        if (!credentials) {
            return;
        }
        if (response.getStatus() == HttpServletResponse.SC_UNAUTHORIZED) {
            recordFailure(ip);
        } else if (response.getStatus() < 400) {
            failuresByIp.remove(ip);
        }
    }

    boolean locked(String ip) {
        Instant since = clock.instant().minus(WINDOW);
        return count(failuresByIp.get(ip), since) >= MAX_PER_IP || count(allFailures, since) >= MAX_TOTAL;
    }

    void recordFailure(String ip) {
        Instant now = clock.instant();
        failuresByIp.computeIfAbsent(ip, k -> new ConcurrentLinkedDeque<>()).addLast(now);
        allFailures.addLast(now);
        if (locked(ip)) {
            log.warn("Panel bloqueado {} minutos por intentos fallidos (IP {}).", WINDOW_MINUTES, ip);
        }
    }

    private static int count(Deque<Instant> attempts, Instant since) {
        if (attempts == null) return 0;
        int n = 0;
        for (Instant t : attempts) {
            if (t.isAfter(since)) n++;
        }
        return n;
    }

    @Scheduled(fixedRate = 300_000)
    void evictOld() {
        Instant since = clock.instant().minus(WINDOW);
        allFailures.removeIf(t -> !t.isAfter(since));
        for (Iterator<Map.Entry<String, Deque<Instant>>> it = failuresByIp.entrySet().iterator(); it.hasNext();) {
            Deque<Instant> d = it.next().getValue();
            d.removeIf(t -> !t.isAfter(since));
            if (d.isEmpty()) it.remove();
        }
    }
}
