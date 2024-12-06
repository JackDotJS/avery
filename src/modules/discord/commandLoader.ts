import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readdirSync, existsSync } from 'fs';
import memory from './memory.js';
import { BaseCommand } from '../../classes/Command.js';

if (!memory.log) throw new Error(`memory.log is null!`);
const log = memory.log;

const cmdDir = resolve(`${dirname(fileURLToPath(import.meta.url))}../../../commands`);

if (!existsSync(cmdDir)) {
  throw new Error(`Could not find command directory: ${cmdDir}`);
}

for (const item of readdirSync(cmdDir, { withFileTypes: true })) {
  if (item.isDirectory()) continue;

  import(`${cmdDir}/${item.name}`).then((module) => {
    const command = module.default;

    if ((command instanceof BaseCommand) == false) {
      log.debug(command instanceof BaseCommand, typeof command, command);
      return log.warn(`Failed to load command "${item.name}" (Not a valid command)`);
    }

    if (command.metadata == null) {
      log.debug(command);
      return log.warn(`Failed to load command "${item.name}" (Missing metadata)`);
    }

    if (command.discordHandler == null) {
      return log.info(`Failed to load command "${item.name}" (Not executable in Discord context)`);
    }

    memory.commands.push(command);
    log.info(`Successfully loaded command "${item.name}"`);
  });
}

log.debug(memory.commands);