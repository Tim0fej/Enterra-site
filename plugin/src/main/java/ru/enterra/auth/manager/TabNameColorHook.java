package ru.enterra.auth.manager;

import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import ru.enterra.auth.EnterraAuthPlugin;

import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.UUID;
import java.util.function.Function;
import java.util.logging.Level;

/**
 * Applies site name colors via TAB API (reflection — no compile-time TAB dependency).
 */
public final class TabNameColorHook {

    private final EnterraAuthPlugin plugin;

    public TabNameColorHook(EnterraAuthPlugin plugin) {
        this.plugin = plugin;
    }

    public void register() {
        if (Bukkit.getPluginManager().getPlugin("TAB") == null) {
            plugin.getLogger().info("TAB not installed — tab name color hook skipped");
            return;
        }

        Bukkit.getScheduler().runTask(plugin, () -> {
            try {
                registerEventHandlers();
                registerTabPlaceholder();
                reapplyAllOnline();
                plugin.getLogger().info("TAB name color hook enabled");
            } catch (ClassNotFoundException error) {
                plugin.getLogger().info("TAB API not available — tab name color hook skipped");
            } catch (Throwable error) {
                plugin.getLogger().log(Level.WARNING, "Failed to hook TAB name colors", error);
            }
        });
    }

    public void apply(Player player, String legacyColoredName) {
        if (player == null) {
            return;
        }
        applyToUuid(player.getUniqueId(), legacyColoredName);
    }

    public void reset(Player player) {
        apply(player, null);
    }

    private void registerEventHandlers() throws Exception {
        Class<?> tabApiClass = Class.forName("me.neznamy.tab.api.TabAPI");
        Object tabApi = tabApiClass.getMethod("getInstance").invoke(null);
        Object eventBus = tabApiClass.getMethod("getEventBus").invoke(tabApi);
        if (eventBus == null) {
            return;
        }

        Class<?> handlerClass = Class.forName("me.neznamy.tab.api.event.TabEventHandler");
        registerHandler(eventBus, handlerClass, "me.neznamy.tab.api.event.player.PlayerLoadEvent");
        registerHandler(eventBus, handlerClass, "me.neznamy.tab.api.event.plugin.TabLoadEvent");
    }

    private void registerTabPlaceholder() throws Exception {
        Class<?> tabApiClass = Class.forName("me.neznamy.tab.api.TabAPI");
        Object tabApi = tabApiClass.getMethod("getInstance").invoke(null);
        Object placeholderManager = tabApiClass.getMethod("getPlaceholderManager").invoke(tabApi);
        Class<?> tabPlayerClass = Class.forName("me.neznamy.tab.api.TabPlayer");

        Object function = Proxy.newProxyInstance(
                Function.class.getClassLoader(),
                new Class<?>[]{Function.class},
                (proxy, method, args) -> {
                    if ("apply".equals(method.getName()) && args != null && args.length == 1) {
                        Object tabPlayer = args[0];
                        UUID uuid = (UUID) tabPlayerClass.getMethod("getUniqueId").invoke(tabPlayer);
                        String legacy = NameColorStore.getLegacy(uuid);
                        if (legacy == null) {
                            return tabPlayerClass.getMethod("getName").invoke(tabPlayer);
                        }
                        return legacy.replace('\u00A7', '&');
                    }
                    if ("toString".equals(method.getName())) {
                        return "EnterraColoredNameFunction";
                    }
                    if ("hashCode".equals(method.getName())) {
                        return System.identityHashCode(proxy);
                    }
                    if ("equals".equals(method.getName())) {
                        return proxy == args[0];
                    }
                    return null;
                }
        );

        Method register = placeholderManager.getClass().getMethod(
                "registerPlayerPlaceholder",
                String.class,
                int.class,
                Function.class
        );
        register.invoke(placeholderManager, "%enterra_colored_name%", 500, function);
    }

