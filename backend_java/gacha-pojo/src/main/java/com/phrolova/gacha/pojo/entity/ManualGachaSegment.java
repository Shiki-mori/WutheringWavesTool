package com.phrolova.gacha.pojo.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class ManualGachaSegment implements Serializable {
  
    private Long id;

    private Long accountId;

    private String poolType;

    private Long poolId;

    private String resourceName;

    private Long resourceId;

    private Integer pityCount;

    private Integer manualDrawOrder;

    private Long logicalOrder;

    private Long batchId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
