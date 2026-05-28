// mybatis实体类，连接旧表Analyzer

package com.phrolova.gacha.pojo.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class AnalyzerRecordEntity implements Serializable {

    private Long id;

    private String uid;

    private String resourceId;

    private String resourceName;

    private Boolean isUp;

    private Integer qualityLevel;

    private Integer poolType;

    private LocalDateTime time;

    private Integer inSecondSeq;

    private LocalDateTime createdAt;

    private Long drawOrder;
}
