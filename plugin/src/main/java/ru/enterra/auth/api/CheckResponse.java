package ru.enterra.auth.api;

public record CheckResponse(
        boolean registered,
        boolean verified,
        String role,
        String privilegeSlug,
        String luckPermsGroup,
        String mediaPlatform
) {
}
