package com.phrolova.gacha.common.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public final class BusinessKeyUtil {

    private BusinessKeyUtil() {
    }

    public static String build(String gameUid, Long poolId, Long resourceInternalId,
                               String drawTime, Integer inSecondSeq) {
        String raw = String.valueOf(gameUid)
                + poolId
                + resourceInternalId
                + drawTime
                + inSecondSeq;
        return sha256(raw);
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }
}
