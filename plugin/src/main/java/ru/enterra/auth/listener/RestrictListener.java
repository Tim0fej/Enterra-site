package ru.enterra.auth.listener;

import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.entity.EntityPickupItemEvent;
import org.bukkit.event.entity.EntityTargetLivingEntityEvent;
import org.bukkit.event.entity.FoodLevelChangeEvent;
import org.bukkit.event.inventory.InventoryOpenEvent;
import org.bukkit.event.player.PlayerCommandPreprocessEvent;
import org.bukkit.event.player.PlayerDropItemEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.event.player.PlayerMoveEvent;
import ru.enterra.auth.EnterraAuthPlugin;
import ru.enterra.auth.manager.VerificationManager;

public final class RestrictListener implements Listener {

    private final VerificationManager verificationManager;
    private final EnterraAuthPlugin plugin;

    public RestrictListener(EnterraAuthPlugin plugin, VerificationManager verificationManager) {
        this.plugin = plugin;
        this.verificationManager = verificationManager;
    }

    private boolean shouldRestrict(org.bukkit.entity.Player player) {
        return verificationManager.isPending(player) && !verificationManager.isVerified(player);
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onMove(PlayerMoveEvent event) {
        if (!shouldRestrict(event.getPlayer())) {
            return;
        }

        if (event.getFrom().getBlockX() != event.getTo().getBlockX()
                || event.getFrom().getBlockY() != event.getTo().getBlockY()
                || event.getFrom().getBlockZ() != event.getTo().getBlockZ()) {
            event.setTo(event.getFrom());
        }
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onBreak(BlockBreakEvent event) {
        if (shouldRestrict(event.getPlayer())) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onPlace(BlockPlaceEvent event) {
        if (shouldRestrict(event.getPlayer())) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onInteract(PlayerInteractEvent event) {
        if (shouldRestrict(event.getPlayer())) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onDrop(PlayerDropItemEvent event) {
        if (shouldRestrict(event.getPlayer())) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onPickup(EntityPickupItemEvent event) {
        if (event.getEntity() instanceof org.bukkit.entity.Player player && shouldRestrict(player)) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onInventory(InventoryOpenEvent event) {
        if (event.getPlayer() instanceof org.bukkit.entity.Player player && shouldRestrict(player)) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onDamage(EntityDamageEvent event) {
        if (event.getEntity() instanceof org.bukkit.entity.Player player && shouldRestrict(player)) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onDamageByEntity(EntityDamageByEntityEvent event) {
        if (event.getDamager() instanceof org.bukkit.entity.Player player && shouldRestrict(player)) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onFood(FoodLevelChangeEvent event) {
        if (event.getEntity() instanceof org.bukkit.entity.Player player && shouldRestrict(player)) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onTarget(EntityTargetLivingEntityEvent event) {
        if (event.getTarget() instanceof org.bukkit.entity.Player player && shouldRestrict(player)) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onCommand(PlayerCommandPreprocessEvent event) {
        if (!shouldRestrict(event.getPlayer())) {
            return;
        }

        String message = event.getMessage().trim().toLowerCase();
        if (message.startsWith("/code") || message.startsWith("/verify")) {
            return;
        }

        event.setCancelled(true);
        event.getPlayer().sendMessage(LegacyComponentSerializer.legacySection()
                .deserialize(plugin.msg("command-blocked")));
    }
}
