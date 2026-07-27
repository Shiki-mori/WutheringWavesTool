package com.phrolova.gacha.pojo.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;

@Data
public class PityItemVO implements Serializable {

    private Integer count;

    private String name;

    private Boolean isUp;
}
