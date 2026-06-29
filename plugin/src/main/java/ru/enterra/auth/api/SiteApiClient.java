package ru.enterra.auth.api;

import ru.enterra.auth.EnterraAuthPlugin;
import ru.enterra.auth.util.Urls;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class SiteApiClient {

    private static final Pattern BOOL_FIELD = Pattern.compile("\"(\\w+)\"\\s*:\\s*(true|false)");
    private static final int API_RETRY_MAX = 5;
    private static final Duration API_RETRY_BASE_DELAY = Duration.ofSeconds(2);

    private final EnterraAuthPlugin plugin;
    private final HttpClient httpClient;
    private final PlayerCheckCache checkCache = new PlayerCheckCache();
    private volatile long lastApiSuccessAt;
    private volatile int consecutiveFailures;

    public SiteApiClient(EnterraAuthPlugin plugin) {
        this.plugin = plugin;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .version(HttpClient.Version.HTTP_1_1)
                .build();
    }

    public boolean isApiDegraded() {
        return consecutiveFailures >= 3
                && System.currentTimeMillis() - lastApiSuccessAt > 60_000;
    }

    public CheckResponse getGraceCheck(String username) {
        return checkCache.getGrace(username);
    }

    public CompletableFuture<CheckResponse> checkPlayer(String username) {
        return checkPlayer(username, null, false);
    }

    public CompletableFuture<CheckResponse> checkPlayer(String username, String ipAddress) {
        return checkPlayer(username, ipAddress, false);
    }

    public CompletableFuture<CheckResponse> checkPlayerForJoin(String username, String ipAddress) {
        return checkPlayer(username, ipAddress, true);
    }

    /** Фоновая проверка: свежий кэш или запрос с fallback на grace-кэш. */
    public CompletableFuture<CheckResponse> checkPlayerCached(String username) {
        CheckResponse fresh = checkCache.getFresh(username);
        if (fresh != null && !isApiDegraded()) {
            return CompletableFuture.completedFuture(fresh);
        }
        return checkPlayer(username, null, true);
    }

    private CompletableFuture<CheckResponse> checkPlayer(
            String username,
            String ipAddress,
            boolean allowCacheFallback
    ) {
        String baseUrl = Urls.normalizeBase(plugin.getConfig().getString("api-url", "http://localhost:3001"));
        String url = baseUrl + "/api/minecraft/check/" + encodePath(username);
        if (ipAddress != null && !ipAddress.isBlank()) {
            url += "?ip=" + encodePath(ipAddress);
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("User-Agent", userAgent())
                .header("x-api-key", plugin.getConfig().getString("api-key", "enterra-plugin-key"))
                .GET()
                .build();

        return sendWithRetry(request)
                .thenApply(response -> parseCheckResponse(username, response))
                .exceptionallyCompose(error -> {
                    markFailure();
                    if (allowCacheFallback) {
                        CheckResponse grace = checkCache.getGrace(username);
                        if (grace != null) {
                            plugin.getLogger().warning(
                                    "Site API недоступен для " + username + " — используем сохранённый статус"
                            );
                            return CompletableFuture.completedFuture(grace);
                        }
                    }
                    return CompletableFuture.failedFuture(unwrap(error));
                });
    }

    private CheckResponse parseCheckResponse(String username, HttpResponse<String> response) {
        if (response.statusCode() != 200) {
            markFailure();
            throw new ApiException("HTTP " + response.statusCode());
        }

        markSuccess();
        String body = response.body();
        CheckResponse parsed = new CheckResponse(
                readBool(body, "registered"),
                readBool(body, "verified"),
                readBool(body, "maintenanceBlocked"),
                readString(body, "maintenanceMessage"),
                readBool(body, "multiAccountBlocked"),
                readBool(body, "multiAccountOnline"),
                readString(body, "role"),
                readString(body, "privilegeSlug"),
                readString(body, "luckPermsGroup"),
                readString(body, "mediaPlatform"),
                readBool(body, "nameColorAllowed"),
                readNullableString(body, "nameColor")
        );
        checkCache.remember(username, parsed);
        return parsed;
    }

    private void markSuccess() {
        lastApiSuccessAt = System.currentTimeMillis();
        consecutiveFailures = 0;
    }

    private void markFailure() {
        consecutiveFailures++;
    }

    private String userAgent() {
        String version = plugin.getDescription().getVersion();
        if (version == null || version.isBlank()) {
            return "EnterraAuth";
        }
        return "EnterraAuth/" + version;
    }

    public CompletableFuture<Void> reportPresence(String username, String ipAddress, boolean online) {
        String baseUrl = Urls.normalizeBase(plugin.getConfig().getString("api-url", "http://localhost:3001"));
        String url = baseUrl + "/api/minecraft/presence";

        String ipJson = ipAddress == null || ipAddress.isBlank()
                ? "null"
                : "\"" + escapeJson(ipAddress) + "\"";
        String body = "{\"username\":\"" + escapeJson(username) + "\",\"ip\":" + ipJson + ",\"online\":"
                + online + "}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .header("User-Agent", userAgent())
                .header("Content-Type", "application/json")
                .header("x-api-key", plugin.getConfig().getString("api-key", "enterra-plugin-key"))
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

        return sendWithRetry(request)
                .thenApply(response -> {
                    if (response.statusCode() == 200) {
                        markSuccess();
                    } else {
                        markFailure();
                        plugin.getLogger().warning("Presence update failed for " + username + ": HTTP "
                                + response.statusCode());
                    }
                    return null;
                });
    }

    public CompletableFuture<VerifyResponse> verifyCode(String username, String code) {
        String baseUrl = Urls.normalizeBase(plugin.getConfig().getString("api-url", "http://localhost:3001"));
        String url = baseUrl + "/api/minecraft/verify";

        String body = "{\"username\":\"" + escapeJson(username) + "\",\"code\":\"" + escapeJson(code) + "\"}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("User-Agent", userAgent())
                .header("Content-Type", "application/json")
                .header("x-api-key", plugin.getConfig().getString("api-key", "enterra-plugin-key"))
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

        return sendWithRetry(request)
                .thenApply(response -> {
                    if (response.statusCode() == 200 && readBool(response.body(), "valid")) {
                        return VerifyResponse.success();
                    }

                    String error = readString(response.body(), "error");
                    return VerifyResponse.failure(error != null ? error : "Invalid code");
                });
    }

    public CompletableFuture<List<ModQueueAction>> fetchModQueue() {
        String baseUrl = Urls.normalizeBase(plugin.getConfig().getString("api-url", "http://localhost:3001"));
        String url = baseUrl + "/api/minecraft/mod-queue";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .header("x-api-key", plugin.getConfig().getString("api-key", "enterra-plugin-key"))
                .GET()
                .build();

        return sendWithRetry(request)
                .thenApply(response -> {
                    if (response.statusCode() != 200) {
                        throw new ApiException("HTTP " + response.statusCode());
                    }
                    return parseModQueueActions(response.body());
                });
    }

    public CompletableFuture<Void> ackModQueue(long id, boolean ok, String error) {
        String baseUrl = Urls.normalizeBase(plugin.getConfig().getString("api-url", "http://localhost:3001"));
        String url = baseUrl + "/api/minecraft/mod-queue/" + id + "/ack";

        String errorJson = error == null || error.isBlank()
                ? "null"
                : "\"" + escapeJson(error) + "\"";
        String body = "{\"ok\":" + ok + ",\"error\":" + errorJson + "}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .header("x-api-key", plugin.getConfig().getString("api-key", "enterra-plugin-key"))
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

        return sendWithRetry(request)
                .thenApply(response -> {
                    if (response.statusCode() != 200) {
                        plugin.getLogger().warning("Mod queue ack failed for #" + id + ": HTTP "
                                + response.statusCode());
                    }
                    return null;
                });
    }

    public CompletableFuture<Void> syncPunishments(List<PunishmentSyncEntry> entries) {
        String baseUrl = Urls.normalizeBase(plugin.getConfig().getString("api-url", "http://localhost:3001"));
        String url = baseUrl + "/api/minecraft/punishments/sync";

        StringBuilder json = new StringBuilder("{\"punishments\":[");
        for (int i = 0; i < entries.size(); i++) {
            if (i > 0) {
                json.append(',');
            }
            PunishmentSyncEntry entry = entries.get(i);
            json.append('{')
                    .append("\"litebansId\":").append(entry.litebansId())
                    .append(",\"type\":\"").append(escapeJson(entry.type())).append('"')
                    .append(",\"targetUsername\":\"").append(escapeJson(entry.targetUsername())).append('"');
            if (entry.targetUuid() != null && !entry.targetUuid().isBlank()) {
                json.append(",\"targetUuid\":\"").append(escapeJson(entry.targetUuid())).append('"');
            }
            if (entry.reason() != null && !entry.reason().isBlank()) {
                json.append(",\"reason\":\"").append(escapeJson(entry.reason())).append('"');
            }
            if (entry.staffName() != null && !entry.staffName().isBlank()) {
                json.append(",\"staffName\":\"").append(escapeJson(entry.staffName())).append('"');
            }
            if (entry.expiresAt() != null && !entry.expiresAt().isBlank()) {
                json.append(",\"expiresAt\":\"").append(escapeJson(entry.expiresAt())).append('"');
            }
            json.append('}');
        }
        json.append("]}");

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .header("x-api-key", plugin.getConfig().getString("api-key", "enterra-plugin-key"))
                .POST(HttpRequest.BodyPublishers.ofString(json.toString(), StandardCharsets.UTF_8))
                .build();

        return sendWithRetry(request)
                .thenApply(response -> {
                    if (response.statusCode() != 200) {
                        throw new ApiException("HTTP " + response.statusCode());
                    }
                    return null;
                });
    }

    private static List<ModQueueAction> parseModQueueActions(String body) {
        List<ModQueueAction> actions = new ArrayList<>();
        Pattern blockPattern = Pattern.compile(
                "\\{\\s*\"id\"\\s*:\\s*(\\d+)\\s*,\\s*\"action\"\\s*:\\s*\"([^\"]*)\"\\s*,"
                        + "\\s*\"targetUsername\"\\s*:\\s*\"([^\"]*)\"\\s*,\\s*\"command\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"\\s*\\}"
        );
        Matcher matcher = blockPattern.matcher(body);
        while (matcher.find()) {
            long id = Long.parseLong(matcher.group(1));
            String action = unescapeJson(matcher.group(2));
            String target = unescapeJson(matcher.group(3));
            String command = unescapeJson(matcher.group(4));
            actions.add(new ModQueueAction(id, action, target, command));
        }
        return actions;
    }

    private static String unescapeJson(String value) {
        return value
                .replace("\\\"", "\"")
                .replace("\\\\", "\\")
                .replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\t", "\t");
    }

    public record ModQueueAction(long id, String action, String targetUsername, String command) {}

    public record PunishmentSyncEntry(
            long litebansId,
            String type,
            String targetUsername,
            String targetUuid,
            String reason,
            String staffName,
            String expiresAt
    ) {}

    private static boolean readBool(String json, String field) {
        Matcher matcher = BOOL_FIELD.matcher(json);
        while (matcher.find()) {
            if (field.equals(matcher.group(1))) {
                return Boolean.parseBoolean(matcher.group(2));
            }
        }
        return false;
    }

    private static String readString(String json, String field) {
        Pattern pattern = Pattern.compile("\"" + Pattern.quote(field) + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher matcher = pattern.matcher(json);
        return matcher.find() ? matcher.group(1) : null;
    }

    private static String readNullableString(String json, String field) {
        Pattern nullPattern = Pattern.compile("\"" + Pattern.quote(field) + "\"\\s*:\\s*null");
        if (nullPattern.matcher(json).find()) {
            return null;
        }
        return readString(json, field);
    }

    private static String encodePath(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String escapeJson(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private CompletableFuture<HttpResponse<String>> sendWithRetry(HttpRequest request) {
        return sendWithRetry(request, 1);
    }

    private CompletableFuture<HttpResponse<String>> sendWithRetry(HttpRequest request, int attempt) {
        return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8))
                .thenCompose(response -> {
                    if (isTransientStatus(response.statusCode()) && attempt < API_RETRY_MAX) {
                        return delayBeforeRetry(attempt + 1, "HTTP " + response.statusCode())
                                .thenCompose(ignored -> sendWithRetry(request, attempt + 1));
                    }
                    return CompletableFuture.completedFuture(response);
                })
                .exceptionallyCompose(error -> {
                    if (isTransientError(error) && attempt < API_RETRY_MAX) {
                        return delayBeforeRetry(attempt + 1, "сеть")
                                .thenCompose(ignored -> sendWithRetry(request, attempt + 1));
                    }
                    return CompletableFuture.failedFuture(unwrap(error));
                });
    }

    private CompletableFuture<Void> delayBeforeRetry(int attempt, String reason) {
        long delaySeconds = Math.min(10L, API_RETRY_BASE_DELAY.toSeconds() * (1L << Math.max(0, attempt - 2)));
        plugin.getLogger().info("Site API недоступен (" + reason + "), повтор " + attempt + "/"
                + API_RETRY_MAX + " через " + delaySeconds + " сек...");
        return CompletableFuture.runAsync(
                () -> {},
                CompletableFuture.delayedExecutor(delaySeconds * 1000L, TimeUnit.MILLISECONDS)
        );
    }

    private static boolean isTransientStatus(int status) {
        return status == 408 || status == 429 || status == 502 || status == 503 || status == 504;
    }

    private static boolean isTransientError(Throwable error) {
        Throwable cause = unwrap(error);
        return cause instanceof java.io.IOException;
    }

    private static Throwable unwrap(Throwable error) {
        if (error instanceof CompletionException && error.getCause() != null) {
            return error.getCause();
        }
        return error;
    }

    public static class ApiException extends RuntimeException {
        public ApiException(String message) {
            super(message);
        }
    }
}
