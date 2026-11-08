package pe.airconsolution.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class OpenApiConfig {

    @Bean
    OpenAPI airconOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("AIRCONSOLUTION SERVICES SAC API")
                        .version("v1")
                        .description("Reservas de servicio técnico, mensajes de contacto, boletín y panel de administración.")
                        .contact(new Contact().name("AIRCONSOLUTION SERVICES SAC").email("aircon82@gmail.com")))
                .components(new Components().addSecuritySchemes("basicAuth",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("basic")));
    }
}
