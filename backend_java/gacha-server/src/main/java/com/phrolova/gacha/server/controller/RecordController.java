package com.phrolova.gacha.server.controller;

import com.phrolova.gacha.common.result.Result;
import com.phrolova.gacha.server.service.RecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class RecordController {

    private final RecordService recordService;

    @GetMapping("/count")
    public Result<Long> countRecords() {
        return Result.success(recordService.countRecords());
    }
}
