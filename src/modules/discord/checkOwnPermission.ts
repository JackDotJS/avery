import { memory } from './memory.js';
import { NonThreadGuildBasedChannel, PermissionResolvable } from "discord.js";

export async function checkOwnPermission(channel: NonThreadGuildBasedChannel, permission: PermissionResolvable): Promise<boolean> {
  if (!memory.log) throw new Error(`memory.log is null!`);
  const log = memory.log;

  if (!memory.bot) throw new Error(`memory.bot is null!`);
  const bot = memory.bot;

  if (!bot.user) throw new Error(`bot.user is null!`);

  const botMember = await channel.guild.members.fetch(bot.user.id);
  const allPerms = channel.permissionsFor(botMember, true);

  log.debug(allPerms);

  return allPerms.has(permission, true);
}