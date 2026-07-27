package com.phrolova.gacha.server.service;

import com.phrolova.gacha.pojo.vo.PoolAnalyzeItemVO;

import java.util.List;

public interface AnalyzeService {

    List<PoolAnalyzeItemVO> analyzeAllPools();
}
