# swagger

在`pom.xml`中添加swagger的maven依赖：

```xml
<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-spring-boot-starter</artifactId>
    <version>${knife4j}</version>
</dependency>
```

版本：

```xml
<properties>
    <java.version>17</java.version>
    <knife4j>3.0.2</knife4j>
</properties>
```

新建一个swagger配置类：`gacha-server/config/SwaggerConfig.java`。编写接口文档生成，指定扫描包为controller，设置静态资源映射。

在nginx配置中添加swagger相关路径的代理。

可在<localhost:8081/doc.html>查看接口文档。

<!-- codex resume 019e5a07-f441-7b33-b51f-efb31c4e4fdb -->
