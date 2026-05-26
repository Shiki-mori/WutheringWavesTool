package com.phrolova.gacha.server.service.impl;

import com.phrolova.gacha.server.mapper.AnalyzerRecordMapper;
import com.phrolova.gacha.server.service.RecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RecordServiceImpl implements RecordService {

    private final AnalyzerRecordMapper analyzerRecordMapper;

    @Override
    public Long countRecords() {
        return analyzerRecordMapper.countAll();
    }
}
