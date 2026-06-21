package ru.enterra.auth.manager;

import net.luckperms.api.LuckPermsProvider;
import net.luckperms.api.model.user.User;
import net.luckperms.api.node.Node;
import net.luckperms.api.node.types.InheritanceNode;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;
import ru.enterra.auth.EnterraAuthPlugin;
import ru.enterra.auth.api.CheckResponse;

import java.util.Locale;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Level;

public final class LuckPermsSync {

    private final EnterraAuthPlugin plugin;

    public LuckPermsSync(EnterraAuthPlugin plugin) {
        this.plugin = plugin;
    }

    public CompletableFuture<String> sync(Player player, CheckResponse response) {
        return syncInternal(player, response, false);
    }

    public CompletableFuture<String> syncIfChanged(Player player, CheckResponse response) {
        return syncInternal(player, response, true);
    }

    private CompletableFuture<String> syncInternal(Player player, CheckResponse response, boolean onlyIfChanged) {
        if (!plugin.getConfig().getBoolean("luckperms.enabled", true)) {
            return CompletableFuture.completedFuture(null);
        }

        if (!isAvailable()) {
            plugin.getLogger().warning("LuckPerms not found — privilege sync skipped for " + player.getName());
            return CompletableFuture.completedFuture(null);
        }

        String targetGroup = resolveTargetGroup(response);
        if (targetGroup == null || targetGroup.isBlank()) {
            return CompletableFuture.completedFuture(null);
        }

        return applyGroup(player, targetGroup.toLowerCase(Locale.ROOT), onlyIfChanged);
    }

    private CompletableFuture<String> applyGroup(Player player, String targetGroup, boolean onlyIfChanged) {
        CompletableFuture<String> future = new CompletableFuture<>();

        plugin.getServer().getScheduler().runTask(plugin, () -> {
            if (!player.isOnline()) {
                future.complete(null);
                return;
            }

            try {
                var luckPerms = LuckPermsProvider.get();
                var userManager = luckPerms.getUserManager();
                User user = userManager.loadUser(player.getUniqueId()).join();

                if (onlyIfChanged && !needsUpdate(user, targetGroup)) {
                    future.complete(null);
                    return;
                }

                setSingleParent(user, targetGroup);
                userManager.saveUser(user).join();

                plugin.getLogger().info("LuckPerms sync: " + player.getName() + " -> " + targetGroup);
                future.complete(targetGroup);
            } catch (Exception error) {
                plugin.getLogger().log(
                        Level.WARNING,
                        "LuckPerms sync failed for " + player.getName(),
                        error
                );
                future.complete(null);
            }
        });

        return future;
    }

    private static boolean needsUpdate(User user, String targetGroup) {
        String expected = targetGroup.toLowerCase(Locale.ROOT);
        var parents = user.getNodes().stream()
                .filter(InheritanceNode.class::isInstance)
                .map(node -> ((InheritanceNode) node).getGroupName().toLowerCase(Locale.ROOT))
                .toList();

        return !(parents.size() == 1 && parents.get(0).equals(expected));
    }

    private static void setSingleParent(User user, String targetGroup) {
        for (Node node : user.getNodes()) {
            if (node instanceof InheritanceNode) {
                user.data().remove(node);
            }
        }

        user.data().add(InheritanceNode.builder(targetGroup).build());
    }

    String resolveTargetGroup(CheckResponse response) {
        if (response.luckPermsGroup() != null && !response.luckPermsGroup().isBlank()) {
            return response.luckPermsGroup();
        }

        String privilege = response.privilegeSlug();
        if (privilege != null && !privilege.isBlank()) {
            ConfigurationSection privilegeGroups = plugin.getConfig().getConfigurationSection("luckperms.privilege-groups");
            if (privilegeGroups != null) {
                String mapped = privilegeGroups.getString(privilege.toLowerCase(Locale.ROOT));
                if (mapped != null && !mapped.isBlank()) {
                    return mapped;
                }
            }
        }

        String role = response.role();
        if (role != null && !role.isBlank()) {
            ConfigurationSection roleGroups = plugin.getConfig().getConfigurationSection("luckperms.role-groups");
            if (roleGroups != null) {
                String mapped = roleGroups.getString(role.toLowerCase(Locale.ROOT));
                if (mapped != null && !mapped.isBlank()) {
                    return mapped;
                }
            }
        }

        return plugin.getConfig().getString("luckperms.default-group", "default");
    }

    private static boolean isAvailable() {
        try {
            LuckPermsProvider.get();
            return true;
        } catch (IllegalStateException ex) {
            return false;
        }
    }
}
