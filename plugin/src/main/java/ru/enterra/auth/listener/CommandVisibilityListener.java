package ru.enterra.auth.listener;

import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerCommandSendEvent;
import org.bukkit.event.server.TabCompleteEvent;
import ru.enterra.auth.manager.VerificationManager;

import java.util.Locale;
import java.util.Set;

public final class CommandVisibilityListener implements Listener {

    private static final Set<String> ALLOWED_COMMANDS = Set.of("code", "verify");

    private final VerificationManager verificationManager;

    public CommandVisibilityListener(VerificationManager verificationManager) {
        this.verificationManager = verificationManager;
    }

    private boolean shouldRestrict(Player player) {
        return verificationManager.isPending(player) && !verificationManager.isVerified(player);
    }

    @EventHandler(priority = EventPriority.HIGHEST)
    public void onCommandSend(PlayerCommandSendEvent event) {
        if (!shouldRestrict(event.getPlayer())) {
            return;
        }

        event.getCommands().removeIf(command -> !ALLOWED_COMMANDS.contains(command.toLowerCase(Locale.ROOT)));
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onTabComplete(TabCompleteEvent event) {
        if (!(event.getSender() instanceof Player player) || !shouldRestrict(player)) {
            return;
        }

        String buffer = event.getBuffer().trim().toLowerCase(Locale.ROOT);
        if (buffer.isEmpty() || buffer.equals("/")) {
            event.setCompletions(ALLOWED_COMMANDS.stream().sorted().toList());
            return;
        }

        if (!buffer.startsWith("/code") && !buffer.startsWith("/verify")) {
            event.setCompletions(java.util.List.of());
        }
    }
}
