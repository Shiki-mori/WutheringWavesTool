package gacha_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
// 超级注解
// 启动内置Tomcat
// 扫描gacha_backend下的所有类
// 创建并管理对象
public class GachaBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(GachaBackendApplication.class, args);
	}

}
