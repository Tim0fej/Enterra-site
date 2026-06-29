package ru.enterra.auth.api;

public record VerifyResponse(boolean valid, String error) {
    public static VerifyResponse success() {
        return new VerifyResponse(true, null);
    }

    public static VerifyResponse failure(String error) {
        return new VerifyResponse(false, error);
    }
}
