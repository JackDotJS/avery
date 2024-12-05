import { Logger } from '../../util/logger.js';
import { Client } from 'discord.js';

interface MemoryInterface {
  log: Logger | null,
  bot: Client | null,
  commands: CommandModule[]
}

const memory: MemoryInterface = {
  log: null,
  bot: null,
  commands: []
};

export default memory;