package ru.enterra.auth.manager;

import org.bukkit.Bukkit;
import org.bukkit.scheduler.BukkitRunnable;
import ru.enterra.auth.EnterraAuthPlugin;
import ru.enterra.auth.api.SiteApiClient;

import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;

/**
 * Syncs active LiteBans punishments to the website (reflection, no compile-time LiteBans dep).
 */
public final class PunishmentSyncTask extends BukkitRunnable {

    private final EnterraAuthPlugin plugin;
    private final SiteApiClient apiClient;
    private final AtomicBoolean running = new AtomicBoolean(false);

    public PunishmentSyncTask(EnterraAuthPlugin plugin) {
        this.plugin = plugin;
        this.apiClient = plugin.getApiClient();
    }

    @Override
    public void run() {
        if (Bukkit.getPluginManager().getPlugin("LiteBans") == null) {
            return;
        }
        if (!running.compareAndSet(false, true)) {
            return;
        }

        Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
            try {
                List<SiteApiClient.PunishmentSyncEntry> entries = collectActivePunishments();
                apiClient.syncPunishments(entries).whenComplete((ok, error) -> {
                    running.set(false);
                    if (error != null) {
                        plugin.getLogger().log(Level.WARNING, "Punishment sync failed", error);
                    }
                });
            } catch (Exception error) {
                running.set(false);
                plugin.getLogger().log(Level.WARNING, "Punishment collect failed", error);
            }
        });
    }

    private List<SiteApiClient.PunishmentSyncEntry> collectActivePunishments() throws Exception {
        List<SiteApiClient.PunishmentSyncEntry> result = new ArrayList<>();
        result.addAll(queryType("ban", "{bans}", "banned_by_name"));
        result.addAll(queryType("mute", "{mutes}", "banned_by_name"));
        result.addAll(queryType("warn", "{warnings}", "warned_by_name"));
        return result;
    }

    private List<SiteApiClient.PunishmentSyncEntry> queryType(
            String type,
            String tableToken,
            String staffColumn
    ) throws Exception {
        Class<?> databaseClass = Class.forName("litebans.api.Database");
        Object database = databaseClass.getMethod("get").invoke(null);
        int limit = Math.max(20, plugin.getConfig().getInt("moderation-sync.limit", 150));

        String query = "SELECT id, uuid, reason, " + staffColumn + " AS staff_name, until FROM "
                + tableToken + " WHERE active=1 ORDER BY id DESC LIMIT " + limit;

        List<SiteApiClient.PunishmentSyncEntry> rows = new ArrayList<>();

        try (AutoCloseable statementHolder = openStatement(databaseClass, database, query)) {
            Object statement = ((StatementHolder) statementHolder).statement();
            ResultSet rs = (ResultSet) statement.getClass().getMethod("executeQuery").invoke(statement);
            while (rs.next()) {
                long id = rs.getLong("id");
                String uuidText = rs.getString("uuid");
                String reason = rs.getString("reason");
                String staffName = rs.getString("staff_name");
                long until = rs.getLong("until");

                String username = resolveUsername(databaseClass, database, uuidText);
                if (username == null || username.isBlank()) {
                    continue;
                }

                String expiresAt = until > 0 ? String.valueOf(until) : null;
                rows.add(new SiteApiClient.PunishmentSyncEntry(
                        id,
                        type,
                        username,
                        uuidText,
                        reason,
                        staffName,
                        expiresAt
                ));
            }
        }

        return rows;
    }

    private static AutoCloseable openStatement(Class<?> databaseClass, Object database, String query)
            throws Exception {
        Object statement = databaseClass.getMethod("prepareStatement", String.class).invoke(database, query);
        return new StatementHolder(statement);
    }

    private static String resolveUsername(Class<?> databaseClass, Object database, String uuidText) {
        if (uuidText == null || uuidText.isBlank()) {
            return null;
        }
        try {
            UUID uuid = parseUuid(uuidText);
            String fromDb = (String) databaseClass.getMethod("getPlayerName", UUID.class).invoke(database, uuid);
            if (fromDb != null && !fromDb.isBlank()) {
                return fromDb;
            }
            return Bukkit.getOfflinePlayer(uuid).getName();
        } catch (Exception ignored) {
            return null;
        }
    }

    private static UUID parseUuid(String raw) {
        String normalized = raw.replace("-", "");
        if (normalized.length() == 32) {
            return UUID.fromString(
                    normalized.substring(0, 8) + "-"
                            + normalized.substring(8, 12) + "-"
                            + normalized.substring(12, 16) + "-"
                            + normalized.substring(16, 20) + "-"
                            + normalized.substring(20)
            );
        }
        return UUID.fromString(raw);
    }

    private record StatementHolder(Object statement) implements AutoCloseable {
        @Override
        public void close() throws Exception {
            if (statement != null) {
                statement.getClass().getMethod("close").invoke(statement);
            }
        }
    }
}
