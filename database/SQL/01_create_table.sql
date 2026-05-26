USE gacha_db;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `user` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL COMMENT '用户名',
    `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户表';

-- 2. 游戏资源表
CREATE TABLE IF NOT EXISTS `game_resource` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `resource_id` VARCHAR(50) NOT NULL COMMENT '资源ID',
    `resource_name` VARCHAR(100) NOT NULL COMMENT '资源名称',
    `resource_type` VARCHAR(20) DEFAULT NULL COMMENT '资源类型',
    `quality_level` TINYINT DEFAULT NULL COMMENT '等级',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_resource_id` (`resource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏资源表';

-- 3. 卡池表
CREATE TABLE IF NOT EXISTS `gacha_pool` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `pool_code` VARCHAR(50) NOT NULL COMMENT '卡池代码',
    `pool_name` VARCHAR(100) NOT NULL COMMENT '卡池名称',
    `pool_type` VARCHAR(20) DEFAULT NULL COMMENT '卡池类型',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_pool_code` (`pool_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡池表';

-- 4. 游戏账号表（依赖 user）
CREATE TABLE IF NOT EXISTS `game_account` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL COMMENT '所属用户ID',
    `game_uid` VARCHAR(50) NOT NULL COMMENT '游戏内UID',
    `server_id` VARCHAR(20) NOT NULL COMMENT '服务器ID',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '游戏名称',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_server_game_uid` (`server_id`, `game_uid`),
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_game_account_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏账号表';

-- 5. API导入任务表（依赖 game_account）
CREATE TABLE IF NOT EXISTS `api_import_task` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `account_id` INT UNSIGNED NOT NULL COMMENT '游戏账号ID',
    `status` VARCHAR(20) DEFAULT 'pending' COMMENT '任务状态',
    `request_cursor` VARCHAR(100) DEFAULT NULL COMMENT '请求游标',
    `card_pool_id` VARCHAR(50) DEFAULT NULL COMMENT '卡池ID(关联业务)',
    `imported_count` INT UNSIGNED DEFAULT 0 COMMENT '导入记录条数',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_account_id` (`account_id`),
    CONSTRAINT `fk_api_task_account` FOREIGN KEY (`account_id`) REFERENCES `game_account` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API导入任务表';

-- 6. 手动导入批次表（依赖 game_account）
CREATE TABLE IF NOT EXISTS `manual_import_batch` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `account_id` INT UNSIGNED NOT NULL COMMENT '游戏账号ID',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '导入时间',
    PRIMARY KEY (`id`),
    KEY `idx_account_id` (`account_id`),
    CONSTRAINT `fk_manual_batch_account` FOREIGN KEY (`account_id`) REFERENCES `game_account` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='手动导入批次表';

-- 7. API抽卡记录表（只读，依赖 game_account, gacha_pool, game_resource, api_import_task）
CREATE TABLE IF NOT EXISTS `api_gacha_record` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `account_id` INT UNSIGNED NOT NULL COMMENT '游戏账号ID',
    `pool_id` INT UNSIGNED NOT NULL COMMENT '卡池ID',
    `pool_type` VARCHAR(20) DEFAULT NULL COMMENT '卡池类型（冗余）',
    `resource_id` INT UNSIGNED NOT NULL COMMENT '获得资源ID',
    `business_key` CHAR(64) NOT NULL COMMENT '业务唯一键(SHA256)',
    `import_task_id` INT UNSIGNED NOT NULL COMMENT '所属导入任务ID',
    `draw_time` DATETIME NOT NULL COMMENT '实际抽取时间',
    `in_second_seq` INT UNSIGNED NOT NULL COMMENT '秒内序号',
    `api_draw_order` INT UNSIGNED DEFAULT NULL COMMENT 'API返回顺序(经常查询)',
    `logical_order` BIGINT UNSIGNED DEFAULT NULL COMMENT '拼接逻辑顺序（稀疏序）',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_business_key` (`business_key`),
    KEY `idx_account_id` (`account_id`),
    KEY `idx_pool_id` (`pool_id`),
    KEY `idx_resource_id` (`resource_id`),
    KEY `idx_import_task_id` (`import_task_id`),
    KEY `idx_draw_time` (`draw_time`),
    CONSTRAINT `fk_api_record_account` FOREIGN KEY (`account_id`) REFERENCES `game_account` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_api_record_pool` FOREIGN KEY (`pool_id`) REFERENCES `gacha_pool` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_api_record_resource` FOREIGN KEY (`resource_id`) REFERENCES `game_resource` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_api_record_task` FOREIGN KEY (`import_task_id`) REFERENCES `api_import_task` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API抽卡记录表(只读)';

-- 8. 手动导入数据段表（允许编辑，依赖 game_account, gacha_pool, game_resource, manual_import_batch）
CREATE TABLE IF NOT EXISTS `manual_gacha_segment` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `account_id` INT UNSIGNED NOT NULL COMMENT '游戏账号ID',
    `pool_type` VARCHAR(20) DEFAULT NULL COMMENT '卡池类型',
    `pool_id` INT UNSIGNED DEFAULT NULL COMMENT '卡池ID',
    `resource_name` VARCHAR(100) NOT NULL COMMENT '五星名称',
    `resource_id` INT UNSIGNED DEFAULT NULL COMMENT '匹配的资源ID',
    `pity_count` INT UNSIGNED NOT NULL COMMENT '消耗抽数（保底计数）',
    `manual_draw_order` INT UNSIGNED NOT NULL COMMENT '手动记录的顺序',
    `logical_order` BIGINT UNSIGNED DEFAULT NULL COMMENT '拼接逻辑顺序',
    `batch_id` INT UNSIGNED NOT NULL COMMENT '所属导入批次ID',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_account_id` (`account_id`),
    KEY `idx_pool_id` (`pool_id`),
    KEY `idx_resource_id` (`resource_id`),
    KEY `idx_batch_id` (`batch_id`),
    KEY `idx_logical_order` (`logical_order`),
    CONSTRAINT `fk_manual_segment_account` FOREIGN KEY (`account_id`) REFERENCES `game_account` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_manual_segment_pool` FOREIGN KEY (`pool_id`) REFERENCES `gacha_pool` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_manual_segment_resource` FOREIGN KEY (`resource_id`) REFERENCES `game_resource` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_manual_segment_batch` FOREIGN KEY (`batch_id`) REFERENCES `manual_import_batch` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='手动导入数据段表（可编辑）';