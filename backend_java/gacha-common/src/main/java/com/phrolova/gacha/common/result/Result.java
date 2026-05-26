package com.phrolova.gacha.common.result;

import lombok.Data;

// 可序列化
import java.io.Serializable;

// 后端统一返回结果

@Data
public class Result<T> implements Serializable {

    private Integer code;  // 状态码
    private String msg;    // 提示信息
    private T data;        // 数据

    public static <T> Result<T> success() {
        Result<T> result = new Result<T>();
        result.code = 200;
        result.msg = "success";
        return result;
    }

    public static <T> Result<T> success(T object) {
        Result<T> result = new Result<T>();
        result.code = 200;
        result.data = object;
        result.msg = "success";
        return result;
    }

    public static <T> Result<T> error(){
        Result<T> result = new Result<T>();
        result.code = 500;
        result.msg = "error";
        return result;
    }

    public static <T> Result<T> error(String msg) {
        Result result = new Result();
        result.code = 500;
        result.msg = msg;
        return result;
    }
}
