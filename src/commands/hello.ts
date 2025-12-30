import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../types.js";

const helloCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Replies with Hello World"),
  async execute(interaction) {
    await interaction.reply("Hello World");
  },
};

export default helloCommand;
