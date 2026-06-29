package ru.enterra.auth.util;

public final class Urls {

    private Urls() {
    }

    /** Убирает trailing slash, чтобы base + "/api/..." не давало "//api". */
    public static String normalizeBase(String url) {
        if (url == null || url.isBlank()) {
            return url;
        }
        String trimmed = url.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    public static String joinPath(String base, String path) {
        String normalized = normalizeBase(base);
        if (path == null || path.isEmpty()) {
            return normalized;
        }
        return path.startsWith("/") ? normalized + path : normalized + "/" + path;
    }
}
