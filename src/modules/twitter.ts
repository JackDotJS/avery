import { ETwitterStreamEvent, TweetStream, TwitterApi, ETwitterApiError } from 'twitter-api-v2';
import cfg from '../../config/config.json' assert { type: "json" };
import keys from '../../config/keys.json' assert { type: "json" };
import { Logger } from '../util/logger.js';
import { bot } from '../process.js';
import { inspect } from 'util';

const log = new Logger();

const guild = await bot.guilds.fetch({ guild: cfg.twitter.output.guild });
const channel = await guild.channels.fetch(cfg.twitter.output.channel);

// todo: queue tweets if discord is down

const tClient = new TwitterApi(keys.twitter);

await tClient.v2.updateStreamRules({
  add: [
    { value: cfg.twitter.params }
  ]
});

const tweetStream = await tClient.v2.searchStream();
tweetStream.autoReconnect = true;

tweetStream.on(ETwitterStreamEvent.ConnectionError, (err) => {
  log.error([
    `=== Twitter API Error ===`,
    `Error occurred connecting to Twitter API:`,
    err.stack || err
  ].join(`\n`));
});

tweetStream.on(ETwitterStreamEvent.ConnectionClosed, () => {
  log.warn([
    `=== Twitter API Error ===`,
    `Twitter API connection closed.`
  ].join(`\n`));
});

tweetStream.on(ETwitterStreamEvent.Reconnected, () => {
  log.info([
    `=== Twitter API Error ===`,
    `Connection re-established with Twitter API.`
  ].join(`\n`));
});

tweetStream.on(ETwitterStreamEvent.DataError, (err) => {
  log.error([
    `=== Twitter API Error ===`,
    `Received error payload from Twitter API:`,
    err.stack || err
  ].join(`\n`));
});

tweetStream.on(ETwitterStreamEvent.TweetParseError, (err) => {
  log.error([
    `=== Twitter API Error ===`,
    `Error occurred while parsing data:`,
    err.stack || err
  ].join(`\n`));
});

tweetStream.on(ETwitterStreamEvent.ReconnectError, (count) => {
  log.error([
    `=== Twitter API Error ===`,
    `Error occurred while reconnecting to Twitter API.`,
  ].join(`\n`));
});

tweetStream.on(ETwitterStreamEvent.ReconnectLimitExceeded, () => {
  log.error([
    `=== Twitter API Error ===`,
    `Could not reconnect to Twitter API. (exceeded retry limit)`,
  ].join(`\n`));
});

tweetStream.on(ETwitterStreamEvent.DataKeepAlive, () => {
  log.debug(`Twitter API KeepAlive`);
});

tweetStream.on(ETwitterStreamEvent.Data, async (data) => {
  log.info([
    `=== New Tweet Received ===`,
    inspect(data)
  ].join(`\n`));

  if (channel != null && channel.type === `GUILD_TEXT` && guild.available) {
    channel.send(`https://twitter.com/JackDotJS/status/${data.data.id}`)
  }
});