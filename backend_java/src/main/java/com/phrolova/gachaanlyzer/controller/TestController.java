package gacha_backend.controller;

import org.springframework.web.bind.annotation.GetMapping;  // 处理HTTP GET请求
import org.springframework.web.bind.annotation.RestController;  // 标识这是一个RESTful风格的控制器
import org.springframework.web.bind.annotation.CrossOrigin;  // 允许跨域资源共享CORS

@RestController  //告诉Spring该类是控制器，其所有方法的返回值都应直接写入HTTP响应体（response body），而不是跳转到视图页面。当用户访问接口时，浏览器将直接显示返回的字符串或JSON。
@CrossOrigin  //允许跨域访问
public class TestController {

    @GetMapping("/hello")  //映射HTTP GET请求到/hello路径
    // 创建一个hello方法，返回值类型为String
    public String hello() {
        return "Hello Spring Boot!";
    }

}
