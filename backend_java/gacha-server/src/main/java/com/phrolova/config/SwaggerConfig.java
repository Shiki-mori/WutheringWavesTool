package com.phrolova.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurationSupport;
// import springfox.documentation.oas.annotations.EnableOpenApi;
import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;

@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI gachaOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Gachaanalyzer Interface Documentation")
                        .version("1.0")
                        .description("抽卡分析接口文档"));
    }
}
