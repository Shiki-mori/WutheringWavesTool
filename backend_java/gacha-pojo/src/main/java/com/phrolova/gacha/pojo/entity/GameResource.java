package com.phrolova.gacha.pojo.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class GameResource implements Serializable {

    private Long id;

    private String resourceId;

    private String resourceName;

    private String resourceType;

    private Integer qualityLevel;
}
