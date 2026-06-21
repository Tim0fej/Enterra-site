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

public final class PrivSyncCommand implements CommandExecutor, TabCompleter {

    private final EnterraAuthPlugin plugin;

    public PrivSyncCommand(EnterraAuthPlugin plugin) {
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

        if (!plugin.getVerificationManager().isVerified(player)) {
            player.sendMessage(Component.text(plugin.msg("need-code").split("\n")[0]));
            return true;
        }

        player.sendMessage(Component.text(plugin.msg("sync-checking")));
        PlayerSyncHelper.syncFromSite(plugin, player, true);
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
