import { Logger } from '../../util/logger.js';
import { Client } from 'discord.js';
import { type Command } from "../../types/Command.js";

interface MemoryInterface {
  log: Logger | null,
  bot: Client | null,
  commands: Command[]
}

const memory: MemoryInterface = {
  log: null,
  bot: null,
  commands: []
};

export default memory;