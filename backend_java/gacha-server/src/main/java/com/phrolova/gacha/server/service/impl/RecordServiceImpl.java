package com.phrolova.gacha.server.service.impl;

import com.phrolova.gacha.common.exception.BaseException;
import com.phrolova.gacha.pojo.dto.RecordDetailDTO;
import com.phrolova.gacha.pojo.vo.RecordVO;
import com.phrolova.gacha.server.converter.RecordConverter;
import com.phrolova.gacha.server.mapper.ApiGachaRecordMapper;
import com.phrolova.gacha.server.service.RecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RecordServiceImpl implements RecordService {

    private final ApiGachaRecordMapper apiGachaRecordMapper;

    @Override
    public Long countRecords() {
        return apiGachaRecordMapper.countAll();
    }

    @Override
    public List<RecordVO> listRecords() {
        return apiGachaRecordMapper.selectAllDetails().stream()
                .map(RecordConverter::toVO)
                .toList();
    }

    @Override
    public RecordVO getRecordById(Long id) {
        RecordDetailDTO detail = apiGachaRecordMapper.selectDetailById(id);
        if (detail == null) {
            throw new BaseException("记录不存在: " + id);
        }
        return RecordConverter.toVO(detail);
    }
}
