package com.phrolova.gacha.pojo.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class ApiGachaRecord implements Serializable {

    private Long id;

    private Long accountId;

    private Long poolId;

    private String poolType;

    private Long resourceId;

    private String businessKey;

    private Long importTaskId;

    private LocalDateTime drawTime;

    private Integer inSecondSeq;

    private Integer apiDrawOrder;

    private Long logicalOrder;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
