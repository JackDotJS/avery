import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readdirSync, existsSync } from 'fs';
import memory from './memory.js';
import { BaseCommand } from '../../classes/Command.js';

export async function initializeCommands() {
  if (!memory.log) throw new Error(`memory.log is null!`);
  const log = memory.log;

  const cmdDir = resolve(`${dirname(fileURLToPath(import.meta.url))}../../../commands`);

  if (!existsSync(cmdDir)) {
    throw new Error(`Could not find command directory: ${cmdDir}`);
  }

  mainLoop: for (const item of readdirSync(cmdDir, { withFileTypes: true })) {
    if (item.isDirectory()) continue;

    const module = await import(`${cmdDir}/${item.name}`);
    const newCmd = module.default;

    if ((newCmd instanceof BaseCommand) == false) {
      log.debug(newCmd instanceof BaseCommand, typeof newCmd, newCmd);
      log.warn(`Failed to load command "${item.name}" (Not a valid command)`);
      continue;
    }

    if (newCmd.metadata == null) {
      log.debug(newCmd);
      log.warn(`Failed to load command "${item.name}" (Missing metadata)`);
      continue;
    }

    for (const existingCmd of memory.commands) {
      if (existingCmd.metadata.name == newCmd.metadata.name) {
        log.warn(`Failed to load command "${item.name}" (Name already exists)`);
        continue mainLoop;
      }

      if (existingCmd.metadata.aliases && existingCmd.metadata.aliases.includes(newCmd.metadata.name)) {
        log.warn(`Failed to load command "${item.name}" (Name conflicts with alias of "${existingCmd.metadata.name}")`);
        continue mainLoop;
      }

      if (newCmd.metadata.aliases) {
        for (const alias of newCmd.metadata.aliases) {
          if (existingCmd.metadata.name == alias) {
            log.warn(`Failed to load command "${item.name}" (Alias "${alias}" conflicts with name of "${existingCmd.metadata.name}")`);
            continue mainLoop;
          }

          if (existingCmd.metadata.aliases && existingCmd.metadata.aliases.includes(alias)) {
            log.warn(`Failed to load command "${item.name}" (Alias "${alias}" already in use by "${existingCmd.metadata.name}")`);
            continue mainLoop;
          }
        }
      }
    }

    if (newCmd.discordHandler == null) {
      log.info(`Failed to load command "${item.name}" (Not executable in Discord context)`);
      continue;
    }

    memory.commands.push(newCmd);
    log.info(`Successfully loaded command "${item.name}"`);
  }

  log.debug(memory.commands);
  return;
}