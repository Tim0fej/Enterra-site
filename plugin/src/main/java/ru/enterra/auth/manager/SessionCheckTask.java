package ru.enterra.auth.manager;

import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitRunnable;
import ru.enterra.auth.EnterraAuthPlugin;

/**
 * Периодически сверяет локальную сессию с сайтом и кикает, если код сброшен.
 */
public final class SessionCheckTask extends BukkitRunnable {

    private final EnterraAuthPlugin plugin;

    public SessionCheckTask(EnterraAuthPlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public void run() {
        if (!plugin.getConfig().getBoolean("session-check.enabled", true)) {
            return;
        }

        if (plugin.getApiClient().isApiDegraded()) {
            return;
        }

        VerificationManager manager = plugin.getVerificationManager();

        for (Player player : plugin.getServer().getOnlinePlayers()) {
            plugin.getApiClient().checkPlayerCached(player.getName()).whenComplete((response, error) -> {
                if (error != null) {
                    return;
                }

                plugin.getServer().getScheduler().runTask(plugin, () -> {
                    if (!player.isOnline()) {
                        return;
                    }

                    if (response.maintenanceBlocked()) {
                        String message = plugin.msg("maintenance-blocked", "%message%",
                                response.maintenanceMessage() != null && !response.maintenanceMessage().isBlank()
                                        ? response.maintenanceMessage()
                                        : plugin.msg("maintenance-blocked-default"));
                        player.kick(LegacyComponentSerializer.legacySection().deserialize(message));
                        manager.unmark(player);
                        return;
                    }

                    if (!manager.isVerified(player)) {
                        return;
                    }

                    if (response.verified()) {
                        plugin.getStaffProtection().rememberSiteRole(player, response);
                        return;
                    }

                    String message = plugin.msg("code-reset-kick");
                    player.kick(LegacyComponentSerializer.legacySection().deserialize(message));
                    manager.unmark(player);
                });
            });
        }
    }
}
