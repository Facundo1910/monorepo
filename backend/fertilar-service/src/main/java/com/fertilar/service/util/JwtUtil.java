package com.fertilar.service.util;

import java.util.Base64;

public class JwtUtil {

    private JwtUtil() {}

    public static String decodePayload(String token) {
        String[] parts = token.split("\\.");
        String base64 = parts[1];
        int padding = 4 - base64.length() % 4;
        if (padding != 4) base64 += "=".repeat(padding);
        return new String(Base64.getUrlDecoder().decode(base64));
    }

    public static String getClaim(String payload, String claim) {
        String key = "\"" + claim + "\":\"";
        int start = payload.indexOf(key);
        if (start == -1) return null;
        start += key.length();
        int end = payload.indexOf("\"", start);
        return payload.substring(start, end);
    }
}
