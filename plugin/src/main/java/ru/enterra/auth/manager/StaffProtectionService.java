package ru.enterra.auth.manager;

import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import net.luckperms.api.LuckPermsProvider;
import net.luckperms.api.model.user.User;
import net.luckperms.api.node.NodeType;
import net.luckperms.api.node.types.InheritanceNode;
import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;
import org.bukkit.command.CommandSender;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;
import ru.enterra.auth.EnterraAuthPlugin;
import ru.enterra.auth.api.CheckResponse;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;

public final class StaffProtectionService {

    private static final String BYPASS_PERMISSION = "enterra.staffprotection.bypass";

    private final EnterraAuthPlugin plugin;
    private final Set<String> protectedGroups = new HashSet<>();
    private final Set<String> protectedSiteRoles = new HashSet<>();
    private final Set<String> moderationCommands = new HashSet<>();
    private final ConcurrentHashMap<UUID, String> siteRoleByUuid = new ConcurrentHashMap<>();

    public StaffProtectionService(EnterraAuthPlugin plugin) {
        this.plugin = plugin;
        reload();
    }

    public void reload() {
        protectedGroups.clear();
        protectedSiteRoles.clear();
        moderationCommands.clear();

        ConfigurationSection section = plugin.getConfig().getConfigurationSection("staff-protection");
        if (section == null) {
            protectedGroups.addAll(Set.of("admin", "dev", "moder"));
            protectedSiteRoles.addAll(Set.of("admin", "moderator"));
            moderationCommands.addAll(Set.of(
                    "ban", "tempban", "ipban", "unban",
                    "kick", "mute", "tempmute", "unmute", "warn", "punish"
            ));
            return;
        }

        protectedGroups.addAll(normalizeList(section.getStringList("groups")));
        protectedSiteRoles.addAll(normalizeList(section.getStringList("site-roles")));
        moderationCommands.addAll(normalizeList(section.getStringList("moderation-commands")));

        if (protectedGroups.isEmpty()) {
            protectedGroups.addAll(Set.of("admin", "dev", "moder"));
        }
        if (protectedSiteRoles.isEmpty()) {
            protectedSiteRoles.addAll(Set.of("admin", "moderator"));
        }
        if (moderationCommands.isEmpty()) {
            moderationCommands.addAll(Set.of(
                    "ban", "tempban", "ipban", "kick", "mute", "tempmute", "warn", "punish"
            ));
        }
    }

    public boolean isEnabled() {
        return plugin.getConfig().getBoolean("staff-protection.enabled", true);
    }

    public void rememberSiteRole(Player player, CheckResponse response) {
        if (response == null || response.role() == null || response.role().isBlank()) {
            siteRoleByUuid.remove(player.getUniqueId());
            return;
        }
        siteRoleByUuid.put(player.getUniqueId(), response.role().toLowerCase(Locale.ROOT));
    }

    public void forget(Player player) {
        siteRoleByUuid.remove(player.getUniqueId());
    }

    public boolean canBypass(org.bukkit.command.CommandSender sender) {
        if (sender == null || !sender.hasPermission(BYPASS_PERMISSION)) {
            return false;
        }
        return plugin.getConfig().getBoolean("staff-protection.allow-bypass-punish", false);
    }

    public boolean shouldBlockPunishment(org.bukkit.command.CommandSender sender, String targetName) {
        if (!isEnabled() || targetName == null || targetName.isBlank()) {
            return false;
        }
        if (!isProtectedByName(targetName)) {
            return false;
        }
        return !canBypass(sender);
    }

    public boolean isProtected(Player player) {
        if (!isEnabled() || player == null) {
            return false;
        }
        return isProtected(player.getUniqueId(), player.getName(), siteRoleByUuid.get(player.getUniqueId()));
    }

    public boolean isProtected(OfflinePlayer player) {
        if (!isEnabled() || player == null) {
            return false;
        }
        String cachedRole = player.isOnline() && player.getPlayer() != null
                ? siteRoleByUuid.get(player.getUniqueId())
                : null;
        return isProtected(player.getUniqueId(), player.getName(), cachedRole);
    }

