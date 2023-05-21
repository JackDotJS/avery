import { Client } from 'discord.js';

interface MemoryInterface {
  bot: Client | null
}

const memory: MemoryInterface = {
  bot: null
};

export default memory;