package com.phrolova.gacha.server.util;

import com.phrolova.gacha.common.util.GachaUpUtil;
import com.phrolova.gacha.pojo.dto.OfficialGachaRecordItem;
import com.phrolova.gacha.pojo.dto.ProcessedGachaRecordItem;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 预处理官方 API 返回记录，对应 Node {@code utils/preProcessing.js}。
 */
public final class GachaRecordPreprocessor {

    private GachaRecordPreprocessor() {
    }

    public static List<ProcessedGachaRecordItem> addParams(List<OfficialGachaRecordItem> records) {
        return addIsUp(addInSecondSeq(records));
    }

    private static List<ProcessedGachaRecordItem> addIsUp(List<ProcessedGachaRecordItem> records) {
        for (ProcessedGachaRecordItem record : records) {
            record.setIsUp(GachaUpUtil.isUpItem(record.getQualityLevel(), record.getResourceId()));
        }
        return records;
    }

    private static List<ProcessedGachaRecordItem> addInSecondSeq(List<OfficialGachaRecordItem> records) {
        if (records == null || records.isEmpty()) {
            return List.of();
        }

        List<OfficialGachaRecordItem> chronological = new ArrayList<>(records);
        Collections.reverse(chronological);

        String lastTime = null;
        int seq = 0;
        List<ProcessedGachaRecordItem> enriched = new ArrayList<>(chronological.size());

        for (OfficialGachaRecordItem record : chronological) {
            String currentTime = record.getTime() == null ? "" : record.getTime();
            if (!currentTime.equals(lastTime)) {
                lastTime = currentTime;
                seq = 0;
            } else {
                seq++;
            }
            ProcessedGachaRecordItem item = ProcessedGachaRecordItem.from(record);
            item.setInSecondSeq(seq);
            enriched.add(item);
        }

        Collections.reverse(enriched);
        return enriched;
    }
}
