package com.phrolova.gacha.server.util;

import com.phrolova.gacha.pojo.dto.GachaQueryParams;
import com.phrolova.gacha.pojo.dto.GachaUrlParams;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

/**
 * 解析抽卡链接并构造官方 API 查询参数，对应 Node {@code utils/parseUrl.js} 与 {@code utils/fetchQueryParams.js}。
 */
public final class GachaUrlParser {

    private static final int[] POOL_TYPES = {1, 2, 3, 4, 5, 6, 8, 9};

    private GachaUrlParser() {
    }

    public static GachaUrlParams parseGachaUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }

        try {
            String normalizedUrl = url.replace("#/record", "");
            URI uri = new URI(normalizedUrl);
            String query = uri.getRawQuery();
            if (query == null || query.isBlank()) {
                return null;
            }

            GachaUrlParams params = new GachaUrlParams();
            for (String pair : query.split("&")) {
                String[] kv = pair.split("=", 2);
                if (kv.length != 2) {
                    continue;
                }
                String key = kv[0];
                String value = kv[1];
                switch (key) {
                    case "svr_id" -> params.setServerId(value);
                    case "player_id" -> params.setPlayerId(value);
                    case "record_id" -> params.setRecordId(value);
                    case "resources_id" -> params.setCardPoolId(value);
                    case "lang" -> params.setLanguageCode(value);
                    default -> {
                        // ignore unknown params
                    }
                }
            }
            return params;
        } catch (URISyntaxException e) {
            return null;
        }
    }

    public static List<GachaQueryParams> buildQueryParams(String url) {
        GachaUrlParams parsed = parseGachaUrl(url);
        if (parsed == null) {
            return List.of();
        }

        List<GachaQueryParams> payloads = new ArrayList<>(POOL_TYPES.length);
        for (int poolType : POOL_TYPES) {
            GachaQueryParams payload = new GachaQueryParams();
            payload.setPlayerId(parsed.getPlayerId());
            payload.setServerId(parsed.getServerId());
            payload.setRecordId(parsed.getRecordId());
            payload.setCardPoolId(parsed.getCardPoolId());
            payload.setLanguageCode(parsed.getLanguageCode());
            payload.setCardPoolType(poolType);
            payloads.add(payload);
        }
        return payloads;
    }
}
