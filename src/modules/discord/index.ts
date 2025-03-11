// eslint-disable-next-line @typescript-eslint/quotes
import keys from '../../../config/keys.json' with { type: 'json' };
// eslint-disable-next-line @typescript-eslint/quotes
import funnyStrings from '../../../config/strings.json' with { type: 'json' };
import { Client, GatewayIntentBits as Intents, ClientOptions, Partials, ActivityType } from 'discord.js';
import memory from './memory.js';
import { Logger } from '../../util/logger.js';
import { initializeCommands } from './commandLoader.js';
import { initializeMessageHandler } from './messageHandler.js';
import { initalizePresenceUpdater } from './presenceUpdater.js';

memory.log = new Logger();
const log = memory.log;

// ensure all commands are loaded correctly before even attempting to login
// helps reduce api spam if there's a problem on our end
await initializeCommands();

const djsOpts: ClientOptions = {
  presence: {
    status: `online`,
    activities: [
      {
        name: `You aren't supposed to see this!`,
        state: funnyStrings.status[0],
        type: ActivityType.Custom
      }
    ]
  },
  // there are literally zero situations where the bot needs to ping @everyone/@here
  allowedMentions: { parse: [`users`, `roles`] },
  intents: [
    // https://discord.com/developers/docs/topics/gateway#list-of-intents
    Intents.Guilds,
    Intents.GuildMessages,
    Intents.MessageContent
  ],
  partials: [
    Partials.Channel
  ]
};

const bot = new Client(djsOpts);
memory.bot = bot;

let loaded = false;

bot.on(`ready`, (client) => {
  const av = client.guilds.cache.filter(g => g.available).size;

  log.info([
    `=== Discord API Connection Established! ===`,
    `Successfully connected with ${client.guilds.cache.size} guild(s) (${av} available)`
  ].join(`\n`));

  if (!loaded) {
    loaded = true;
    
    initalizePresenceUpdater();
    initializeMessageHandler();
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

bot.on(`shardDisconnect`, (event) => {
  log.warn([
    `=== Discord API Disconnect! ===`,
    `Event Code: ${event.code}`,
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