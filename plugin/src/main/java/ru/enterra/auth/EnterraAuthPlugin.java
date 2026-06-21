package ru.enterra.auth;

import org.bukkit.plugin.java.JavaPlugin;
import ru.enterra.auth.api.SiteApiClient;
import ru.enterra.auth.command.CodeCommand;
import ru.enterra.auth.listener.JoinListener;
import ru.enterra.auth.listener.RestrictListener;
import ru.enterra.auth.command.PrivSyncCommand;
import ru.enterra.auth.manager.AutoSyncTask;
import ru.enterra.auth.manager.LuckPermsSync;
import ru.enterra.auth.manager.PlayerSyncHelper;
import ru.enterra.auth.manager.VerificationManager;

public final class EnterraAuthPlugin extends JavaPlugin {

    private SiteApiClient apiClient;
    private VerificationManager verificationManager;
    private LuckPermsSync luckPermsSync;
    private AutoSyncTask autoSyncTask;

    @Override
    public void onEnable() {
        saveDefaultConfig();

        apiClient = new SiteApiClient(this);
        verificationManager = new VerificationManager();
        luckPermsSync = new LuckPermsSync(this);

        getServer().getPluginManager().registerEvents(new JoinListener(this), this);
        getServer().getPluginManager().registerEvents(new RestrictListener(verificationManager), this);

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

        getLogger().info("EnterraAuth enabled. API: " + getConfig().getString("api-url"));
    }

    @Override
    public void onDisable() {
        if (autoSyncTask != null) {
            autoSyncTask.cancel();
            autoSyncTask = null;
        }
        verificationManager.clear();
    }

    private void startAutoSync() {
        if (!getConfig().getBoolean("auto-sync.enabled", true)) {
            return;
        }

        long intervalSeconds = Math.max(15L, getConfig().getLong("auto-sync.interval-seconds", 30L));
        autoSyncTask = new AutoSyncTask(this);
        autoSyncTask.runTaskTimer(this, intervalSeconds * 20L, intervalSeconds * 20L);
        getLogger().info("Auto privilege sync every " + intervalSeconds + "s");
    }

    public SiteApiClient getApiClient() {
        return apiClient;
    }

    public VerificationManager getVerificationManager() {
        return verificationManager;
    }

    public LuckPermsSync getLuckPermsSync() {
        return luckPermsSync;
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
