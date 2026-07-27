package com.phrolova.gacha.server.controller;

import com.phrolova.gacha.common.result.LegacyResult;
import com.phrolova.gacha.pojo.vo.RecordVO;
import com.phrolova.gacha.server.service.RecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Node 兼容端点，对应 {@code backend_node/api/readRecords.js}。
 */
@RestController
@RequestMapping("/api/readRecords")
@RequiredArgsConstructor
@Slf4j
public class ReadRecordsController {

    private final RecordService recordService;

    @GetMapping({"", "/"})
    public LegacyResult<List<RecordVO>> readRecords() {
        try {
            return LegacyResult.success(recordService.listRecords());
        } catch (Exception ex) {
            log.error("读取记录失败", ex);
            return LegacyResult.error();
        }
    }

    @GetMapping("/records")
    public LegacyResult<List<RecordVO>> readRecordsAlias() {
        return readRecords();
    }
}
