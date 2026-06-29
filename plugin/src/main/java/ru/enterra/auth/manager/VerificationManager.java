package ru.enterra.auth.manager;

import org.bukkit.entity.Player;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

public final class VerificationManager {

    private final Set<UUID> verified = ConcurrentHashMap.newKeySet();
    private final Set<UUID> pending = ConcurrentHashMap.newKeySet();
    private Consumer<Player> onPending;
    private Consumer<Player> onVerified;
    private Consumer<Player> onUnmark;

    public void setOnPending(Consumer<Player> onPending) {
        this.onPending = onPending;
    }

    public void setOnVerified(Consumer<Player> onVerified) {
        this.onVerified = onVerified;
    }

    public void setOnUnmark(Consumer<Player> onUnmark) {
        this.onUnmark = onUnmark;
    }

    public boolean isVerified(Player player) {
        return verified.contains(player.getUniqueId());
    }

    public boolean isPending(Player player) {
        return pending.contains(player.getUniqueId());
    }

    public void markVerified(Player player) {
        boolean wasPending = pending.remove(player.getUniqueId());
        verified.add(player.getUniqueId());
        if (wasPending && onVerified != null) {
            onVerified.accept(player);
        }
    }

    public void markPending(Player player) {
        pending.add(player.getUniqueId());
        verified.remove(player.getUniqueId());
        if (onPending != null) {
            onPending.accept(player);
        }
    }

    public void unmark(Player player) {
        pending.remove(player.getUniqueId());
        verified.remove(player.getUniqueId());
        if (onUnmark != null) {
            onUnmark.accept(player);
        }
    }

    public void clear() {
        verified.clear();
        pending.clear();
    }
}
