package ru.enterra.auth.manager;

import org.bukkit.Bukkit;
import org.bukkit.command.CommandSender;
import org.bukkit.scheduler.BukkitRunnable;
import ru.enterra.auth.EnterraAuthPlugin;
import ru.enterra.auth.api.SiteApiClient;
import ru.enterra.auth.manager.StaffProtectionService;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;

public final class ModerationQueueTask extends BukkitRunnable {

    private final EnterraAuthPlugin plugin;
    private final SiteApiClient apiClient;
    private final AtomicBoolean running = new AtomicBoolean(false);

    public ModerationQueueTask(EnterraAuthPlugin plugin) {
        this.plugin = plugin;
        this.apiClient = plugin.getApiClient();
    }

    @Override
    public void run() {
        if (!running.compareAndSet(false, true)) {
            return;
        }

        apiClient.fetchModQueue()
                .whenComplete((actions, error) -> {
                    running.set(false);
                    if (error != null) {
                        plugin.getLogger().log(Level.WARNING, "Mod queue fetch failed", error);
                        return;
                    }
                    if (actions == null || actions.isEmpty()) {
                        return;
                    }

                    Bukkit.getScheduler().runTask(plugin, () -> processActions(actions));
                });
    }

    private void processActions(List<SiteApiClient.ModQueueAction> actions) {
        CommandSender console = Bukkit.getConsoleSender();
        StaffProtectionService staffProtection = plugin.getStaffProtection();
        for (SiteApiClient.ModQueueAction action : actions) {
            try {
                String target = action.targetUsername();
                if (target != null
                        && !target.isBlank()
                        && staffProtection.isProtectedByName(target)) {
                    apiClient.ackModQueue(
                            action.id(),
                            false,
                            "Нельзя наказать администрацию на сервере (moder/admin/dev)"
                    );
                    continue;
                }

                boolean dispatched = Bukkit.dispatchCommand(console, action.command());
                if (!dispatched) {
                    apiClient.ackModQueue(
                            action.id(),
                            false,
                            "Команда не выполнена — проверьте ник и права LiteBans"
                    );
                    continue;
                }
                plugin.getLogger().info("Moderation queue #" + action.id() + ": " + action.command());
                apiClient.ackModQueue(action.id(), true, null);
            } catch (Exception error) {
                plugin.getLogger().log(Level.WARNING, "Moderation queue #" + action.id() + " failed", error);
                apiClient.ackModQueue(action.id(), false, error.getMessage());
            }
        }
    }
}
