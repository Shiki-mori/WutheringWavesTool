需要将后端重构为Java。采用双后端并行迁移策略，逐步替换原有的Node服务。  
目标：最终形成Vue+Spring Boot的标准前后端分离架构

# 创建Spring Boot项目

>Spring Boot：一个用来快速搭建Java Web后端的框架。内嵌服务器，自动配置，提供 Web API 能力（类似Express）。

将 Node 后端替换为 Spring Boot 后端。

本次使用网页生成方法。  
访问<https://start.spring.io/>，选择：

Project: Maven  
Language: Java  
Spring Boot: 4.0.5  
Project Metadata：  

- Group：com.gacha
- Artifact: gacha-backend
- Package name: gacha-backend

Packaging: Jar  
Java: 17  
Dependencies:

- Spring Web
- Lombok

点击Generate，下载后保存并解压。将解压后的文件夹放在frontend，原有的backend同级目录下。

现有目录结构：/frontend, /backend_node, /backend_java。

## 安装JDK17

搜索：

```bash
zypper search jdk
```

```text
| java-17-openjdk                         | OpenJDK 17 Runtime Environment              | 软件包
| java-17-openjdk-demo                    | OpenJDK 17 Demos                            | 软件包
| java-17-openjdk-devel                   | OpenJDK 17 Development Environment          | 软件包
| java-17-openjdk-headless                | OpenJDK 17 Runtime Environment              | 软件包
| java-17-openjdk-javadoc                 | OpenJDK 17 API Documentation                | 软件包
| java-17-openjdk-jmods                   | JMods for OpenJDK 17                        | 软件包
| java-17-openjdk-src   
```

安装：

```bash
sudo zypper install java-17-openjdk-devel
```

## 使用SDKMAN进行java环境切换

由于一部分课程实验（如Hadoop）需要使用JDK8完成，安装SDKMAN来管理Java环境：

```bash
curl -s "https://get.sdkman.io" | bash
```

>需要先安装zip解压工具：  
    ```bash
    sudo zypper install zip unzip
    ```

为SDKMAN配置环境：

```bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
```

验证SDKMAN安装成功：

```bash
sdk version
```

使用sdkman安装java环境：

```bash
sdk install java 17.0.10-tem
sdk install java 8.0.402-tem
```

使用sdkman切换Java：

```bash
sdk use java 17.0.10-tem
sdk use java 8.0.402-tem
```

验证：

```bash
java -version
```

## 启动Spring Boot

在/backend_java 下执行spring boot启动命令：

```bash
./mvnw spring-boot:run
```

终端显示：

```text
Tomcat started on port 8080
```