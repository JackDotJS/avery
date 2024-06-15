import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readdirSync, existsSync } from 'fs';
import memory from './memory.js';

if (!memory.log) throw new Error(`memory.log is null!`);
const log = memory.log;

const cmdDirs = [
  resolve(`${dirname(fileURLToPath(import.meta.url))}../../../commands/global`),
  resolve(`${dirname(fileURLToPath(import.meta.url))}../../../commands/discord`)
];

for (const dir of cmdDirs) {
  if (existsSync(dir)) {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      if (item.isDirectory()) continue;
  
      import(`${dir}/${item.name}`).then((command) => {
        if (command.metadata == null || command.execute == null) {
          log.debug(command);
          return log.warn(`Invalid command: ${item.name}`);
        }
  
        memory.commands.push(command);
        log.info(`Loaded command from ${item.name}`);
      });
    }
  } else {
    log.error(new Error(`Could not find command directory: ${dir}`));
  }
}