package com.phrolova.gacha.pojo.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class PoolAnalyzeDataVO implements Serializable {

    private Integer total;

    private Integer fiveStar;

    private String avgPity;

    private String avgUp;

    private String upRate;

    private List<PityItemVO> pityList;

    @JsonProperty("已垫")
    private Integer currentPity;

    private Integer upSeries;

    private Integer notupSeries;
}
