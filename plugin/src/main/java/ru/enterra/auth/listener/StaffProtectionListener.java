package ru.enterra.auth.listener;

import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.AsyncPlayerPreLoginEvent;
import org.bukkit.event.player.PlayerCommandPreprocessEvent;
import org.bukkit.event.player.PlayerKickEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.event.server.ServerCommandEvent;
import ru.enterra.auth.EnterraAuthPlugin;
import ru.enterra.auth.manager.StaffProtectionService;

public final class StaffProtectionListener implements Listener {

    private final EnterraAuthPlugin plugin;
    private final StaffProtectionService staffProtection;

    public StaffProtectionListener(EnterraAuthPlugin plugin, StaffProtectionService staffProtection) {
        this.plugin = plugin;
        this.staffProtection = staffProtection;
    }

    @EventHandler(priority = EventPriority.HIGHEST, ignoreCancelled = true)
    public void onKick(PlayerKickEvent event) {
        if (!staffProtection.isProtected(event.getPlayer())) {
            return;
        }
        event.setCancelled(true);
    }

    @EventHandler(priority = EventPriority.HIGHEST, ignoreCancelled = true)
    public void onPreLogin(AsyncPlayerPreLoginEvent event) {
        if (event.getLoginResult() != AsyncPlayerPreLoginEvent.Result.KICK_BANNED) {
            return;
        }
        if (!staffProtection.isProtectedByName(event.getName())) {
            return;
        }
        event.allow();
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onPlayerCommand(PlayerCommandPreprocessEvent event) {
        if (!staffProtection.isEnabled()) {
            return;
        }

        ParsedCommand parsed = parseCommand(event.getMessage());
        if (parsed == null || !staffProtection.isModerationCommand(parsed.label())) {
            return;
        }

        String targetName = parsed.targetName();
        if (!staffProtection.shouldBlockPunishment(event.getPlayer(), targetName)) {
            return;
        }

        event.setCancelled(true);
        staffProtection.sendBlocked(event.getPlayer());
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onConsoleCommand(ServerCommandEvent event) {
        if (!staffProtection.isEnabled()) {
            return;
        }

        ParsedCommand parsed = parseCommand("/" + event.getCommand());
        if (parsed == null || !staffProtection.isModerationCommand(parsed.label())) {
            return;
        }

        String targetName = parsed.targetName();
        if (!staffProtection.shouldBlockPunishment(event.getSender(), targetName)) {
            return;
        }

        event.setCancelled(true);
        staffProtection.sendBlocked(event.getSender());
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent event) {
        staffProtection.forget(event.getPlayer());
    }

    private ParsedCommand parseCommand(String rawMessage) {
        if (rawMessage == null || rawMessage.isBlank()) {
            return null;
        }

        String trimmed = rawMessage.trim();
        if (!trimmed.startsWith("/")) {
            return null;
        }

        String[] parts = trimmed.substring(1).split("\\s+");
        if (parts.length == 0 || parts[0].isBlank()) {
            return null;
        }

        String label = parts[0].toLowerCase();
        String target = parts.length > 1 ? parts[1] : null;
        return new ParsedCommand(label, target);
    }

    private record ParsedCommand(String label, String targetName) {
    }
}
