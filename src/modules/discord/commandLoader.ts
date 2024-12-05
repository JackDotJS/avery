import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readdirSync, existsSync } from 'fs';
import memory from './memory.js';

if (!memory.log) throw new Error(`memory.log is null!`);
const log = memory.log;

const cmdDir = resolve(`${dirname(fileURLToPath(import.meta.url))}../../../commands`);

if (!existsSync(cmdDir)) {
  throw new Error(`Could not find command directory: ${cmdDir}`);
}

for (const item of readdirSync(cmdDir, { withFileTypes: true })) {
  if (item.isDirectory()) continue;

  import(`${cmdDir}/${item.name}`).then((command) => {
    if (command.metadata == null) {
      log.debug(command);
      return log.warn(`Could not load command "${item.name}" (Missing metadata)`);
    }

    if (command.discord == null) {
      return log.info(`Could not load command "${item.name}" (Not executable in Discord context)`)
    }

    if (command.discord.execute == null) {
      return log.warn(`Could not load command "${item.name}" (Missing executable function)`)
    }

    memory.commands.push(command);
    log.info(`Successfully loaded command "${item.name}"`);
  });
}

log.debug(memory.commands);