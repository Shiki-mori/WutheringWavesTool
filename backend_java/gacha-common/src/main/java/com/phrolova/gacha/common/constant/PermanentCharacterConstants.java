package com.phrolova.gacha.common.constant;

import java.util.Set;

/**
 * 常驻五星角色 resourceId，对应 Node {@code config/permanentConfig.js}。
 */
public final class PermanentCharacterConstants {

    private PermanentCharacterConstants() {
    }

    /** 安可、卡卡罗、凌阳、维里奈、鉴心 */
    public static final Set<Long> PERMANENT_CHARACTERS = Set.of(
            1203L,
            1301L,
            1104L,
            1503L,
            1405L
    );
}
