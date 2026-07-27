package com.phrolova.gacha.common.result;

import lombok.Data;

import java.io.Serializable;

/**
 * Node 后端兼容响应体（code=0 表示成功），用于迁移期双后端并行。
 */
@Data
public class LegacyResult<T> implements Serializable {

    private Integer code;
    private String message;
    private T data;

    public static <T> LegacyResult<T> success(T data) {
        LegacyResult<T> result = new LegacyResult<>();
        result.code = 0;
        result.message = "success";
        result.data = data;
        return result;
    }

    public static <T> LegacyResult<T> error() {
        LegacyResult<T> result = new LegacyResult<>();
        result.code = 500;
        result.message = "error";
        return result;
    }
}
