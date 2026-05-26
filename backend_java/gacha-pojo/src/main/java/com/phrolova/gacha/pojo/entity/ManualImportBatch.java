package com.phrolova.gacha.pojo.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class ManualImportBatch implements Serializable {

    private Long id;

    private Long accountId;

    private LocalDateTime createdAt;
}
