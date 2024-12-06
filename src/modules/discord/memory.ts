import { Logger } from '../../util/logger.js';
import { Client } from 'discord.js';
import { BaseCommand } from '../../classes/Command.js';

interface MemoryInterface {
  log: Logger | null,
  bot: Client | null,
  commands: BaseCommand[]
}

const memory: MemoryInterface = {
  log: null,
  bot: null,
  commands: []
};

export default memory;