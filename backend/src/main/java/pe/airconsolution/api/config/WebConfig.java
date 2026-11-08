package pe.airconsolution.api.config;

import java.io.IOException;
import java.time.Duration;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Sirve la página web en Angular (copiada a classpath:/static al construir la imagen Docker).
 * Las rutas que no son archivos (/seguimiento, /admin, ...) devuelven index.html para que el
 * enrutador de Angular las resuelva. Las rutas /api/** nunca caen aquí.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final String STATIC = "classpath:/static/";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Archivos con hash en el nombre: se pueden guardar en caché por un año.
        registry.addResourceHandler("/*.js", "/*.css")
                .addResourceLocations(STATIC)
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());
        registry.addResourceHandler("/images/**")
                .addResourceLocations(STATIC + "images/")
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic());
        registry.addResourceHandler("/**")
                .addResourceLocations(STATIC)
                .setCacheControl(CacheControl.noCache())
                .resourceChain(true)
                .addResolver(new SpaFallbackResolver());
    }

    static final class SpaFallbackResolver extends PathResourceResolver {
        @Override
        protected Resource getResource(String path, Resource location) throws IOException {
            Resource requested = location.createRelative(path);
            if (requested.exists() && requested.isReadable()) {
                return requested;
            }
            if (path.startsWith("api/") || path.startsWith("actuator/") || path.contains(".")) {
                return null;
            }
            Resource index = new ClassPathResource("/static/index.html");
            return index.exists() ? index : null;
        }
    }
}
