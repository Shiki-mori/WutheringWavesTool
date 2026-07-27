package com.phrolova.gacha.pojo.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 联表查询中间结果，供 Service 转换为 {@link com.phrolova.gacha.pojo.vo.RecordVO}。
 */
@Data
public class RecordDetailDTO implements Serializable {

    private Long id;

    private String uid;

    private String resourceId;

    private String resourceName;

    private Integer qualityLevel;

    private String poolType;

    private LocalDateTime drawTime;

    private Integer inSecondSeq;

    private Long drawOrder;
}
