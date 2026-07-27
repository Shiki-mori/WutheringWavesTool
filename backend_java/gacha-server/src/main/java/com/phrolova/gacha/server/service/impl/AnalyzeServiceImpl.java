package com.phrolova.gacha.server.service.impl;

import com.phrolova.gacha.pojo.vo.PoolAnalyzeDataVO;
import com.phrolova.gacha.pojo.vo.PoolAnalyzeItemVO;
import com.phrolova.gacha.pojo.vo.RecordVO;
import com.phrolova.gacha.server.service.AnalyzeService;
import com.phrolova.gacha.server.service.RecordService;
import com.phrolova.gacha.server.util.PoolAnalyzer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyzeServiceImpl implements AnalyzeService {

    private final RecordService recordService;

    @Override
    public List<PoolAnalyzeItemVO> analyzeAllPools() {
        List<RecordVO> records = recordService.listRecords();
        Map<Integer, List<RecordVO>> grouped = new LinkedHashMap<>();

        for (RecordVO record : records) {
            if (record.getPoolType() == null || record.getPoolType().isBlank()) {
                continue;
            }
            try {
                int poolType = Integer.parseInt(record.getPoolType());
                grouped.computeIfAbsent(poolType, key -> new ArrayList<>()).add(record);
            } catch (NumberFormatException ignored) {
                // skip invalid pool type
            }
        }

        return grouped.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    PoolAnalyzeItemVO item = new PoolAnalyzeItemVO();
                    item.setPoolType(entry.getKey());
                    item.setTotalRecords(entry.getValue().size());
                    PoolAnalyzeDataVO data = PoolAnalyzer.analyzePool(entry.getValue());
                    item.setData(data);
                    return item;
                })
                .toList();
    }
}
