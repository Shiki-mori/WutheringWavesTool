-- 默认系统用户，供 API 导入时使用（尚未接入登录系统）
INSERT IGNORE INTO `user` (`id`, `username`, `password_hash`)
VALUES (1, 'system', 'noop');
