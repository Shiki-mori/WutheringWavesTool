package com.phrolova.gacha.pojo.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class GameAccount implements Serializable {

    private Long id;

    private Long userId;

    private String gameUid;

    private String serverId;

    private String nickname;

    private LocalDateTime createdAt;
}
