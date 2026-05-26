package com.phrolova.gacha.server.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.phrolova.gacha.server.mapper")
public class MyBatisConfig {
}
