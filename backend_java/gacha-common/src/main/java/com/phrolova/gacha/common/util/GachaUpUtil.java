package com.phrolova.gacha.common.util;

import com.phrolova.gacha.common.constant.PermanentCharacterConstants;

/**
 * 判断五星是否为 UP，对应 Node {@code utils/isUpItem.js}。
 */
public final class GachaUpUtil {

    private GachaUpUtil() {
    }

    /**
     * @return {@code null} 非五星；{@code false} 常驻五星；{@code true} UP 五星
     */
    public static Boolean isUpItem(Integer qualityLevel, Long resourceId) {
        if (qualityLevel == null || qualityLevel != 5) {
            return null;
        }
        if (resourceId != null && PermanentCharacterConstants.PERMANENT_CHARACTERS.contains(resourceId)) {
            return false;
        }
        return true;
    }
}
