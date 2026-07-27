package com.phrolova.gacha.server.service;

import com.phrolova.gacha.pojo.vo.GachaRecordGroupVO;

import java.util.List;

public interface ApiImportService {

    List<GachaRecordGroupVO> fetchAndSave(String url);
}
