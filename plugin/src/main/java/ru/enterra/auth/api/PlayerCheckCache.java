package ru.enterra.auth.api;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Кэш последних успешных ответов /check — на случай кратковременной недоступности сайта. */
public final class PlayerCheckCache {

    private static final long FRESH_TTL_MS = 45_000;
    private static final long GRACE_TTL_MS = 5 * 60_000;

    private final Map<String, Entry> byName = new ConcurrentHashMap<>();

    private record Entry(CheckResponse response, long cachedAt) {}

    public void remember(String username, CheckResponse response) {
        if (username == null || username.isBlank() || response == null) {
            return;
        }
        byName.put(normalize(username), new Entry(response, System.currentTimeMillis()));
    }

    /** Свежий кэш для фоновых задач (auto-sync, session-check). */
    public CheckResponse getFresh(String username) {
        return getIfFresh(username, FRESH_TTL_MS);
    }

    /** Устаревший, но допустимый кэш при сбое сети (join после pre-login). */
    public CheckResponse getGrace(String username) {
        return getIfFresh(username, GRACE_TTL_MS);
    }

    private CheckResponse getIfFresh(String username, long ttlMs) {
        Entry entry = byName.get(normalize(username));
        if (entry == null) {
            return null;
        }
        if (System.currentTimeMillis() - entry.cachedAt > ttlMs) {
            byName.remove(normalize(username));
            return null;
        }
        return entry.response;
    }

    private static String normalize(String username) {
        return username.toLowerCase(Locale.ROOT);
    }
}
