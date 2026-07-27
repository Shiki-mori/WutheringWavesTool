package com.phrolova.gacha.pojo.vo;

import com.phrolova.gacha.pojo.dto.ProcessedGachaRecordItem;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class GachaRecordGroupVO implements Serializable {

    private List<ProcessedGachaRecordItem> records;

    private String playerId;

    private Integer cardPoolType;
}
