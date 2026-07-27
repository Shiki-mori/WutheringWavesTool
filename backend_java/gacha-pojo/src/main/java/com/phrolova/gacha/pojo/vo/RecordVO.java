package com.phrolova.gacha.pojo.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 抽卡记录查询结果，字段命名与 Node/前端 {@code RecordItem} 对齐。
 */
@Data
public class RecordVO implements Serializable {

    private Long id;

    private String uid;

    @JsonProperty("resource_id")
    private String resourceId;

    @JsonProperty("resource_name")
    private String resourceName;

    @JsonProperty("quality_level")
    private Integer qualityLevel;

    @JsonProperty("pool_type")
    private String poolType;

    private LocalDateTime time;

    @JsonProperty("in_second_seq")
    private Integer inSecondSeq;

    @JsonProperty("draw_order")
    private Long drawOrder;

    @JsonProperty("is_up")
    private Integer isUp;
}
