import { memory } from './memory.js';
import { getFunnyString } from '../../util/randomFunnyString.js';

export function initalizePresenceUpdater() {
  if (!memory.bot) throw new Error(`memory.bot is null!`);
  const bot = memory.bot;

  setInterval(() => {
    if (!bot.user) return;

    const currentStatus = bot.user.presence.activities[0];

    bot.user.setActivity({
      name: currentStatus.name,
      state: getFunnyString(`status`),
      type: currentStatus.type
    });
  }, (1000 * 30)).unref();
}