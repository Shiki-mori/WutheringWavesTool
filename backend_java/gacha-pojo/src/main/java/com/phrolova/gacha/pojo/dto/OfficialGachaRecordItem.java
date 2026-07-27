package com.phrolova.gacha.pojo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.io.Serializable;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OfficialGachaRecordItem implements Serializable {

    private Long resourceId;

    private Integer qualityLevel;

    private String name;

    private String time;

    private Integer count;

    private String resourceType;
}
