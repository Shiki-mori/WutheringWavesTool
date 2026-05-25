package com.phrolova.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
// // @EnableOpenApi
// public class SwaggerConfig extends WebMvcConfigurationSupport {
//     /**
//      * 通过knife4j生成接口文档
//      * @return Docket对象，用于Swagger文档生成
//      */
//     @Bean// 将docket方法的返回值(Docket对象，用于swagger文档生成)注册为 Spring 容器中的 Bean 实例
//     public Docket docket() {
//         // log.info("Generating Interface Documentation...");
//         ApiInfo apiInfo = new ApiInfoBuilder()
//                 .title("Gachaanalyzer Interface Documentation")
//                 .version("1.0")
//                 .description("抽卡分析接口文档")
//                 .build();
//         Docket docket = new Docket(DocumentationType.SWAGGER_2)
//                 .apiInfo(apiInfo)
//                 .select()
//                 // 指定要扫描的包
//                 .apis(RequestHandlerSelectors.basePackage("com.phrolova.gachaanlyzer.controller"))
//                 .paths(PathSelectors.any())
//                 .build();
//         return docket;
//     }

//     /**
//      * 设置静态资源映射
//      * @param registry
//      */
//     @Override
//     protected void addResourceHandlers(ResourceHandlerRegistry registry) {
//         // log.info("设置静态资源映射...");
//         registry.addResourceHandler("/doc.html").addResourceLocations("classpath:/META-INF/resources/");
//         registry.addResourceHandler("/webjars/**").addResourceLocations("classpath:/META-INF/resources/webjars/");
//     }
// }
public class SwaggerConfig {
    @Bean
    public OpenAPI gachaOpenApi() {

    System.out.println("生成接口文档...");
        return new OpenAPI()
                .info(new Info()
                        .title("Gachaanalyzer Interface Documentation")
                        .version("1.0")
                        .description("抽卡分析接口文档"));
    }
}
