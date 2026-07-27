package com.phrolova.gacha.server.controller;

import com.phrolova.gacha.pojo.dto.GachaImportRequestDTO;
import com.phrolova.gacha.pojo.vo.GachaRecordGroupVO;
import com.phrolova.gacha.server.service.ApiImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Node 兼容端点，对应 {@code backend_node/index.js} POST /api/gacha/proxy。
 */
@RestController
@RequestMapping("/api/gacha")
@RequiredArgsConstructor
@Slf4j
public class GachaImportController {

    private final ApiImportService apiImportService;

    @PostMapping("/proxy")
    public ResponseEntity<?> proxy(@RequestBody GachaImportRequestDTO request) {
        try {
            List<GachaRecordGroupVO> results = apiImportService.fetchAndSave(request.getUrl());
            log.info("成功返回");
            return ResponseEntity.ok(results);
        } catch (Exception ex) {
            log.error("转发失败: {}", ex.getMessage(), ex);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("error", "Backend Proxy Error");
            body.put("details", ex.getMessage() == null ? ex.getClass().getSimpleName() : ex.getMessage());
            return ResponseEntity.internalServerError().body(body);
        }
    }
}
