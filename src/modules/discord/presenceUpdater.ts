import memory from './memory.js';
import fbStrings from '../../../config/strings.json' assert { type: 'json' };

if (!memory.log) throw new Error(`memory.log is null!`);
const log = memory.log;

if (!memory.bot) throw new Error(`memory.bot is null!`);
const bot = memory.bot;

setInterval(() => {
  if (!bot.user) return;

  const currentStatus = bot.user.presence.activities[0];
  const rIndex = Math.floor(Math.random() * fbStrings.status.length);
  let rString = fbStrings.status[rIndex];

  // ensures we dont just pick the same string again
  if (rString === currentStatus.state) {
    if (rIndex === (fbStrings.status.length - 1)) {
      // if we're at the end of the array, use previous string
      rString = fbStrings.status[rIndex - 1];
    } else {
      // ...otherwise use next string in array
      rString = fbStrings.status[rIndex + 1];
    }
  }

  bot.user.setActivity({
    name: currentStatus.name,
    state: rString,
    type: currentStatus.type
  });
}, (1000 * 30)).unref();