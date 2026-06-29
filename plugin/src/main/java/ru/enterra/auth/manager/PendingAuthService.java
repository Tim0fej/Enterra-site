package ru.enterra.auth.manager;

import net.kyori.adventure.bossbar.BossBar;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import net.kyori.adventure.title.Title;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitTask;
import ru.enterra.auth.EnterraAuthPlugin;
import ru.enterra.auth.util.Urls;

import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Визуал и защита игрока, пока не введён /code.
 */
public final class PendingAuthService {

    private final EnterraAuthPlugin plugin;
    private final Map<UUID, BossBar> bossBars = new ConcurrentHashMap<>();
    private final Map<UUID, BukkitTask> reminderTasks = new ConcurrentHashMap<>();
    private final Map<UUID, BukkitTask> timeoutTasks = new ConcurrentHashMap<>();

    public PendingAuthService(EnterraAuthPlugin plugin) {
        this.plugin = plugin;
    }

    public void apply(Player player) {
        if (!player.isOnline()) {
            return;
        }

        applyProtection(player);
        showWelcomeUi(player);
        startReminders(player);
        startTimeout(player);
        refreshCommands(player);
    }

    public void clear(Player player) {
        UUID id = player.getUniqueId();

        cancelTask(reminderTasks.remove(id));
        cancelTask(timeoutTasks.remove(id));

        BossBar bar = bossBars.remove(id);
        if (bar != null) {
            player.hideBossBar(bar);
        }

        if (player.isOnline()) {
            player.clearTitle();
            player.sendActionBar(Component.empty());
            removeProtection(player);
            showSuccessFlash(player);
            refreshCommands(player);
        }
    }

    public void clearAll() {
        for (UUID id : bossBars.keySet().toArray(new UUID[0])) {
            Player player = Bukkit.getPlayer(id);
            if (player != null) {
                clear(player);
            }
        }
        reminderTasks.values().forEach(BukkitTask::cancel);
        reminderTasks.clear();
        timeoutTasks.values().forEach(BukkitTask::cancel);
        timeoutTasks.clear();
        bossBars.clear();
    }

    private void applyProtection(Player player) {
        if (plugin.getConfig().getBoolean("pending-auth.blindness", true)) {
            player.addPotionEffect(new PotionEffect(
                    PotionEffectType.BLINDNESS,
                    Integer.MAX_VALUE,
                    0,
                    false,
                    false,
                    false
            ));
        }

        if (plugin.getConfig().getBoolean("pending-auth.invulnerable", true)) {
            player.setInvulnerable(true);
        }

        if (plugin.getConfig().getBoolean("pending-auth.no-hunger", true)) {
            player.setFoodLevel(20);
            player.setSaturation(20f);
        }
    }

    private void removeProtection(Player player) {
        player.removePotionEffect(PotionEffectType.BLINDNESS);
        player.setInvulnerable(false);
    }

    private void showWelcomeUi(Player player) {
        sendAuthBox(player);

        if (plugin.getConfig().getBoolean("pending-auth.title-hint", true)) {
            showTitleHint(player);
        }

        if (plugin.getConfig().getBoolean("pending-auth.boss-bar", true)) {
            ensureBossBar(player);
            updateBossBarCountdown(player, timeoutSeconds(), timeoutSeconds());
        }

        player.sendActionBar(actionBarText(timeoutSeconds()));
    }

    private void sendAuthBox(Player player) {
        String website = Urls.normalizeBase(plugin.getConfig().getString("website-url", "http://localhost:5173"));
        var legacy = LegacyComponentSerializer.legacySection();
        String seconds = String.valueOf(timeoutSeconds());
        for (String line : plugin.msg("need-code-box", "%website%", website)
                .replace("%seconds%", seconds)
                .split("\n")) {
            if (!line.isBlank()) {
                player.sendMessage(legacy.deserialize(line));
            }
        }
    }

    private void showTitleHint(Player player) {
        Title.Times times = Title.Times.times(
                Duration.ofMillis(350),
                Duration.ofSeconds(3),
                Duration.ofMillis(350)
        );

        Component title = Component.text("Enterra")
                .color(NamedTextColor.AQUA)
                .decorate(TextDecoration.BOLD);

        Component subtitle = Component.text("У тебя " + timeoutSeconds() + " сек · /code <код>")
                .color(NamedTextColor.GRAY);

        player.showTitle(Title.title(title, subtitle, times));
    }

    private void showSuccessFlash(Player player) {
        Title.Times times = Title.Times.times(
                Duration.ofMillis(200),
                Duration.ofMillis(1200),
                Duration.ofMillis(400)
        );

        Component title = Component.text("Готово!")
                .color(NamedTextColor.GREEN)
                .decorate(TextDecoration.BOLD);

        Component subtitle = Component.text("Добро пожаловать на Enterra")
                .color(NamedTextColor.WHITE);

        player.showTitle(Title.title(title, subtitle, times));
    }

