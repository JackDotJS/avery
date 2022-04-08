import { ETwitterStreamEvent, TweetStream, TwitterApi, ETwitterApiError } from 'twitter-api-v2';
import cfg from '../../config/config.json' assert { type: "json" };
import keys from '../../config/keys.json' assert { type: "json" };

const tClient = new TwitterApi(keys.twitter);

const tweetRules = await tClient.v2.updateStreamRules({
  add: [
    { value: cfg.twitter.params }
  ]
});

const tweetStream = await tClient.v2.searchStream();
tweetStream.autoReconnect = true;

tweetStream.on(ETwitterStreamEvent.ConnectionError, (err) => {
  console.log(`oopsie lol`, err);
});

tweetStream.on(ETwitterStreamEvent.ConnectionClosed, () => {
  console.log(`ok bye stupid`);
});

tweetStream.on(ETwitterStreamEvent.Data, (data) => {
  console.log(`new tweet:`, data);
});

tweetStream.on(ETwitterStreamEvent.DataKeepAlive, () => {
  console.log(`keep alive`);
});

console.log(`ready`);