package com.phrolova.gacha.server.controller;

import com.phrolova.gacha.common.result.Result;
import com.phrolova.gacha.pojo.vo.RecordVO;
import com.phrolova.gacha.server.service.RecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class RecordController {

    private final RecordService recordService;

    @GetMapping("/count")
    public Result<Long> countRecords() {
        return Result.success(recordService.countRecords());
    }

    @GetMapping
    public Result<List<RecordVO>> listRecords() {
        return Result.success(recordService.listRecords());
    }

    @GetMapping("/{id}")
    public Result<RecordVO> getRecordById(@PathVariable Long id) {
        return Result.success(recordService.getRecordById(id));
    }
}
