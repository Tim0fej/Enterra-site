package ru.enterra.auth.hook;

import me.clip.placeholderapi.expansion.PlaceholderExpansion;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;
import ru.enterra.auth.manager.NameColorStore;

public final class EnterraColoredNameExpansion extends PlaceholderExpansion {

    @Override
    public @NotNull String getIdentifier() {
        return "enterra";
    }

    @Override
    public @NotNull String getAuthor() {
        return "Enterra";
    }

    @Override
    public @NotNull String getVersion() {
        return "1.0.0";
    }

    @Override
    public boolean persist() {
        return true;
    }

    @Override
    public String onPlaceholderRequest(Player player, @NotNull String params) {
        if (player == null) {
            return "";
        }
        if ("colored_name_mm".equalsIgnoreCase(params)) {
            return NameColorStore.getMiniMessage(player);
        }
        if ("colored_name".equalsIgnoreCase(params) || params.isEmpty()) {
            return NameColorStore.getLegacyAmpersand(player);
        }
        return null;
    }
}
