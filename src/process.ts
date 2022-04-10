import { Logger } from './util/logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readdirSync } from 'fs';
import keys from '../config/keys.json' assert { type: "json" };
import { Client, Intents, ClientOptions } from 'discord.js';

const log = new Logger();

const djsOpts: ClientOptions = {
  presence: {
    status: `online`
  },
  allowedMentions: { parse: [`users`, `roles`] }, // remove this line to die instantly
  intents: [
    // https://discord.com/developers/docs/topics/gateway#list-of-intents
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
  ],
  partials: [
    `CHANNEL`
  ]
};

export const bot = new Client(djsOpts);

for (const file of readdirSync(`${dirname(fileURLToPath(import.meta.url))}/modules/`)) {
  import(`./modules/${file}`).then(() => {
    log.info(`Loaded module from ${file}`);
  });
}

bot.on(`ready`, (client) => {
  let av = 0;

  client.guilds.cache.each((guild) => {
    if (guild.available) av++;
  });

  log.info([
    `=== Discord API Connection Established! ===`,
    `Successfully connected with ${client.guilds.cache.size} guild(s) (${av} available)`
  ].join(`\n`));
});

bot.on(`guildUnavailable`, (guild) => {
  log.warn([
    `=== Guild Unavailable! ===`,
    `Unable to connect to "${guild.name}" (${guild.id})`,
  ].join(`\n`));
});

bot.on(`guildUpdate`, (oldGuild, newGuild) => {
  if (oldGuild.available && newGuild.available) return;

  log.warn([
    `=== Guild Now Available! ===`,
    `"${newGuild.name}" (${newGuild.id}) has recovered.`,
  ].join(`\n`));
});

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