import "dotenv/config";

import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { commands } from "./commands/index.js";
import type { SlashCommand } from "./types.js";

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error("DISCORD_TOKEN is missing");
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commandMap = new Collection<string, SlashCommand>();

for (const command of commands) {
  commandMap.set(command.data.name, command);
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`IgorIsDev Broke free ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commandMap.get(interaction.commandName);

  if (!command) {
    await interaction.reply({ content: "Comando desconhecido.", ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Failed to execute /${interaction.commandName}:`, error);

    const replyContent = {
      content: "Não sei Rick, parece falso. (Ocorreu um erro)",
      ephemeral: true,
    } as const;

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(replyContent);
    } else {
      await interaction.reply(replyContent);
    }
  }
});

client.login(token);
