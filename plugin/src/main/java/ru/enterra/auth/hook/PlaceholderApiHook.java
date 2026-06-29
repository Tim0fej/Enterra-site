package ru.enterra.auth.hook;

import org.bukkit.Bukkit;
import ru.enterra.auth.EnterraAuthPlugin;

public final class PlaceholderApiHook {

    private final EnterraAuthPlugin plugin;

    public PlaceholderApiHook(EnterraAuthPlugin plugin) {
        this.plugin = plugin;
    }

    public void register() {
        if (Bukkit.getPluginManager().getPlugin("PlaceholderAPI") == null) {
            plugin.getLogger().info("PlaceholderAPI not installed — enterra colored name placeholder skipped");
            return;
        }

        Bukkit.getScheduler().runTask(plugin, () -> {
            if (new EnterraColoredNameExpansion().register()) {
                plugin.getLogger().info("PlaceholderAPI expansion registered: %enterra_colored_name%");
            } else {
                plugin.getLogger().warning("Could not register PlaceholderAPI expansion %enterra_colored_name%");
            }
        });
    }
}
