import memory from './memory.js';
import fbStrings from '../../../config/strings.json' assert { type: 'json' }; 
import { ChannelType, MessageType } from 'discord.js';

if (!memory.log) throw new Error(`memory.log is null!`);
const log = memory.log;

if (!memory.bot) throw new Error(`memory.bot is null!`);
const bot = memory.bot;

const cmdrgx = new RegExp(`^\\?[a-zA-Z0-9]+`);

bot.on(`messageCreate`, (message) => {
  if (bot.user == null) return;
  if (message.author.bot) return;
  if (message.author.system) return;
  if (message.system) return;
  if (message.type !== MessageType.Default) return;
  if (message.channel.type === ChannelType.DM) return;

  // handle bot mentions
  if (message.mentions.has(bot.user.id)) {
    message.reply(fbStrings.mention[Math.floor(Math.random() * fbStrings.mention.length)]);
    return;
  }

  // handle commands
  if (cmdrgx.test(message.content)) {
    const inputArgs = message.content.slice(1).trim().split(/ +/g);
    const inputCmd = inputArgs.shift()?.toLowerCase();

    log.debug(inputCmd, inputArgs);

    for (const cmd of memory.commands) {
      if (cmd.metadata.name === inputCmd) {
        return cmd.discord.execute(message);
      }
    }

    message.reply(`unknown command`);
    return;
  }
});