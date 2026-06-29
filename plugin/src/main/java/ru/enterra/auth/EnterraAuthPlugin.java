package ru.enterra.auth;

import org.bukkit.plugin.java.JavaPlugin;

import java.util.logging.Level;

import ru.enterra.auth.api.SiteApiClient;
import ru.enterra.auth.command.CodeCommand;
import ru.enterra.auth.listener.CommandVisibilityListener;
import ru.enterra.auth.listener.JoinListener;
import ru.enterra.auth.listener.RestrictListener;
import ru.enterra.auth.command.PrivSyncCommand;
import ru.enterra.auth.manager.AutoSyncTask;
import ru.enterra.auth.manager.LuckPermsSync;
import ru.enterra.auth.manager.PendingAuthService;
import ru.enterra.auth.manager.SessionCheckTask;
import ru.enterra.auth.hook.PlaceholderApiHook;
import ru.enterra.auth.manager.LiteBansStaffHook;
import ru.enterra.auth.manager.ModerationQueueTask;
import ru.enterra.auth.manager.PunishmentSyncTask;
import ru.enterra.auth.manager.StaffProtectionService;
import ru.enterra.auth.manager.TabNameColorHook;
import ru.enterra.auth.manager.VerificationManager;
import ru.enterra.auth.manager.VioletNameFormatSync;
import ru.enterra.auth.listener.StaffProtectionListener;

public final class EnterraAuthPlugin extends JavaPlugin {

    private SiteApiClient apiClient;
    private VerificationManager verificationManager;
    private PendingAuthService pendingAuthService;
    private LuckPermsSync luckPermsSync;
    private AutoSyncTask autoSyncTask;
    private SessionCheckTask sessionCheckTask;
    private StaffProtectionService staffProtection;
    private ModerationQueueTask moderationQueueTask;
    private PunishmentSyncTask punishmentSyncTask;
    private TabNameColorHook tabNameColorHook;

    @Override
    public void onEnable() {
        saveDefaultConfig();

        apiClient = new SiteApiClient(this);
        verificationManager = new VerificationManager();
        pendingAuthService = new PendingAuthService(this);
        luckPermsSync = new LuckPermsSync(this);
        staffProtection = new StaffProtectionService(this);

        verificationManager.setOnPending(pendingAuthService::apply);
        verificationManager.setOnVerified(pendingAuthService::clear);
        verificationManager.setOnUnmark(pendingAuthService::clear);

        getServer().getPluginManager().registerEvents(new JoinListener(this), this);
        getServer().getPluginManager().registerEvents(new RestrictListener(this, verificationManager), this);
        getServer().getPluginManager().registerEvents(new CommandVisibilityListener(verificationManager), this);
        getServer().getPluginManager().registerEvents(new StaffProtectionListener(this, staffProtection), this);

        var codeCommand = getCommand("code");
        if (codeCommand != null) {
            var executor = new CodeCommand(this);
            codeCommand.setExecutor(executor);
            codeCommand.setTabCompleter(executor);
        } else {
            getLogger().severe("Command 'code' not found in plugin.yml");
        }

        var privSyncCommand = getCommand("privsync");
        if (privSyncCommand != null) {
            var executor = new PrivSyncCommand(this);
            privSyncCommand.setExecutor(executor);
            privSyncCommand.setTabCompleter(executor);
        } else {
            getLogger().severe("Command 'privsync' not found in plugin.yml");
        }

        startAutoSync();
        startSessionCheck();
        startModerationSync();
        try {
            new LiteBansStaffHook(this, staffProtection).register();
        } catch (Throwable error) {
            getLogger().log(Level.WARNING, "LiteBans hook skipped", error);
        }

        tabNameColorHook = new TabNameColorHook(this);
        VioletNameFormatSync.setTabHook(tabNameColorHook);
        tabNameColorHook.register();
        new PlaceholderApiHook(this).register();

        getLogger().info("EnterraAuth enabled. API: " + getConfig().getString("api-url"));
    }

    @Override
    public void onDisable() {
        if (autoSyncTask != null) {
            autoSyncTask.cancel();
            autoSyncTask = null;
        }
        if (sessionCheckTask != null) {
            sessionCheckTask.cancel();
            sessionCheckTask = null;
        }
        if (moderationQueueTask != null) {
            moderationQueueTask.cancel();
            moderationQueueTask = null;
        }
        if (punishmentSyncTask != null) {
            punishmentSyncTask.cancel();
            punishmentSyncTask = null;
        }
        pendingAuthService.clearAll();
        verificationManager.clear();
    }

    private void startAutoSync() {
        if (!getConfig().getBoolean("auto-sync.enabled", true)) {
            return;
        }

        long intervalSeconds = Math.max(20L, getConfig().getLong("auto-sync.interval-seconds", 45L));
        autoSyncTask = new AutoSyncTask(this);
        autoSyncTask.runTaskTimer(this, intervalSeconds * 20L, intervalSeconds * 20L);
        getLogger().info("Auto privilege sync every " + intervalSeconds + "s");
    }

    private void startSessionCheck() {
        if (!getConfig().getBoolean("session-check.enabled", true)) {
            return;
        }

        long intervalSeconds = Math.max(15L, getConfig().getLong("session-check.interval-seconds", 30L));
        sessionCheckTask = new SessionCheckTask(this);
        sessionCheckTask.runTaskTimer(this, intervalSeconds * 20L, intervalSeconds * 20L);
        getLogger().info("Session check every " + intervalSeconds + "s");
    }

    private void startModerationSync() {
        if (!getConfig().getBoolean("moderation-sync.enabled", true)) {
            return;
        }

        long queueSeconds = Math.max(3L, getConfig().getLong("moderation-sync.queue-interval-seconds", 5L));
        long punishSeconds = Math.max(15L, getConfig().getLong("moderation-sync.punishments-interval-seconds", 45L));

        moderationQueueTask = new ModerationQueueTask(this);
        punishmentSyncTask = new PunishmentSyncTask(this);
        moderationQueueTask.runTaskTimer(this, queueSeconds * 20L, queueSeconds * 20L);
        punishmentSyncTask.runTaskTimer(this, punishSeconds * 20L, punishSeconds * 20L);
        getLogger().info("Moderation queue every " + queueSeconds + "s, punishments sync every " + punishSeconds + "s");
    }

    public SiteApiClient getApiClient() {
        return apiClient;
    }

    public VerificationManager getVerificationManager() {
        return verificationManager;
    }

    public PendingAuthService getPendingAuthService() {
        return pendingAuthService;
    }

    public LuckPermsSync getLuckPermsSync() {
        return luckPermsSync;
    }

    public StaffProtectionService getStaffProtection() {
        return staffProtection;
    }

    public String msg(String path) {
        return colorize(getConfig().getString("messages." + path, ""));
    }

    public String msg(String path, String placeholder, String value) {
        return msg(path).replace(placeholder, value);
    }

    public static String colorize(String text) {
        if (text == null) {
            return "";
        }
        return text.replace('&', '\u00A7');
    }
}