    private void ensureBossBar(Player player) {
        UUID id = player.getUniqueId();

        if (bossBars.containsKey(id)) {
            return;
        }

        BossBar bar = BossBar.bossBar(
                Component.text("Подтверждение · /code <код>")
                        .color(NamedTextColor.AQUA),
                1.0f,
                BossBar.Color.BLUE,
                BossBar.Overlay.NOTCHED_10
        );

        bossBars.put(id, bar);
        player.showBossBar(bar);
    }

    private void updateBossBarCountdown(Player player, long remainingSeconds, long totalSeconds) {
        if (!plugin.getConfig().getBoolean("pending-auth.boss-bar", true)) {
            return;
        }

        UUID id = player.getUniqueId();
        BossBar bar = bossBars.get(id);
        if (bar == null) {
            return;
        }

        float progress = totalSeconds <= 0 ? 0f : Math.max(0f, Math.min(1f, remainingSeconds / (float) totalSeconds));
        bar.progress(progress);
        bar.name(Component.text("Подтверждение · " + remainingSeconds + " сек · /code <код>")
                .color(remainingSeconds <= 10 ? NamedTextColor.RED : NamedTextColor.AQUA));
    }

    private Component actionBarText(long remainingSeconds) {
        return Component.text("Enterra")
                .color(NamedTextColor.AQUA)
                .append(Component.text(" · ", NamedTextColor.DARK_GRAY))
                .append(Component.text(remainingSeconds + " сек", NamedTextColor.WHITE))
                .append(Component.text(" · ", NamedTextColor.DARK_GRAY))
                .append(Component.text("/code ", NamedTextColor.WHITE))
                .append(Component.text("<код>", NamedTextColor.GRAY));
    }

    private void startReminders(Player player) {
        UUID id = player.getUniqueId();
        cancelTask(reminderTasks.remove(id));

        long intervalSeconds = Math.max(3L, plugin.getConfig().getLong("pending-auth.reminder-interval-seconds", 8L));
        long intervalTicks = intervalSeconds * 20L;

        BukkitTask task = Bukkit.getScheduler().runTaskTimer(plugin, () -> {
            if (!player.isOnline()) {
                cancelTask(reminderTasks.remove(id));
                return;
            }

            VerificationManager manager = plugin.getVerificationManager();
            if (!manager.isPending(player) || manager.isVerified(player)) {
                clear(player);
                return;
            }

            applyProtection(player);

            if (plugin.getConfig().getBoolean("pending-auth.title-hint", true)) {
                showTitleHint(player);
            }
        }, intervalTicks, intervalTicks);

        reminderTasks.put(id, task);
    }

    private void startTimeout(Player player) {
        UUID id = player.getUniqueId();
        cancelTask(timeoutTasks.remove(id));

        long totalSeconds = timeoutSeconds();
        long deadlineMs = System.currentTimeMillis() + totalSeconds * 1000L;

        BukkitTask task = Bukkit.getScheduler().runTaskTimer(plugin, () -> {
            if (!player.isOnline()) {
                cancelTask(timeoutTasks.remove(id));
                return;
            }

            VerificationManager manager = plugin.getVerificationManager();
            if (!manager.isPending(player) || manager.isVerified(player)) {
                clear(player);
                return;
            }

            long remainingSeconds = Math.max(0L, (deadlineMs - System.currentTimeMillis() + 999L) / 1000L);
            updateBossBarCountdown(player, remainingSeconds, totalSeconds);
            player.sendActionBar(actionBarText(remainingSeconds));

            if (remainingSeconds <= 0L) {
                kickForTimeout(player);
                cancelTask(timeoutTasks.remove(id));
            }
        }, 20L, 20L);

        timeoutTasks.put(id, task);
    }

    private void kickForTimeout(Player player) {
        VerificationManager manager = plugin.getVerificationManager();
        if (!manager.isPending(player) || manager.isVerified(player)) {
            return;
        }

        String message = plugin.msg("code-timeout", "%seconds%", String.valueOf(timeoutSeconds()));
        player.kick(LegacyComponentSerializer.legacySection().deserialize(message));
        manager.unmark(player);
    }

    private long timeoutSeconds() {
        return Math.max(10L, plugin.getConfig().getLong("pending-auth.timeout-seconds", 45L));
    }

    private void refreshCommands(Player player) {
        Bukkit.getScheduler().runTask(plugin, player::updateCommands);
    }

    private static void cancelTask(BukkitTask task) {
        if (task != null) {
            task.cancel();
        }
    }
}
