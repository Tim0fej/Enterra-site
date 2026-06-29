package ru.enterra.auth.manager;

import net.kyori.adventure.text.Component;
import org.bukkit.entity.Player;
import ru.enterra.auth.EnterraAuthPlugin;

public final class PlayerSyncHelper {

    private PlayerSyncHelper() {
    }

    public static void syncFromSite(EnterraAuthPlugin plugin, Player player, boolean notifyOnSuccess) {
        plugin.getApiClient().checkPlayer(player.getName()).whenComplete((response, error) -> {
            plugin.getServer().getScheduler().runTask(plugin, () -> {
                if (!player.isOnline()) {
                    return;
                }

                if (error != null) {
                    if (notifyOnSuccess) {
                        player.sendMessage(Component.text(plugin.msg("api-error")));
                    }
                    plugin.getLogger().warning("Site check failed for " + player.getName() + ": " + error.getMessage());
                    return;
                }

                plugin.getLuckPermsSync().sync(player, response).whenComplete((group, syncError) -> {
                    plugin.getServer().getScheduler().runTask(plugin, () -> {
                        if (!player.isOnline()) {
                            return;
                        }

                        VioletNameFormatSync.apply(player, response);

                        if (!notifyOnSuccess) {
                            return;
                        }

                        if (response.nameColorAllowed() && response.nameColor() != null && !response.nameColor().isBlank()) {
                            player.sendMessage(Component.text(plugin.msg("name-color-applied")));
                        }

                        if (syncError != null || group == null || group.isBlank()) {
                            player.sendMessage(Component.text(plugin.msg("sync-failed")));
                            return;
                        }

                        player.sendMessage(Component.text(plugin.msg("sync-success", "%group%", group)));
                    });
                });
            });
        });
    }
}