    public boolean isProtectedByName(String name) {
        if (!isEnabled() || name == null || name.isBlank()) {
            return false;
        }

        Player online = plugin.getServer().getPlayerExact(name);
        if (online != null) {
            return isProtected(online);
        }

        OfflinePlayer offline = plugin.getServer().getOfflinePlayer(name);
        return isProtected(offline);
    }

    public boolean isModerationCommand(String commandLabel) {
        if (commandLabel == null || commandLabel.isBlank()) {
            return false;
        }
        String normalized = commandLabel.toLowerCase(Locale.ROOT);
        int colon = normalized.indexOf(':');
        if (colon >= 0) {
            normalized = normalized.substring(colon + 1);
        }
        return moderationCommands.contains(normalized);
    }

    public String msg(String path) {
        return plugin.msg("staff-protection." + path);
    }

    public void sendBlocked(CommandSender sender) {
        if (sender == null) {
            return;
        }
        sender.sendMessage(LegacyComponentSerializer.legacySection().deserialize(msg("blocked")));
    }

    public void sendBlockedRevert(CommandSender sender) {
        if (sender == null) {
            return;
        }
        String message = msg("reverted");
        if (message.isBlank()) {
            message = msg("blocked");
        }
        sender.sendMessage(LegacyComponentSerializer.legacySection().deserialize(message));
    }

    public CommandSender resolveExecutor(String executorName) {
        if (executorName == null || executorName.isBlank()) {
            return null;
        }
        if ("console".equalsIgnoreCase(executorName)) {
            return Bukkit.getConsoleSender();
        }

        Player online = plugin.getServer().getPlayerExact(executorName);
        if (online != null) {
            return online;
        }

        return null;
    }

    private boolean isProtected(UUID uuid, String name, String cachedSiteRole) {
        if (cachedSiteRole != null && protectedSiteRoles.contains(cachedSiteRole.toLowerCase(Locale.ROOT))) {
            return true;
        }

        if (cachedSiteRole == null && name != null && !name.isBlank()) {
            String roleFromSite = fetchSiteRole(name);
            if (roleFromSite != null && protectedSiteRoles.contains(roleFromSite)) {
                siteRoleByUuid.put(uuid, roleFromSite);
                return true;
            }
        }

        return hasProtectedLuckPermsGroup(uuid);
    }

    private String fetchSiteRole(String username) {
        try {
            CheckResponse response = plugin.getApiClient().checkPlayer(username).join();
            if (response.role() == null || response.role().isBlank()) {
                return null;
            }
            return response.role().toLowerCase(Locale.ROOT);
        } catch (Exception error) {
            plugin.getLogger().log(Level.FINE, "Site role lookup failed for " + username, error);
            return null;
        }
    }

    private boolean hasProtectedLuckPermsGroup(UUID uuid) {
        if (!plugin.getConfig().getBoolean("luckperms.enabled", true)) {
            return false;
        }

        try {
            var luckPerms = LuckPermsProvider.get();
            User user = luckPerms.getUserManager().loadUser(uuid).join();
            if (user == null) {
                return false;
            }

            for (InheritanceNode inheritance : user.getNodes(NodeType.INHERITANCE)) {
                if (protectedGroups.contains(inheritance.getGroupName().toLowerCase(Locale.ROOT))) {
                    return true;
                }
            }

            String primary = user.getPrimaryGroup().toLowerCase(Locale.ROOT);
            return protectedGroups.contains(primary);
        } catch (IllegalStateException ex) {
            return false;
        } catch (Exception error) {
            plugin.getLogger().log(Level.FINE, "LuckPerms staff check failed for " + uuid, error);
            return false;
        }
    }

    private static Set<String> normalizeList(List<String> values) {
        Set<String> normalized = new HashSet<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                normalized.add(value.trim().toLowerCase(Locale.ROOT));
            }
        }
        return normalized;
    }
}
