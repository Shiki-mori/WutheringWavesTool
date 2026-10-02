-- 单独执行结构迁移；ALTER TABLE 不属于后续的补录数据事务。
ALTER TABLE analyzer_records
    ADD COLUMN data_source ENUM('official', 'manual', 'placeholder')
        NOT NULL DEFAULT 'official' COMMENT '官方记录、手动五星或未知抽卡占位',
    ADD COLUMN import_batch_id VARCHAR(64) NULL COMMENT '历史补录批次',
    ADD UNIQUE KEY uniq_manual_record (uid, pool_type, import_batch_id, draw_order);
