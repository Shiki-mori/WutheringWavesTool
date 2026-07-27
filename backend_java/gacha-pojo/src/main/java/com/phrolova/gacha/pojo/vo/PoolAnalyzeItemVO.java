package com.phrolova.gacha.pojo.vo;

import lombok.Data;

import java.io.Serializable;

@Data
public class PoolAnalyzeItemVO implements Serializable {

    private Integer poolType;

    private Integer totalRecords;

    private PoolAnalyzeDataVO data;
}
