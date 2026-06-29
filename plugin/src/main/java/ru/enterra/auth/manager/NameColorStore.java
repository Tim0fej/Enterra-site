package ru.enterra.auth.manager;

import org.bukkit.entity.Player;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public final class NameColorStore {

    private static final Map<UUID, String> COLORED_NAMES = new ConcurrentHashMap<>();
    private static final Map<UUID, String> COLOR_CODES = new ConcurrentHashMap<>();

    private NameColorStore() {
    }

    public static void set(UUID uuid, String colorCodes, String legacyColoredName) {
        if (legacyColoredName == null || legacyColoredName.isBlank()) {
            clear(uuid);
            return;
        }
        COLORED_NAMES.put(uuid, legacyColoredName);
        if (colorCodes != null && !colorCodes.isBlank()) {
            COLOR_CODES.put(uuid, colorCodes);
        } else {
            COLOR_CODES.remove(uuid);
        }
    }

    public static String getLegacy(UUID uuid) {
        return COLORED_NAMES.get(uuid);
    }

    public static String getLegacyAmpersand(Player player) {
        String legacy = COLORED_NAMES.get(player.getUniqueId());
        if (legacy == null) {
            return player.getName();
        }
        return legacy.replace('\u00A7', '&');
    }

    public static String getMiniMessage(Player player) {
        String legacy = COLORED_NAMES.get(player.getUniqueId());
        if (legacy == null) {
            return player.getName();
        }
        return NameColorFormatter.legacyToMiniMessage(legacy);
    }

    public static String getOrPlain(Player player) {
        String colored = COLORED_NAMES.get(player.getUniqueId());
        return colored != null ? colored : player.getName();
    }

    public static void clear(UUID uuid) {
        COLORED_NAMES.remove(uuid);
        COLOR_CODES.remove(uuid);
    }
}
