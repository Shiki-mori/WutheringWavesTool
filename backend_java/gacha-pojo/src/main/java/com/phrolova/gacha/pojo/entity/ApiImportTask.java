package com.phrolova.gacha.pojo.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class ApiImportTask implements Serializable {

    private Long id;

    private Long accountId;

    private String status;

    private String requestCursor;

    private String cardPoolId;

    private Integer importedCount;

    private LocalDateTime createdAt;
}
