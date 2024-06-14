import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readdirSync, existsSync } from 'fs';
import keys from '../../../config/keys.json' assert { type: 'json' };
import fbStrings from '../../../config/strings.json' assert { type: 'json' };
import { Client, GatewayIntentBits as Intents, ClientOptions, Partials, ActivityType } from 'discord.js';
import memory from './memory.js';
import { Logger } from '../../util/logger.js';

memory.log = new Logger();
const log = memory.log;

const djsOpts: ClientOptions = {
  presence: {
    status: `online`,
    activities: [
      {
        name: `You aren't supposed to see this!`,
        state: fbStrings.status[0],
        type: ActivityType.Custom
      }
    ]
  },
  allowedMentions: { parse: [`users`, `roles`] }, // remove this line to die instantly
  intents: [
    // https://discord.com/developers/docs/topics/gateway#list-of-intents
    Intents.Guilds,
    Intents.GuildMessages
  ],
  partials: [
    Partials.Channel
  ]
};

const bot = new Client(djsOpts);
memory.bot = bot;

bot.on(`ready`, (client) => {
  const av = client.guilds.cache.filter(g => g.available).size;

  log.info([
    `=== Discord API Connection Established! ===`,
    `Successfully connected with ${client.guilds.cache.size} guild(s) (${av} available)`
  ].join(`\n`));

  // const modulesDir = `${dirname(fileURLToPath(import.meta.url))}/modules/`;

  // if (existsSync(modulesDir)) {
  //   for (const file of readdirSync(modulesDir)) {
  //     import(`./modules/${file}`).then(() => {
  //       log.info(`Loaded module from ${file}`);
  //     });
  //   }
  // }
});

// periodically update custom status string

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

// reply to mentions/pings

bot.on(`messageCreate`, (message) => {
  if (bot.user == null) return;

  if (message.mentions.has(bot.user.id)) {
    message.reply(fbStrings.mention[Math.floor(Math.random() * fbStrings.mention.length)]);
  }
});

// guild status

bot.on(`guildUnavailable`, (guild) => {
  log.warn([
    `=== Guild Unavailable! ===`,
    `Unable to connect to "${guild.name}" (${guild.id})`,
  ].join(`\n`));
});

bot.on(`guildUpdate`, (oldGuild, newGuild) => {
  if (oldGuild.available && newGuild.available) return;

  log.info([
    `=== Guild Now Available! ===`,
    `"${newGuild.name}" (${newGuild.id}) has recovered.`,
  ].join(`\n`));
});

// websocket status events

// Removed these two properties because they're deprecated and don't provide
// any real data anyway.
bot.on(`shardDisconnect`, (event) => {
  log.warn([
    `=== Discord API Disconnect! ===`,
    // `Disconnect Reason: ${event.reason}`,
    `Event Code: ${event.code}`,
    // `wasClean: ${event.wasClean}`
  ].join(`\n`));
});

bot.on(`shardReconnecting`, () => {
  log.debug(`Attempting to reconnect to Discord API...`);
});

bot.on(`shardResume`, (id, replayedEvents) => {
  log.warn([
    `=== Discord API Reconnected! ===`,
    `Events replayed: ${replayedEvents}`,
  ].join(`\n`));
});

bot.on(`shardError`, (event) => {
  log.error([
    `=== Discord API WS Error! ===`,
    event.stack || event.toString()
  ].join(`\n`));
});

// ratelimit/api spam warnings

bot.on(`invalidRequestWarning`, (data) => {
  log.warn([
    `=== Multiple Invalid Requests! ===`,
    `Invalid requests made: ${data.count}`,
    `Time before reset: ${data.remainingTime / 1000} seconds`
  ].join(`\n`));
});

bot.on(`rateLimit`, (data) => {
  log.warn([
    `=== Discord API Ratelimited! ===`,
    `Timeout: ${data.timeout}`,
    `Limit: ${data.limit}`,
    `Method: ${data.method}`,
    `Path: ${data.path}`,
    `Route: ${data.route}`,
    `Global?: ${data.global}`
  ].join(`\n`));
});

// djs log events

bot.on(`debug`, (message) => {
  log.debug(message);
});

bot.on(`warn`, (message) => {
  log.warn(message);
});

bot.on(`error`, (error) => {
  log.error(error.stack || error);
});

bot.login(keys.discord).catch((error) => {
  log.fatal(error.stack || error);

  log.warn(`Failed to connect to Discord API. Restarting in 5 minutes...`);
  // 5 minute timeout to give the API some time to be restored.
  // this is assuming the issue is on Discord's end.
  setTimeout(() => {
    process.exit(1);
  }, (1000 * 60 * 5));
});