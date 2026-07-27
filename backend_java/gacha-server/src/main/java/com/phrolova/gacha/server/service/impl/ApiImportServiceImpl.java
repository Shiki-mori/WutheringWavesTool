package com.phrolova.gacha.server.service.impl;

import com.phrolova.gacha.common.constant.SystemConstants;
import com.phrolova.gacha.common.exception.BaseException;
import com.phrolova.gacha.common.util.BusinessKeyUtil;
import com.phrolova.gacha.pojo.dto.GachaQueryParams;
import com.phrolova.gacha.pojo.dto.GachaUrlParams;
import com.phrolova.gacha.pojo.dto.OfficialGachaQueryResponse;
import com.phrolova.gacha.pojo.dto.ProcessedGachaRecordItem;
import com.phrolova.gacha.pojo.entity.ApiGachaRecord;
import com.phrolova.gacha.pojo.entity.ApiImportTask;
import com.phrolova.gacha.pojo.entity.GameAccount;
import com.phrolova.gacha.pojo.entity.GameResource;
import com.phrolova.gacha.pojo.entity.GachaPool;
import com.phrolova.gacha.pojo.entity.User;
import com.phrolova.gacha.pojo.vo.GachaRecordGroupVO;
import com.phrolova.gacha.server.client.OfficialGachaApiClient;
import com.phrolova.gacha.server.mapper.ApiGachaRecordMapper;
import com.phrolova.gacha.server.mapper.ApiImportTaskMapper;
import com.phrolova.gacha.server.mapper.GameAccountMapper;
import com.phrolova.gacha.server.mapper.GameResourceMapper;
import com.phrolova.gacha.server.mapper.GachaPoolMapper;
import com.phrolova.gacha.server.mapper.UserMapper;
import com.phrolova.gacha.server.service.ApiImportService;
import com.phrolova.gacha.server.util.GachaRecordPreprocessor;
import com.phrolova.gacha.server.util.GachaUrlParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApiImportServiceImpl implements ApiImportService {

    private static final DateTimeFormatter DRAW_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final OfficialGachaApiClient officialGachaApiClient;
    private final UserMapper userMapper;
    private final GameAccountMapper gameAccountMapper;
    private final GameResourceMapper gameResourceMapper;
    private final GachaPoolMapper gachaPoolMapper;
    private final ApiImportTaskMapper apiImportTaskMapper;
    private final ApiGachaRecordMapper apiGachaRecordMapper;

    @Override
    public List<GachaRecordGroupVO> fetchAndSave(String url) {
        GachaUrlParams urlParams = GachaUrlParser.parseGachaUrl(url);
        if (urlParams == null) {
            throw new BaseException("抽卡链接解析失败");
        }

        List<GachaQueryParams> queryParams = GachaUrlParser.buildQueryParams(url);
        if (queryParams.isEmpty()) {
            throw new BaseException("无法从链接构造查询参数");
        }

        ensureDefaultUser();
        GameAccount account = ensureGameAccount(urlParams);
        ApiImportTask importTask = createImportTask(account.getId(), urlParams.getCardPoolId());

        List<GachaRecordGroupVO> results = new ArrayList<>();
        int totalInserted = 0;

        for (GachaQueryParams payload : queryParams) {
            OfficialGachaQueryResponse response = officialGachaApiClient.query(payload);
            List<ProcessedGachaRecordItem> processedRecords = GachaRecordPreprocessor.addParams(
                    response.getData() == null ? List.of() : response.getData()
            );

            int inserted;
            try {
                inserted = saveRecords(
                        account,
                        String.valueOf(payload.getCardPoolType()),
                        importTask.getId(),
                        processedRecords
                );
            } catch (Exception ex) {
                log.error("保存记录时发生错误，卡池 {}: {}", payload.getCardPoolType(), ex.getMessage(), ex);
                inserted = 0;
            }
            totalInserted += inserted;

            GachaRecordGroupVO group = new GachaRecordGroupVO();
            group.setRecords(processedRecords);
            group.setPlayerId(payload.getPlayerId());
            group.setCardPoolType(payload.getCardPoolType());
            results.add(group);
        }

        apiImportTaskMapper.updateImportedCount(importTask.getId(), totalInserted);
        log.info("数据获取和保存完成，新增 {} 条", totalInserted);
        return results;
    }

    private void ensureDefaultUser() {
        User existing = userMapper.selectById(SystemConstants.DEFAULT_USER_ID);
        if (existing != null) {
            return;
        }
        User user = new User();
        user.setId(SystemConstants.DEFAULT_USER_ID);
        user.setUsername(SystemConstants.DEFAULT_USERNAME);
        user.setPasswordHash("noop");
        userMapper.insertIgnore(user);
    }

    private GameAccount ensureGameAccount(GachaUrlParams urlParams) {
        GameAccount existing = gameAccountMapper.selectByServerAndGameUid(
                urlParams.getServerId(), urlParams.getPlayerId());
        if (existing != null) {
            return existing;
        }

        GameAccount account = new GameAccount();
        account.setUserId(SystemConstants.DEFAULT_USER_ID);
        account.setGameUid(urlParams.getPlayerId());
        account.setServerId(urlParams.getServerId());
        gameAccountMapper.insert(account);
        return account;
    }

    private ApiImportTask createImportTask(Long accountId, String cardPoolId) {
        ApiImportTask task = new ApiImportTask();
        task.setAccountId(accountId);
        task.setStatus(SystemConstants.IMPORT_TASK_STATUS_COMPLETED);
        task.setCardPoolId(cardPoolId);
        task.setImportedCount(0);
        apiImportTaskMapper.insert(task);
        return task;
    }

    private int saveRecords(GameAccount account, String poolType, Long importTaskId,
                            List<ProcessedGachaRecordItem> records) {
        if (records.isEmpty()) {
            return 0;
        }

        GachaPool pool = ensureGachaPool(poolType);
        List<ProcessedGachaRecordItem> chronological = new ArrayList<>(records);
        Collections.reverse(chronological);

        Set<String> existingKeys = loadExistingKeys(account.getId(), poolType);
        int nextDrawOrder = apiGachaRecordMapper.selectMaxApiDrawOrder(account.getId(), poolType) + 1;
        int inserted = 0;

        for (ProcessedGachaRecordItem record : chronological) {
            String recordKey = buildRecordKey(record);
            if (existingKeys.contains(recordKey)) {
                continue;
            }

            GameResource resource = ensureGameResource(record);
            String businessKey = BusinessKeyUtil.build(
                    account.getGameUid(),
                    pool.getId(),
                    resource.getId(),
                    record.getTime(),
                    record.getInSecondSeq()
            );

            ApiGachaRecord entity = new ApiGachaRecord();
            entity.setAccountId(account.getId());
            entity.setPoolId(pool.getId());
            entity.setPoolType(poolType);
            entity.setResourceId(resource.getId());
            entity.setBusinessKey(businessKey);
            entity.setImportTaskId(importTaskId);
            entity.setDrawTime(parseDrawTime(record.getTime()));
            entity.setInSecondSeq(record.getInSecondSeq());
            entity.setApiDrawOrder(nextDrawOrder);
            entity.setLogicalOrder((long) nextDrawOrder);

            int affected = apiGachaRecordMapper.insertIgnore(entity);
            if (affected > 0) {
                existingKeys.add(recordKey);
                nextDrawOrder++;
                inserted++;
            }
        }

        return inserted;
    }

    private Set<String> loadExistingKeys(Long accountId, String poolType) {
        Set<String> keys = new HashSet<>();
        apiGachaRecordMapper.selectByAccountIdAndPoolType(accountId, poolType).forEach(record -> {
            keys.add(record.getDrawTime() + "__" + record.getInSecondSeq());
        });
        return keys;
    }

    private String buildRecordKey(ProcessedGachaRecordItem record) {
        return (record.getTime() == null ? "" : record.getTime())
                + "__"
                + (record.getInSecondSeq() == null ? "" : record.getInSecondSeq());
    }

    private GachaPool ensureGachaPool(String poolType) {
        GachaPool existing = gachaPoolMapper.selectByPoolType(poolType);
        if (existing != null) {
            return existing;
        }

        GachaPool pool = new GachaPool();
        pool.setPoolCode(poolType);
        pool.setPoolName("卡池 " + poolType);
        pool.setPoolType(poolType);
        gachaPoolMapper.insert(pool);
        return pool;
    }

    private GameResource ensureGameResource(ProcessedGachaRecordItem record) {
        String resourceId = record.getResourceId() == null ? null : String.valueOf(record.getResourceId());
        if (resourceId == null) {
            throw new BaseException("记录缺少 resourceId");
        }

        GameResource existing = gameResourceMapper.selectByResourceId(resourceId);
        if (existing != null) {
            return existing;
        }

        GameResource resource = new GameResource();
        resource.setResourceId(resourceId);
        resource.setResourceName(record.getName() == null ? "未知" : record.getName());
        resource.setResourceType(record.getResourceType());
        resource.setQualityLevel(record.getQualityLevel());
        gameResourceMapper.insert(resource);
        return resource;
    }

    private LocalDateTime parseDrawTime(String time) {
        if (time == null || time.isBlank()) {
            throw new BaseException("记录缺少 draw time");
        }
        return LocalDateTime.parse(time, DRAW_TIME_FORMAT);
    }
}
