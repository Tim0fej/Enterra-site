package ru.enterra.auth.listener;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.AsyncPlayerPreLoginEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import ru.enterra.auth.EnterraAuthPlugin;
import ru.enterra.auth.manager.VioletNameFormatSync;
import ru.enterra.auth.util.Urls;

public final class JoinListener implements Listener {

    private final EnterraAuthPlugin plugin;

    public JoinListener(EnterraAuthPlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler(priority = EventPriority.HIGH)
    public void onPreLogin(AsyncPlayerPreLoginEvent event) {
        String username = event.getName();
        String ipAddress = event.getAddress() != null ? event.getAddress().getHostAddress() : null;

        try {
            var response = plugin.getApiClient().checkPlayer(username, ipAddress).join();

            if (response.maintenanceBlocked()) {
                String message = plugin.msg("maintenance-blocked", "%message%",
                        response.maintenanceMessage() != null && !response.maintenanceMessage().isBlank()
                                ? response.maintenanceMessage()
                                : plugin.msg("maintenance-blocked-default"));
                event.disallow(
                        AsyncPlayerPreLoginEvent.Result.KICK_OTHER,
                        Component.text(stripColors(message))
                );
                return;
            }

            if (!response.registered()) {
                String website = Urls.normalizeBase(
                        plugin.getConfig().getString("website-url", "http://localhost:5173"));
                String message = plugin.msg("not-registered", "%username%", username)
                        .replace("%website%", website);
                event.disallow(
                        AsyncPlayerPreLoginEvent.Result.KICK_OTHER,
                        Component.text(stripColors(message))
                );
                return;
            }

            if (response.multiAccountBlocked()) {
                event.disallow(
                        AsyncPlayerPreLoginEvent.Result.KICK_OTHER,
                        Component.text(stripColors(plugin.msg("multi-account-blocked")))
                );
                return;
            }

            if (response.multiAccountOnline()) {
                event.disallow(
                        AsyncPlayerPreLoginEvent.Result.KICK_OTHER,
                        Component.text(stripColors(plugin.msg("multi-account-online")))
                );
            }
        } catch (Exception ex) {
            plugin.getLogger().warning("Pre-login check failed for " + username + ": " + ex.getMessage());
            event.disallow(
                    AsyncPlayerPreLoginEvent.Result.KICK_OTHER,
                    Component.text(stripColors(plugin.msg("api-error")))
            );
        }
    }

    @EventHandler
    public void onJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        String ipAddress = player.getAddress() != null ? player.getAddress().getAddress().getHostAddress() : null;

        plugin.getApiClient().reportPresence(player.getName(), ipAddress, true);

        plugin.getApiClient().checkPlayerForJoin(player.getName(), ipAddress).whenComplete((response, error) -> {
            plugin.getServer().getScheduler().runTask(plugin, () -> {
                if (!player.isOnline()) {
                    return;
                }

                ru.enterra.auth.api.CheckResponse resolved = response;
                if (error != null) {
                    var cached = plugin.getApiClient().getGraceCheck(player.getName());
                    if (cached != null) {
                        resolved = cached;
                    } else {
                        player.kick(Component.text(stripColors(plugin.msg("api-error"))));
                        return;
                    }
                }

                applyJoinCheck(player, resolved);
            });
        });
    }

    private void applyJoinCheck(Player player, ru.enterra.auth.api.CheckResponse response) {
        var manager = plugin.getVerificationManager();

        if (response.maintenanceBlocked()) {
            String message = plugin.msg("maintenance-blocked", "%message%",
                    response.maintenanceMessage() != null && !response.maintenanceMessage().isBlank()
                            ? response.maintenanceMessage()
                            : plugin.msg("maintenance-blocked-default"));
            player.kick(Component.text(stripColors(message)));
            return;
        }

        if (response.verified()) {
            manager.markVerified(player);
            plugin.getStaffProtection().rememberSiteRole(player, response);
            player.sendMessage(LegacyComponentSerializer.legacySection()
                    .deserialize(plugin.msg("verified-welcome")));
            plugin.getLuckPermsSync().sync(player, response);
            VioletNameFormatSync.apply(player, response);
            return;
        }

        plugin.getStaffProtection().rememberSiteRole(player, response);
        VioletNameFormatSync.apply(player, response);
        manager.markPending(player);
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent event) {
        plugin.getVerificationManager().unmark(event.getPlayer());
        plugin.getApiClient().reportPresence(event.getPlayer().getName(), null, false);
    }

    private static String stripColors(String text) {
        return text.replaceAll("\u00A7.", "");
    }
}
