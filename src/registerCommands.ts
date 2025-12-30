import "dotenv/config";

import { REST, Routes } from "discord.js";
import { commandData } from "./commands/index.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  throw new Error("DISCORD_TOKEN, CLIENT_ID, and GUILD_ID must be set before registering commands.");
}

const rest = new REST({ version: "10" }).setToken(token);

async function registerGuildCommands(): Promise<void> {
  try {
    console.log(`Registering ${commandData.length} command(s) to guild ${guildId}...`);
    await rest.put(Routes.applicationGuildCommands(clientId!, guildId!), {
      body: commandData,
    });
    console.log("Slash commands registered successfully.");
  } catch (error) {
    console.error("Failed to register commands:", error);
    process.exitCode = 1;
  }
}

registerGuildCommands();
