package ru.enterra.auth.api;

public record CheckResponse(
        boolean registered,
        boolean verified,
        boolean maintenanceBlocked,
        String maintenanceMessage,
        boolean multiAccountBlocked,
        boolean multiAccountOnline,
        String role,
        String privilegeSlug,
        String luckPermsGroup,
        String mediaPlatform,
        boolean nameColorAllowed,
        String nameColor
) {
}
