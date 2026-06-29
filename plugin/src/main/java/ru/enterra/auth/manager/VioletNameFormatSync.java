package ru.enterra.auth.manager;



import net.kyori.adventure.text.Component;

import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;

import org.bukkit.Bukkit;

import org.bukkit.configuration.ConfigurationSection;

import org.bukkit.entity.Player;

import org.bukkit.plugin.Plugin;

import ru.enterra.auth.api.CheckResponse;



public final class VioletNameFormatSync {



    private static TabNameColorHook tabHook;



    private VioletNameFormatSync() {

    }



    public static void setTabHook(TabNameColorHook hook) {

        tabHook = hook;

    }



    public static void apply(Player player, CheckResponse response) {

        if (!response.nameColorAllowed()) {

            resetPlayerName(player);

            return;

        }



        String color = response.nameColor();

        if (color == null || color.isBlank()) {

            resetPlayerName(player);

            return;

        }



        String formatted = NameColorFormatter.formatLegacy(color, player.getName());

        NameColorStore.set(player.getUniqueId(), color, formatted);



        Component component = LegacyComponentSerializer.legacySection().deserialize(formatted);

        player.displayName(component);

        player.playerListName(component);

        persistToVioletConfig(player, formatted);



        if (tabHook != null) {

            tabHook.apply(player, formatted);

        }

    }



    private static void resetPlayerName(Player player) {

        NameColorStore.clear(player.getUniqueId());

        Component plain = Component.text(player.getName());

        player.displayName(plain);

        player.playerListName(plain);

        clearVioletConfig(player);

        if (tabHook != null) {

            tabHook.reset(player);

        }

    }



    private static Plugin violetPlugin() {

        Plugin plugin = Bukkit.getPluginManager().getPlugin("Violet-NameFormat");

        if (plugin != null && plugin.isEnabled()) {

            return plugin;

        }

        for (Plugin candidate : Bukkit.getPluginManager().getPlugins()) {

            if (candidate.getName().toLowerCase().contains("violet")

                    && candidate.getName().toLowerCase().contains("name")) {

                return candidate.isEnabled() ? candidate : null;

            }

        }

        return null;

    }



    private static void persistToVioletConfig(Player player, String formatted) {

        Plugin plugin = violetPlugin();

        if (plugin == null) {

            return;

        }



        var config = plugin.getConfig();

        ConfigurationSection section = config.getConfigurationSection("Players");

        if (section == null) {

            section = config.createSection("Players");

        }

        section.set(player.getName(), formatted.replace('\u00A7', '&'));

        plugin.saveConfig();

    }



    private static void clearVioletConfig(Player player) {

        Plugin plugin = violetPlugin();

        if (plugin == null) {

            return;

        }



        ConfigurationSection section = plugin.getConfig().getConfigurationSection("Players");

        if (section == null) {

            return;

        }

        section.set(player.getName(), null);

        plugin.saveConfig();

    }

}


