import memory from './memory.js';
import { ChannelType, ColorResolvable, EmbedBuilder, MessageType } from 'discord.js';
import { getFunnyString } from '../../util/randomFunnyString.js';
import cfg from '../../../config/config.json' assert { type: 'json' };

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

  // bot mention handler
  if (message.mentions.has(bot.user.id)) {
    message.reply(getFunnyString(`mention`));
    return;
  }

  // command handler
  if (cmdrgx.test(message.content)) {
    const inputArgs = message.content.slice(1).trim().split(/ +/g);
    const inputCmd = inputArgs.shift()?.toLowerCase();

    log.debug(inputCmd, inputArgs);

    for (const cmd of memory.commands) {
      if (cmd.metadata.name === inputCmd) {
        return cmd.discord.execute(message);
      }
    }

    // default response
    const embed = new EmbedBuilder()
    .setColor(cfg.discord.colors.error as ColorResolvable)
    .setTitle(`Unknown Command`)

    message.reply({
      embeds: [ embed ]
    });

    return;
  }

  // standard message handler
  const chance = 1 / 1337;
  // const chance = 1; // for debugging only
  if (Math.random() < chance) {
    message.reply(`User was ${getFunnyString(`user_was_x`)} for this post`);
  }
});