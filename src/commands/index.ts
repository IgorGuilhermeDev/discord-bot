import helloCommand from "./hello.js";
import type { SlashCommand } from "../types.js";
import achievementsByUserCommand from "./api/achievementsByUser.js";
import loldleClassicCommand from "./loldleClassic.js";

export const commands: SlashCommand[] = [helloCommand, achievementsByUserCommand, loldleClassicCommand];

export const commandData = commands.map((command) => command.data.toJSON());

export const getCommandByName = (name: string): SlashCommand | undefined =>
  commands.find((command) => command.data.name === name);
