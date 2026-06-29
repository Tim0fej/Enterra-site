package ru.enterra.auth.manager;

import org.bukkit.Bukkit;
import org.bukkit.command.CommandSender;
import ru.enterra.auth.EnterraAuthPlugin;

import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.PreparedStatement;
import java.util.Locale;
import java.util.UUID;
import java.util.logging.Level;

/**
 * Optional LiteBans hook via reflection — no compile-time API dependency at class load.
 */
public final class LiteBansStaffHook {

    private static final String REVERT_ACTOR = "EnterraAuth";
    private static final String REVERT_REASON = "Staff protection";

    private final EnterraAuthPlugin plugin;
    private final StaffProtectionService staffProtection;

    public LiteBansStaffHook(EnterraAuthPlugin plugin, StaffProtectionService staffProtection) {
        this.plugin = plugin;
        this.staffProtection = staffProtection;
    }

    public void register() {
        if (!staffProtection.isEnabled()) {
            return;
        }
        if (Bukkit.getPluginManager().getPlugin("LiteBans") == null) {
            plugin.getLogger().info("LiteBans not installed — staff punishment hook skipped");
            return;
        }

        Bukkit.getScheduler().runTask(plugin, () -> {
            try {
                Class<?> listenerClass = Class.forName("litebans.api.Events$Listener");
                Object listener = Proxy.newProxyInstance(
                        listenerClass.getClassLoader(),
                        new Class<?>[]{listenerClass},
                        (proxy, method, args) -> {
                            if ("entryAdded".equals(method.getName()) && args != null && args.length == 1) {
                                handleEntryAdded(args[0]);
                            }
                            return null;
                        }
                );

                Class<?> eventsClass = Class.forName("litebans.api.Events");
                Object events = eventsClass.getMethod("get").invoke(null);
                eventsClass.getMethod("register", listenerClass).invoke(events, listener);
                plugin.getLogger().info("LiteBans staff protection hook enabled");
            } catch (ClassNotFoundException error) {
                plugin.getLogger().info("LiteBans Events API not available — staff punishment hook skipped");
            } catch (Throwable error) {
                plugin.getLogger().log(Level.WARNING, "Failed to hook LiteBans staff protection", error);
            }
        });
    }

    private void handleEntryAdded(Object entry) {
        if (entry == null || !staffProtection.isEnabled()) {
            return;
        }

        try {
            String type = invokeString(entry, "getType");
            if (type == null) {
                return;
            }

            String normalizedType = type.toLowerCase(Locale.ROOT);
            if (!normalizedType.equals("ban")
                    && !normalizedType.equals("mute")
                    && !normalizedType.equals("warn")
                    && !normalizedType.equals("kick")) {
                return;
            }

            String targetName = readTargetName(entry);
            if (targetName == null || !staffProtection.isProtectedByName(targetName)) {
                return;
            }

            String executorName = invokeString(entry, "getExecutorName");
            long entryId = invokeLong(entry, "getId");
            String tableToken = tableTokenFor(normalizedType);

            plugin.getServer().getScheduler().runTask(plugin, () -> {
                CommandSender executor = staffProtection.resolveExecutor(executorName);
                if (executor != null && staffProtection.canBypass(executor)) {
                    return;
                }

                if (normalizedType.equals("kick")) {
                    notifyExecutorBlocked(executor);
                    return;
                }

                if (tableToken == null) {
                    return;
                }

                plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
                    try {
                        deactivateEntry(entryId, tableToken);
                        plugin.getLogger().info("Reverted LiteBans " + normalizedType + " for protected staff: " + targetName);
                        notifyExecutorBlocked(executor);
                    } catch (Exception error) {
                        plugin.getLogger().log(Level.WARNING,
                                "Could not revert LiteBans " + normalizedType + " for " + targetName, error);
                    }
                });
            });
        } catch (Exception error) {
            plugin.getLogger().log(Level.WARNING, "LiteBans entryAdded handler failed", error);
        }
    }

    private void notifyExecutorBlocked(CommandSender executor) {
        plugin.getServer().getScheduler().runTask(plugin, () -> {
            if (executor != null) {
                staffProtection.sendBlockedRevert(executor);
            }
        });
    }

    private void deactivateEntry(long entryId, String tableToken) throws Exception {
        Class<?> databaseClass = Class.forName("litebans.api.Database");
        Object database = databaseClass.getMethod("get").invoke(null);
        String query = "UPDATE " + tableToken + " SET active=0, removed_by_name=?, removal_reason=? WHERE id=? AND active=1";

        try (PreparedStatement statement = (PreparedStatement) databaseClass
                .getMethod("prepareStatement", String.class)
                .invoke(database, query)) {
            statement.setString(1, REVERT_ACTOR);
            statement.setString(2, REVERT_REASON);
            statement.setLong(3, entryId);
            statement.executeUpdate();
        }
    }

    private String readTargetName(Object entry) throws Exception {
        String uuidText = invokeString(entry, "getUuid");
        if (uuidText == null || uuidText.isBlank()) {
            return null;
        }

        try {
            UUID uuid = parseUuid(uuidText);
            Class<?> databaseClass = Class.forName("litebans.api.Database");
            Object database = databaseClass.getMethod("get").invoke(null);
            String fromDb = (String) databaseClass.getMethod("getPlayerName", UUID.class).invoke(database, uuid);
            if (fromDb != null && !fromDb.isBlank()) {
                return fromDb;
            }
            return Bukkit.getOfflinePlayer(uuid).getName();
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private static String invokeString(Object target, String methodName) throws Exception {
        Method method = target.getClass().getMethod(methodName);
        Object value = method.invoke(target);
        return value != null ? value.toString() : null;
    }

    private static long invokeLong(Object target, String methodName) throws Exception {
        Method method = target.getClass().getMethod(methodName);
        Object value = method.invoke(target);
        if (value instanceof Number number) {
            return number.longValue();
        }
        return 0L;
    }

    private static String tableTokenFor(String type) {
        return switch (type) {
            case "ban" -> "{bans}";
            case "mute" -> "{mutes}";
            case "warn" -> "{warnings}";
            default -> null;
        };
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
}
