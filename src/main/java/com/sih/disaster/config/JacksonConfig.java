package com.sih.disaster.config;

import com.bedatadriven.jackson.datatype.jts.JtsModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers JtsModule on top of Spring Boot's autoconfigured ObjectMapper
 * (rather than replacing it) so JTS Geometry fields (Village.geometry,
 * HazardZone.geometry, RelocationSite.geometry) serialize/deserialize
 * directly as GeoJSON on request/response bodies - no manual conversion
 * needed in controllers or DTOs - while keeping Boot's other defaults
 * (JavaTimeModule, snake/camel case config, etc.) intact (SRS 9.4).
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jtsModuleCustomizer() {
        return builder -> builder.modulesToInstall(new JtsModule());
    }
}
