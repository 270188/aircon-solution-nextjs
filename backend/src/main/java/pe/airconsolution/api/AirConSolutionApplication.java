package pe.airconsolution.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class AirConSolutionApplication {

    public static void main(String[] args) {
        SpringApplication.run(AirConSolutionApplication.class, args);
    }
}