    private void registerHandler(Object eventBus, Class<?> handlerClass, String eventClassName) throws Exception {
        Class<?> eventClass = Class.forName(eventClassName);
        Object handler = Proxy.newProxyInstance(
                handlerClass.getClassLoader(),
                new Class<?>[]{handlerClass},
                (proxy, method, args) -> {
                    if (!"handle".equals(method.getName()) || args == null || args.length != 1) {
                        return null;
                    }
                    if (eventClassName.endsWith("PlayerLoadEvent")) {
                        handlePlayerLoad(args[0]);
                    } else {
                        reapplyAllOnline();
                    }
                    return null;
                }
        );
        eventBus.getClass().getMethod("register", Class.class, handlerClass).invoke(eventBus, eventClass, handler);
    }

    private void handlePlayerLoad(Object event) {
        try {
            Object tabPlayer = event.getClass().getMethod("getPlayer").invoke(event);
            UUID uuid = (UUID) tabPlayer.getClass().getMethod("getUniqueId").invoke(tabPlayer);
            String colored = NameColorStore.getLegacy(uuid);
            setTabName(tabPlayer, colored != null ? colored.replace('\u00A7', '&') : null);
        } catch (Exception error) {
            plugin.getLogger().log(Level.FINE, "TAB PlayerLoadEvent handler failed", error);
        }
    }

    private void reapplyAllOnline() {
        Bukkit.getScheduler().runTaskLater(plugin, () -> {
            for (Player player : Bukkit.getOnlinePlayers()) {
                String colored = NameColorStore.getLegacy(player.getUniqueId());
                if (colored != null) {
                    applyToUuid(player.getUniqueId(), colored);
                }
            }
        }, 5L);
    }

    private void applyToUuid(UUID uuid, String legacyColoredName) {
        Bukkit.getScheduler().runTask(plugin, () -> {
            try {
                Class<?> tabApiClass = Class.forName("me.neznamy.tab.api.TabAPI");
                Object tabApi = tabApiClass.getMethod("getInstance").invoke(null);
                Object tabPlayer = tabApiClass.getMethod("getPlayer", UUID.class).invoke(tabApi, uuid);
                if (tabPlayer == null) {
                    scheduleRetry(uuid, legacyColoredName, 1);
                    return;
                }
                String tabValue = legacyColoredName != null ? legacyColoredName.replace('\u00A7', '&') : null;
                setTabName(tabPlayer, tabValue);
            } catch (Exception error) {
                plugin.getLogger().log(Level.FINE, "TAB name color apply failed for " + uuid, error);
            }
        });
    }

    private void scheduleRetry(UUID uuid, String legacyColoredName, int attempt) {
        if (attempt > 5) {
            return;
        }
        Bukkit.getScheduler().runTaskLater(plugin, () -> {
            try {
                Class<?> tabApiClass = Class.forName("me.neznamy.tab.api.TabAPI");
                Object tabApi = tabApiClass.getMethod("getInstance").invoke(null);
                Object tabPlayer = tabApiClass.getMethod("getPlayer", UUID.class).invoke(tabApi, uuid);
                if (tabPlayer == null) {
                    scheduleRetry(uuid, legacyColoredName, attempt + 1);
                    return;
                }
                String tabValue = legacyColoredName != null ? legacyColoredName.replace('\u00A7', '&') : null;
                setTabName(tabPlayer, tabValue);
            } catch (Exception ignored) {
                scheduleRetry(uuid, legacyColoredName, attempt + 1);
            }
        }, 20L * attempt);
    }

    private void setTabName(Object tabPlayer, String legacyColoredName) throws Exception {
        Class<?> tabApiClass = Class.forName("me.neznamy.tab.api.TabAPI");
        Object tabApi = tabApiClass.getMethod("getInstance").invoke(null);
        Object formatManager = tabApiClass.getMethod("getTabListFormatManager").invoke(tabApi);
        if (formatManager == null) {
            return;
        }

        Class<?> tabPlayerClass = Class.forName("me.neznamy.tab.api.TabPlayer");
        Method setName = formatManager.getClass().getMethod("setName", tabPlayerClass, String.class);
        setName.invoke(formatManager, tabPlayer, legacyColoredName);
    }
}
