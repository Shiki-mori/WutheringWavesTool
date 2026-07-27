package com.phrolova.gacha.server.controller;

import com.phrolova.gacha.common.result.LegacyResult;
import com.phrolova.gacha.pojo.vo.PoolAnalyzeItemVO;
import com.phrolova.gacha.server.service.AnalyzeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Node 兼容端点，对应 {@code backend_node/api/analyzeRecords.js}。
 */
@RestController
@RequestMapping("/api/analyzeRecords")
@RequiredArgsConstructor
@Slf4j
public class AnalyzeRecordsController {

    private final AnalyzeService analyzeService;

    @GetMapping({"", "/"})
    public LegacyResult<List<PoolAnalyzeItemVO>> analyzeRecords() {
        try {
            return LegacyResult.success(analyzeService.analyzeAllPools());
        } catch (Exception ex) {
            log.error("分析数据库记录失败", ex);
            return LegacyResult.error();
        }
    }

    @GetMapping("/records")
    public LegacyResult<List<PoolAnalyzeItemVO>> analyzeRecordsAlias() {
        return analyzeRecords();
    }
}
