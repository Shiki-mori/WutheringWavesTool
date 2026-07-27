package com.phrolova.gacha.server.service;

import com.phrolova.gacha.pojo.vo.RecordVO;

import java.util.List;

public interface RecordService {

    Long countRecords();

    List<RecordVO> listRecords();

    RecordVO getRecordById(Long id);
}
