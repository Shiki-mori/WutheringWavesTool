package com.phrolova.handler;

import com.phrolova.exception.BaseException;
import com.phrolova.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// 全局异常处理
// 处理项目中抛出的业务异常

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /** 
     * 捕获业务异常
     * @param ex 业务异常对象
     * @return 统一响应结果
     */
    @ExceptionHandler
    public Result exceptionHandler(BaseException ex) {
        log.error("异常信息: {}", ex.getMessage());
        return Result.error(ex.getMessage());
    }
}
