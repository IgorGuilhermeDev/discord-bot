import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../types.js";
import {
  evaluateClassicGuess,
  findChampionByName,
  findChampionSuggestions,
  getChampionCount,
  getDailyChampion,
  type MatchStatus,
  type YearStatus,
} from "../loldle/classicGame.js";

const STATUS_EMOJI: Record<MatchStatus, string> = {
  match: "✅",
  partial: "🟨",
  mismatch: "❌",
};

const YEAR_EMOJI: Record<YearStatus, string> = {
  match: "✅",
  higher: "⬆️",
  lower: "⬇️",
};

const GENDER_LABELS: Record<string, string> = {
  M: "Male",
  F: "Female",
  X: "Other",
};

function formatList(values: string[]): string {
  return values.length ? values.join(", ") : "Unknown";
}

function formatGender(value: string): string {
  return GENDER_LABELS[value] ?? value ?? "Unknown";
}

function formatStatus(label: string, status: MatchStatus, value: string) {
  return {
    name: label,
    value: `${STATUS_EMOJI[status]} ${value}`,
    inline: true,
  } as const;
}

function formatReleaseYear(status: YearStatus, year: number) {
  const emoji = YEAR_EMOJI[status];

  if (!year) {
    return {
      name: "Lançamento",
      value: `${emoji} Erro do isbas`,
      inline: true,
    } as const;
  }

  return {
    name: "Lançamento",
    value: `${emoji} ${year}`,
    inline: true,
  } as const;
}

const loldleClassicCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("loldle")
    .setDescription("Play the classic LoLdle daily guesser")
    .addStringOption((option) =>
      option
        .setName("guess")
        .setDescription("Champion name you want to guess")
        .setRequired(true),
    ),
  async execute(interaction) {
    const guessInput = interaction.options.getString("guess", true);
    const guessChampion = findChampionByName(guessInput);

    if (!guessChampion) {
      const suggestions = findChampionSuggestions(guessInput);
      const suggestionText = suggestions.length ? `\nTalvez: ${suggestions.join(", ")}` : "";

      await interaction.reply({
        content: `Esse champion não existe. ${suggestionText}`,
        ephemeral: true,
      });
      return;
    }

    const dailyChampion = getDailyChampion();
    const evaluation = evaluateClassicGuess(guessChampion, dailyChampion);
    const embed = new EmbedBuilder()
      .setTitle(
        evaluation.isCorrect
          ? `Você acertou! ${dailyChampion.name}`
          : `IsBackDle ${guessChampion.name}`,
      )
      .setColor(evaluation.isCorrect ? 0x3fb950 : 0x5865f2)
      .setDescription(
        evaluation.isCorrect
          ? "Parabéns! Você descobriu o campeão do dia."
          : "Use /loldle novamente com outro palpite para continuar jogando.",
      )
      .addFields(
        formatStatus("Gênero", evaluation.gender, formatGender(guessChampion.gender)),
        formatStatus("Posições", evaluation.positions, formatList(guessChampion.positions)),
        formatStatus("Espécies", evaluation.species, formatList(guessChampion.species)),
        formatStatus("Recurso", evaluation.resource, guessChampion.resource ?? "Desconhecido"),
        formatStatus("Alcance", evaluation.rangeType, formatList(guessChampion.rangeType)),
        formatStatus("Regiões", evaluation.regions, formatList(guessChampion.regions)),
        formatReleaseYear(evaluation.releaseYear, guessChampion.releaseYear),
      )
      .setFooter({ text: `Baseado em ${getChampionCount()} campeões • Reinicia 00:00 UTC` });

    await interaction.reply({ embeds: [embed]});
  },
};

export default loldleClassicCommand;
