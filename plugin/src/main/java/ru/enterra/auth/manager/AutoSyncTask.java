package ru.enterra.auth.manager;

import net.kyori.adventure.text.Component;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitRunnable;
import ru.enterra.auth.EnterraAuthPlugin;

public final class AutoSyncTask extends BukkitRunnable {

    private final EnterraAuthPlugin plugin;

    public AutoSyncTask(EnterraAuthPlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public void run() {
        if (!plugin.getConfig().getBoolean("auto-sync.enabled", true)) {
            return;
        }

        boolean notify = plugin.getConfig().getBoolean("auto-sync.notify-on-change", true);

        for (Player player : plugin.getServer().getOnlinePlayers()) {
            if (!plugin.getVerificationManager().isVerified(player)) {
                continue;
            }

            plugin.getApiClient().checkPlayer(player.getName()).whenComplete((response, error) -> {
                if (error != null) {
                    return;
                }

                plugin.getLuckPermsSync().syncIfChanged(player, response).whenComplete((group, syncError) -> {
                    if (syncError != null || group == null || group.isBlank() || !notify) {
                        return;
                    }

                    plugin.getServer().getScheduler().runTask(plugin, () -> {
                        if (!player.isOnline()) {
                            return;
                        }

                        player.sendMessage(Component.text(
                                plugin.msg("sync-auto-updated", "%group%", group)
                        ));
                    });
                });
            });
        }
    }
}
