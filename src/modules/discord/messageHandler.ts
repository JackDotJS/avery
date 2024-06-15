import memory from './memory.js';
import fbStrings from '../../../config/strings.json' assert { type: 'json' }; 

if (!memory.log) throw new Error(`memory.log is null!`);
const log = memory.log;

if (!memory.bot) throw new Error(`memory.bot is null!`);
const bot = memory.bot;

bot.on(`messageCreate`, (message) => {
  if (bot.user == null) return;

  if (message.mentions.has(bot.user.id)) {
    message.reply(fbStrings.mention[Math.floor(Math.random() * fbStrings.mention.length)]);
  }
});