package ru.enterra.auth.api;

import ru.enterra.auth.EnterraAuthPlugin;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class SiteApiClient {

    private static final Pattern BOOL_FIELD = Pattern.compile("\"(\\w+)\"\\s*:\\s*(true|false)");

    private final EnterraAuthPlugin plugin;
    private final HttpClient httpClient;

    public SiteApiClient(EnterraAuthPlugin plugin) {
        this.plugin = plugin;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public CompletableFuture<CheckResponse> checkPlayer(String username) {
        String baseUrl = plugin.getConfig().getString("api-url", "http://localhost:3001");
        String url = baseUrl + "/api/minecraft/check/" + encodePath(username);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .header("x-api-key", plugin.getConfig().getString("api-key", "enterra-plugin-key"))
                .GET()
                .build();

        return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8))
                .thenApply(response -> {
                    if (response.statusCode() != 200) {
                        throw new ApiException("HTTP " + response.statusCode());
                    }

                    String body = response.body();
                    return new CheckResponse(
                            readBool(body, "registered"),
                            readBool(body, "verified"),
                            readString(body, "role"),
                            readString(body, "privilegeSlug"),
                            readString(body, "luckPermsGroup"),
                            readString(body, "mediaPlatform")
                    );
                });
    }

    public CompletableFuture<VerifyResponse> verifyCode(String username, String code) {
        String baseUrl = plugin.getConfig().getString("api-url", "http://localhost:3001");
        String url = baseUrl + "/api/minecraft/verify";

        String body = "{\"username\":\"" + escapeJson(username) + "\",\"code\":\"" + escapeJson(code) + "\"}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .header("Content-Type", "application/json")
                .header("x-api-key", plugin.getConfig().getString("api-key", "enterra-plugin-key"))
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

        return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8))
                .thenApply(response -> {
                    if (response.statusCode() == 200 && readBool(response.body(), "valid")) {
                        return VerifyResponse.success();
                    }

                    String error = readString(response.body(), "error");
                    return VerifyResponse.failure(error != null ? error : "Invalid code");
                });
    }

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

    public static class ApiException extends RuntimeException {
        public ApiException(String message) {
            super(message);
        }
    }
}
