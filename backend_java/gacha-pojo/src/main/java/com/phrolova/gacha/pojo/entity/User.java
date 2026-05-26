package com.phrolova.gacha.pojo.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class User implements Serializable {

    private Long id;

    private String username;

    private String passwordHash;

    private LocalDateTime createdAt;
}
