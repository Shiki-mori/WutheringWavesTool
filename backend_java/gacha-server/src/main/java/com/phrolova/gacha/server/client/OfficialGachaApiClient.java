package com.phrolova.gacha.server.client;

import com.phrolova.gacha.pojo.dto.GachaQueryParams;
import com.phrolova.gacha.pojo.dto.OfficialGachaQueryResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * 转发官方抽卡 API，对应 Node {@code utils/fetchRecords.js}。
 */
@Component
@Slf4j
public class OfficialGachaApiClient {

    private static final String QUERY_URL = "https://gmserver-api.aki-game2.com/gacha/record/query";

    private final RestClient restClient = RestClient.create();

    public OfficialGachaQueryResponse query(GachaQueryParams params) {
        OfficialGachaQueryResponse response = restClient.post()
                .uri(QUERY_URL)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json, text/plain, */*")
                .header("Origin", "https://aki-gm-resources.aki-game.com")
                .header("Referer", "https://aki-gm-resources.aki-game.com/")
                .header("User-Agent",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                + "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .body(params)
                .retrieve()
                .body(OfficialGachaQueryResponse.class);

        if (response == null) {
            throw new IllegalStateException("官方接口返回空响应，卡池: " + params.getCardPoolType());
        }

        log.info("官方接口响应成功：{} 卡池编号：{}", response.getMessage(), params.getCardPoolType());
        return response;
    }
}
