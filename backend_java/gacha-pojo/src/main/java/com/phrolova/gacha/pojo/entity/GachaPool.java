package com.phrolova.gacha.pojo.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class GachaPool implements Serializable {
    
    private Long id;

    private String poolCode;

    private String poolName;

    private String poolType;
}
