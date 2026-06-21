package ru.enterra.auth.listener;

import net.kyori.adventure.text.Component;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.AsyncPlayerPreLoginEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import ru.enterra.auth.EnterraAuthPlugin;

public final class JoinListener implements Listener {

    private final EnterraAuthPlugin plugin;

    public JoinListener(EnterraAuthPlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler(priority = EventPriority.HIGH)
    public void onPreLogin(AsyncPlayerPreLoginEvent event) {
        String username = event.getName();

        try {
            var response = plugin.getApiClient().checkPlayer(username).join();

            if (!response.registered()) {
                String website = plugin.getConfig().getString("website-url", "http://localhost:5173");
                String message = plugin.msg("not-registered", "%username%", username)
                        .replace("%website%", website);
                event.disallow(
                        AsyncPlayerPreLoginEvent.Result.KICK_OTHER,
                        Component.text(stripColors(message))
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
        var manager = plugin.getVerificationManager();

        plugin.getApiClient().checkPlayer(player.getName()).whenComplete((response, error) -> {
            plugin.getServer().getScheduler().runTask(plugin, () -> {
                if (!player.isOnline()) {
                    return;
                }

                if (error != null) {
                    player.kick(Component.text(stripColors(plugin.msg("api-error"))));
                    return;
                }

                if (response.verified()) {
                    manager.markVerified(player);
                    player.sendMessage(Component.text(plugin.msg("verified-welcome")));
                    plugin.getLuckPermsSync().sync(player, response);
                    return;
                }

                manager.markPending(player);
                sendMultiline(player, plugin.msg("need-code"));
            });
        });
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent event) {
        plugin.getVerificationManager().unmark(event.getPlayer());
    }

    private void sendMultiline(Player player, String message) {
        for (String line : message.split("\n")) {
            if (!line.isBlank()) {
                player.sendMessage(Component.text(line));
            }
        }
    }

    private static String stripColors(String text) {
        return text.replaceAll("\u00A7.", "");
    }
}
