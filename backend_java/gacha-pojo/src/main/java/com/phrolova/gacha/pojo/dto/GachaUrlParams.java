package com.phrolova.gacha.pojo.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 从抽卡链接解析出的基础参数，对应 Node {@code parseGachaUrl} 返回值。
 */
@Data
public class GachaUrlParams implements Serializable {

    private String serverId;

    private String playerId;

    private String recordId;

    private String cardPoolId;

    private String languageCode;
}
