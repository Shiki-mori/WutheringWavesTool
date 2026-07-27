package com.phrolova.gacha.pojo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProcessedGachaRecordItem extends OfficialGachaRecordItem {

    private Integer inSecondSeq;

    private Boolean isUp;

    public static ProcessedGachaRecordItem from(OfficialGachaRecordItem source) {
        ProcessedGachaRecordItem item = new ProcessedGachaRecordItem();
        item.setResourceId(source.getResourceId());
        item.setQualityLevel(source.getQualityLevel());
        item.setName(source.getName());
        item.setTime(source.getTime());
        item.setCount(source.getCount());
        item.setResourceType(source.getResourceType());
        return item;
    }
}
