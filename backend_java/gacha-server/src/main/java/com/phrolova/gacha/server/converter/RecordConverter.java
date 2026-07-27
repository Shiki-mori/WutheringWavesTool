package com.phrolova.gacha.server.converter;

import com.phrolova.gacha.common.util.GachaUpUtil;
import com.phrolova.gacha.pojo.dto.RecordDetailDTO;
import com.phrolova.gacha.pojo.vo.RecordVO;

public final class RecordConverter {

    private RecordConverter() {
    }

    public static RecordVO toVO(RecordDetailDTO detail) {
        if (detail == null) {
            return null;
        }

        RecordVO vo = new RecordVO();
        vo.setId(detail.getId());
        vo.setUid(detail.getUid());
        vo.setResourceId(detail.getResourceId());
        vo.setResourceName(detail.getResourceName());
        vo.setQualityLevel(detail.getQualityLevel());
        vo.setPoolType(detail.getPoolType());
        vo.setTime(detail.getDrawTime());
        vo.setInSecondSeq(detail.getInSecondSeq());
        vo.setDrawOrder(detail.getDrawOrder());
        vo.setIsUp(toLegacyIsUp(detail.getQualityLevel(), detail.getResourceId()));
        return vo;
    }

    private static Integer toLegacyIsUp(Integer qualityLevel, String resourceId) {
        Long resourceIdLong = parseResourceId(resourceId);
        Boolean isUp = GachaUpUtil.isUpItem(qualityLevel, resourceIdLong);
        if (isUp == null) {
            return null;
        }
        return isUp ? 1 : 0;
    }

    private static Long parseResourceId(String resourceId) {
        if (resourceId == null || resourceId.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(resourceId);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
