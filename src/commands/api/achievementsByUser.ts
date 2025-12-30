import { SlashCommandBuilder, EmbedBuilder, SlashCommandOptionsOnlyBuilder, ChatInputCommandInteraction, CacheType } from "discord.js";
import type { SlashCommand } from "../../types.js";
import {
    fetchAppDetails,
    fetchPlayerAchievements,
    type SteamAppDetails,
    type SteamAchievement,
} from "../../hooks/steam/index.js";

interface keysNeeded {
    apiKey: string;
    steamId: string;
    appId: number;
}

interface AchievementInfo {
    completed: string;
    total: string;
    percentage: string;
}

const commandBuilder = (): SlashCommandOptionsOnlyBuilder => {
    return new SlashCommandBuilder()
        .setName("achievements")
        .setDescription("Fetch Steam achievements for a user in a specific game")
        .addStringOption((option) =>
            option
                .setName("steamid")
                .setDescription("The 64-bit SteamID of the user")
                .setRequired(true),
        )
        .addIntegerOption((option) =>
            option
                .setName("appid")
                .setDescription("The AppID of the Steam game")
                .setRequired(true),
        );
}


const validateSteamApiKey = async (apiKey: string | undefined, interaction: ChatInputCommandInteraction<CacheType>): Promise<boolean> => {
    if (!apiKey) {
        await interaction.reply({
            content: "STEAM_API_KEY is missing.",
            ephemeral: true,
        });
        return false;
    }
    return true;
}

const getKeys = (interaction: ChatInputCommandInteraction<CacheType>): keysNeeded => {
    const steamId = interaction.options.getString("steamid", true);
    const appId = interaction.options.getInteger("appid", true);
    const apiKey = process.env.STEAM_API_KEY!;

    return { apiKey, steamId, appId };
}

const getInformationsNeeded = (achievements: SteamAchievement[]): AchievementInfo => {
    const completed = achievements.filter((a) => a.achieved === 1).length;
    const total = achievements.length;
    const percentage = ((completed / total) * 100).toFixed(2);

    return {
        completed: `${completed}`,
        total: `${total}`,
        percentage,
    }
}

const buildResponse = (appDetails: SteamAppDetails, achievementsInfo: AchievementInfo, steamId: string, appId: string): EmbedBuilder => {
    const { completed, total, percentage } = achievementsInfo;
    const gameName = appDetails?.name ?? `App ${appId}`;

    const response = new EmbedBuilder()
        .setTitle(gameName)
        .setDescription(`${steamId}`)
        .addFields({
            name: "Conclusão",
            value: `${completed}/${total} (${percentage}%)`,
        });

    if (appDetails?.headerImage) response.setImage(appDetails.headerImage);

    return response;
}

const achievementsByUserCommand: SlashCommand = {
    data: commandBuilder(),
    async execute(interaction) {
        const { apiKey, steamId, appId } = getKeys(interaction);

        if (!await validateSteamApiKey(apiKey, interaction)) return;
        await interaction.deferReply();

        try {
            const achievements = await fetchPlayerAchievements({
                apiKey: apiKey!,
                appId,
                steamId,
            });
            if (!achievements.length) {
                await interaction.editReply("Nenhuma conquista nesse jogo.");
                return;
            }

            const achievementsInfo = getInformationsNeeded(achievements);
            const appDetails = await fetchAppDetails(appId);

            const response = buildResponse(appDetails!, achievementsInfo, steamId, appId.toString());

            await interaction.editReply({ embeds: [response] });
        } catch (error) {
            await interaction.editReply(
                `Erro buscar conquistas na steam: ${(error as Error).message}`,
            );
        }
    },
};

export default achievementsByUserCommand;