package com.phrolova.gacha.pojo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OfficialGachaQueryResponse implements Serializable {

    private Integer code;

    private String message;

    private List<OfficialGachaRecordItem> data;
}
