import { Logger } from '../../util/logger.js';
import { Client } from 'discord.js';
import { type Command } from "../../types/Command.js";

export type DiscordMemory = {
  log: Logger | null,
  bot: Client | null,
  commands: Command[]
};

export const memory: DiscordMemory = {
  log: null,
  bot: null,
  commands: []
};