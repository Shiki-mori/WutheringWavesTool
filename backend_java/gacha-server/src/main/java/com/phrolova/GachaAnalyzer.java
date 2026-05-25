package com.phrolova;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;


@SpringBootApplication
// 超级注解
// 启动内置Tomcat
// 扫描gacha_server下的所有类
// 创建并管理对象
@EnableTransactionManagement
// 开启注解方式的事务管理
// 允许使用 @Transactional 注解来控制数据库事务
@Slf4j
public class GachaAnalyzer {
    public static void main(String[] args) {
        SpringApplication.run(GachaAnalyzer.class, args);
        log.info("server started...");
    }
}