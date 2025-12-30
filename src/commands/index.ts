import helloCommand from "./hello.js";
import type { SlashCommand } from "../types.js";
import achievementsByUserCommand from "./api/achievementsByUser.js";

export const commands: SlashCommand[] = [helloCommand, achievementsByUserCommand];

export const commandData = commands.map((command) => command.data.toJSON());

export const getCommandByName = (name: string): SlashCommand | undefined =>
  commands.find((command) => command.data.name === name);
