package com.phrolova.gacha.server.util;

import com.phrolova.gacha.common.util.GachaUpUtil;
import com.phrolova.gacha.pojo.vo.PityItemVO;
import com.phrolova.gacha.pojo.vo.PoolAnalyzeDataVO;
import com.phrolova.gacha.pojo.vo.RecordVO;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * 单卡池统计分析，对应 Node {@code utils/analyzePool.js}。
 */
public final class PoolAnalyzer {

    private PoolAnalyzer() {
    }

    public static PoolAnalyzeDataVO analyzePool(List<RecordVO> records) {
        int total = records.size();
        int fiveStarCount = 0;
        int pity = 0;
        List<PityItemVO> pityList = new ArrayList<>();
        int upCount = 0;

        int currentUpSeries = 0;
        int currentNotupSeries = 0;
        int maxUpSeries = 0;
        int maxNotupSeries = 0;
        boolean guaranteedUp = false;

        List<RecordVO> orderedRecords = sortRecordsForAnalyze(records);

        for (RecordVO record : orderedRecords) {
            pity++;

            if (getQualityLevel(record) == 5) {
                fiveStarCount++;
                Boolean isUp = getIsUp(record);

                if (Boolean.TRUE.equals(isUp)) {
                    upCount++;
                    if (guaranteedUp) {
                        guaranteedUp = false;
                    } else {
                        currentUpSeries++;
                        currentNotupSeries = 0;
                        maxUpSeries = Math.max(maxUpSeries, currentUpSeries);
                    }
                } else if (Boolean.FALSE.equals(isUp)) {
                    currentNotupSeries++;
                    currentUpSeries = 0;
                    maxNotupSeries = Math.max(maxNotupSeries, currentNotupSeries);
                    guaranteedUp = true;
                } else {
                    currentUpSeries = 0;
                    currentNotupSeries = 0;
                    guaranteedUp = false;
                }

                PityItemVO pityItem = new PityItemVO();
                pityItem.setCount(pity);
                pityItem.setName(record.getResourceName());
                pityItem.setIsUp(isUp);
                pityList.add(pityItem);

                pity = 0;
            }
        }

        double avgPity = pityList.isEmpty()
                ? 0
                : pityList.stream().mapToInt(PityItemVO::getCount).average().orElse(0);
        double avgUp = upCount == 0 ? 0 : (double) (total - pity) / upCount;

        PoolAnalyzeDataVO data = new PoolAnalyzeDataVO();
        data.setTotal(total);
        data.setFiveStar(fiveStarCount);
        data.setAvgPity(String.format("%.2f", avgPity));
        data.setAvgUp(String.format("%.2f", avgUp));
        data.setUpRate(formatUpRate(upCount, fiveStarCount));
        data.setPityList(pityList);
        data.setCurrentPity(pity);
        data.setUpSeries(maxUpSeries);
        data.setNotupSeries(maxNotupSeries);
        return data;
    }

    private static String formatUpRate(int upCount, int fiveStarCount) {
        if (fiveStarCount == 0) {
            return "0%";
        }
        double ratio = (double) upCount / fiveStarCount;
        double percent = Double.parseDouble(String.format("%.4f", ratio)) * 100;
        return percent + "%";
    }

    private static List<RecordVO> sortRecordsForAnalyze(List<RecordVO> records) {
        boolean hasDrawOrder = records.stream().anyMatch(r -> r.getDrawOrder() != null);
        if (hasDrawOrder) {
            return records.stream()
                    .sorted(Comparator.comparing(r -> r.getDrawOrder() == null ? 0L : r.getDrawOrder()))
                    .toList();
        }

        boolean hasTimeFields = records.stream()
                .anyMatch(r -> r.getTime() != null || r.getInSecondSeq() != null);
        if (hasTimeFields) {
            return records.stream()
                    .sorted(Comparator
                            .comparing((RecordVO r) -> r.getTime() == null ? "" : r.getTime().toString())
                            .thenComparing(r -> r.getInSecondSeq() == null ? 0 : r.getInSecondSeq()))
                    .toList();
        }

        List<RecordVO> reversed = new ArrayList<>(records);
        java.util.Collections.reverse(reversed);
        return reversed;
    }

    private static int getQualityLevel(RecordVO record) {
        return record.getQualityLevel() == null ? 0 : record.getQualityLevel();
    }

    private static Boolean getIsUp(RecordVO record) {
        if (record.getIsUp() != null) {
            return record.getIsUp() == 1;
        }
        Long resourceId = parseResourceId(record.getResourceId());
        return GachaUpUtil.isUpItem(record.getQualityLevel(), resourceId);
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
