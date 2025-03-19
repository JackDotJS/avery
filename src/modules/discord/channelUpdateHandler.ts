import { memory } from './memory.js';
import { UniversalEmbed } from '../../util/universalEmbed.js';
import { ChannelType } from 'discord.js';
import { checkOwnPermission } from './checkOwnPermission.js';

export function initializeChannelUpdateHandler() {
  if (!memory.log) throw new Error(`memory.log is null!`);
  const log = memory.log;

  if (!memory.bot) throw new Error(`memory.bot is null!`);
  const bot = memory.bot;

  bot.on(`channelUpdate`, async (oldChannel, newChannel) => {
    if (oldChannel.type !== ChannelType.GuildText) return;
    if (newChannel.type !== ChannelType.GuildText) return;

    const descBody = [];

    if (oldChannel.name !== newChannel.name) {
      log.info(`[#${oldChannel.id}] Channel name updated: ${oldChannel.name} -> ${newChannel.name}`);

      descBody.push(
        `### Old Name`,
        `#${oldChannel.name}`,
        `### New Name`,
        `#${newChannel.name}`
      );
    }

    if (oldChannel.topic !== newChannel.topic) {
      log.info(`[#${oldChannel.id}] Channel topic updated: ${oldChannel.topic} -> ${newChannel.topic}`);

      descBody.push(
        `### Old Topic`,
        oldChannel.topic ?? ` `,
        `### New Topic`,
        newChannel.topic ?? ` `
      );
    }

    if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
      log.info(`[#${oldChannel.id}] Channel rate limit updated: ${oldChannel.rateLimitPerUser} -> ${newChannel.rateLimitPerUser}`);

      const getRLString = (ratelimit: number) => {
        return (ratelimit > 0) ? `${ratelimit} seconds` : `None.`;
      };

      descBody.push(
        `### Old Rate Limit`,
        getRLString(oldChannel.rateLimitPerUser),
        `### New Rate Limit`,
        getRLString(newChannel.rateLimitPerUser)
      );
    }

    if (descBody.length === 0) return; // no changes we want to announce
    if ((await checkOwnPermission(newChannel, `SendMessages`)) === false) return; // cannot send messages in this channel

    const embedData = await new UniversalEmbed(bot)
      .setIcon(`pencil.png`)
      .setTitle(`Channel Updated`)
      .setDescription(descBody.join(`\n`))
      .generateObjects();

    await newChannel.send({
      embeds: [ embedData.embed ],
      files: embedData.attachments
    });

    log.info(`[#${oldChannel.id}] Channel update notification sent.`);
  });
}