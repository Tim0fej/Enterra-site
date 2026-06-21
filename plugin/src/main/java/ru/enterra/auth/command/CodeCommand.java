package ru.enterra.auth.command;

import net.kyori.adventure.text.Component;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import ru.enterra.auth.EnterraAuthPlugin;
import ru.enterra.auth.manager.PlayerSyncHelper;

import java.util.Collections;
import java.util.List;

public final class CodeCommand implements CommandExecutor, TabCompleter {

    private final EnterraAuthPlugin plugin;

    public CodeCommand(EnterraAuthPlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(
            @NotNull CommandSender sender,
            @NotNull Command command,
            @NotNull String label,
            @NotNull String[] args
    ) {
        if (!(sender instanceof Player player)) {
            sender.sendMessage("Команда только для игроков.");
            return true;
        }

        if (args.length != 1) {
            player.sendMessage(Component.text(plugin.msg("code-usage")));
            return true;
        }

        if (plugin.getVerificationManager().isVerified(player)) {
            player.sendMessage(Component.text(plugin.msg("verified-welcome")));
            return true;
        }

        String code = args[0].trim();
        player.sendMessage(Component.text(plugin.msg("code-checking")));

        plugin.getApiClient().verifyCode(player.getName(), code).whenComplete((response, error) -> {
            plugin.getServer().getScheduler().runTask(plugin, () -> {
                if (!player.isOnline()) {
                    return;
                }

                if (error != null) {
                    plugin.getLogger().warning("Verify failed for " + player.getName() + ": " + error.getMessage());
                    player.sendMessage(Component.text(plugin.msg("api-error")));
                    return;
                }

                if (response.valid()) {
                    plugin.getVerificationManager().markVerified(player);
                    player.sendMessage(Component.text(plugin.msg("code-success")));
                    PlayerSyncHelper.syncFromSite(plugin, player, false);
                } else {
                    player.sendMessage(Component.text(plugin.msg("code-invalid")));
                }
            });
        });

        return true;
    }

    @Override
    public @Nullable List<String> onTabComplete(
            @NotNull CommandSender sender,
            @NotNull Command command,
            @NotNull String alias,
            @NotNull String[] args
    ) {
        return Collections.emptyList();
    }
}
