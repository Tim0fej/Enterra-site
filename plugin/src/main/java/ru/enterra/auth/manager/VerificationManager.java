package ru.enterra.auth.manager;

import org.bukkit.entity.Player;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public final class VerificationManager {

    private final Set<UUID> verified = ConcurrentHashMap.newKeySet();
    private final Set<UUID> pending = ConcurrentHashMap.newKeySet();

    public boolean isVerified(Player player) {
        return verified.contains(player.getUniqueId());
    }

    public boolean isPending(Player player) {
        return pending.contains(player.getUniqueId());
    }

    public void markVerified(Player player) {
        pending.remove(player.getUniqueId());
        verified.add(player.getUniqueId());
    }

    public void markPending(Player player) {
        pending.add(player.getUniqueId());
        verified.remove(player.getUniqueId());
    }

    public void unmark(Player player) {
        pending.remove(player.getUniqueId());
        verified.remove(player.getUniqueId());
    }

    public void clear() {
        verified.clear();
        pending.clear();
    }
}
