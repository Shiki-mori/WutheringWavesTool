# swagger

<!-- codex resume 019e5a07-f441-7b33-b51f-efb31c4e4fdb -->

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

该版本与spring boot版本不兼容，访问页面时显示knife4j文档请求异常。

升级knife4j版本，做如下改动：

1. 父 pom 切换到 Jakarta 版 Knife4j 坐标与版本；
2. gacha-server 显式引入该依赖；
3. 把旧 SwaggerConfig 从 Springfox Docket 改成 OpenAPI3 配置类。