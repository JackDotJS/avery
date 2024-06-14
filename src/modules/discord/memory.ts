import { Logger } from '../../util/logger.js';
import { ChatInputCommandInteraction, Client } from 'discord.js';

type FBSlashCommandExecutable = (interaction: ChatInputCommandInteraction) => void;

interface FBSlashCommandTemplate {
  metadata: object,
  execute: FBSlashCommandExecutable
}

interface MemoryInterface {
  log: Logger | null,
  bot: Client | null,
  commands: FBSlashCommandTemplate[]
}

const memory: MemoryInterface = {
  log: null,
  bot: null,
  commands: []
};

export default memory;