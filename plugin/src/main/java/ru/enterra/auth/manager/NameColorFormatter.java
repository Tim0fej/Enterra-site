package ru.enterra.auth.manager;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class NameColorFormatter {

    private static final Pattern HEX_PATTERN = Pattern.compile("#[a-fA-F0-9]{6}");

    private static final Map<Character, String> LEGACY_COLORS = Map.ofEntries(
            Map.entry('0', "black"),
            Map.entry('1', "dark_blue"),
            Map.entry('2', "dark_green"),
            Map.entry('3', "dark_aqua"),
            Map.entry('4', "dark_red"),
            Map.entry('5', "dark_purple"),
            Map.entry('6', "gold"),
            Map.entry('7', "gray"),
            Map.entry('8', "dark_gray"),
            Map.entry('9', "blue"),
            Map.entry('a', "green"),
            Map.entry('b', "aqua"),
            Map.entry('c', "red"),
            Map.entry('d', "light_purple"),
            Map.entry('e', "yellow"),
            Map.entry('f', "white")
    );

    private NameColorFormatter() {
    }

    public static String formatLegacy(String color, String playerName) {
        if (color == null || color.isBlank() || playerName == null || playerName.isBlank()) {
            return playerName != null ? playerName : "";
        }
        return hexTranslate(color.replace('&', '\u00A7')) + playerName;
    }

    public static String formatMiniMessage(String color, String playerName) {
        if (playerName == null || playerName.isBlank()) {
            return "";
        }
        if (color == null || color.isBlank()) {
            return escapeMiniMessage(playerName);
        }
        return legacyToMiniMessage(formatLegacy(color, playerName));
    }

    public static String legacyToMiniMessage(String legacyText) {
        if (legacyText == null || legacyText.isBlank()) {
            return "";
        }

        String normalized = legacyText.replace('&', '\u00A7');
        StringBuilder openTags = new StringBuilder();
        StringBuilder closeTags = new StringBuilder();
        StringBuilder visible = new StringBuilder();

        for (int index = 0; index < normalized.length(); index++) {
            char current = normalized.charAt(index);
            if (current != '\u00A7' || index + 1 >= normalized.length()) {
                visible.append(escapeMiniMessageChar(current));
                continue;
            }

            char code = Character.toLowerCase(normalized.charAt(++index));
            if (code == 'x' && index + 12 <= normalized.length()) {
                StringBuilder hex = new StringBuilder();
                int cursor = index + 1;
                while (cursor + 1 < normalized.length() && normalized.charAt(cursor) == '\u00A7') {
                    hex.append(normalized.charAt(cursor + 1));
                    cursor += 2;
                }
                if (hex.length() == 6) {
                    index = cursor - 1;
                    resetMiniMessageTags(openTags, closeTags);
                    appendMiniMessageTag(openTags, closeTags, "<#" + hex + ">");
                    continue;
                }
            }

            switch (code) {
                case 'r' -> resetMiniMessageTags(openTags, closeTags);
                case 'l' -> appendMiniMessageTag(openTags, closeTags, "<bold>");
                case 'o' -> appendMiniMessageTag(openTags, closeTags, "<italic>");
                case 'n' -> appendMiniMessageTag(openTags, closeTags, "<underlined>");
                case 'm' -> appendMiniMessageTag(openTags, closeTags, "<strikethrough>");
                case 'k' -> appendMiniMessageTag(openTags, closeTags, "<obfuscated>");
                default -> {
                    String colorTag = LEGACY_COLORS.get(code);
                    if (colorTag != null) {
                        resetMiniMessageTags(openTags, closeTags);
                        appendMiniMessageTag(openTags, closeTags, "<" + colorTag + ">");
                    } else {
                        visible.append(escapeMiniMessageChar(current));
                    }
                }
            }
        }

        return openTags.toString() + visible + closeTags;
    }

    private static void resetMiniMessageTags(StringBuilder openTags, StringBuilder closeTags) {
        openTags.setLength(0);
        closeTags.setLength(0);
    }

    private static void appendMiniMessageTag(StringBuilder openTags, StringBuilder closeTags, String tag) {
        openTags.append(tag);
        if (tag.startsWith("<#") && tag.endsWith(">")) {
            closeTags.insert(0, "</" + tag.substring(1));
            return;
        }
        if (tag.startsWith("<") && tag.endsWith(">")) {
            closeTags.insert(0, "</" + tag.substring(1, tag.length() - 1) + ">");
        }
    }

    private static String escapeMiniMessage(String text) {
        StringBuilder builder = new StringBuilder(text.length());
        for (char character : text.toCharArray()) {
            builder.append(escapeMiniMessageChar(character));
        }
        return builder.toString();
    }

    private static String escapeMiniMessageChar(char character) {
        return switch (character) {
            case '<' -> "\\<";
            case '>' -> "\\>";
            case '\\' -> "\\\\";
            default -> String.valueOf(character);
        };
    }

    private static String hexTranslate(String text) {
        Matcher matcher = HEX_PATTERN.matcher(text);
        StringBuffer buffer = new StringBuffer();
        while (matcher.find()) {
            String hex = matcher.group().substring(1);
            StringBuilder replacement = new StringBuilder("\u00A7x");
            for (char c : hex.toCharArray()) {
                replacement.append('\u00A7').append(c);
            }
            matcher.appendReplacement(buffer, Matcher.quoteReplacement(replacement.toString()));
        }
        matcher.appendTail(buffer);
        return buffer.toString();
    }
}
