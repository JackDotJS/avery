import { memory } from './memory.js';
import { ChannelType, MessageType } from 'discord.js';
import { getFunnyString } from '../../util/randomFunnyString.js';
import { permissionCheck } from '../../util/permissions.js';
import { UniversalEmbed } from '../../util/universalEmbed.js';
import { jaroWinkler } from '@skyra/jaro-winkler';

export function initializeMessageHandler() {
  if (!memory.log) throw new Error(`memory.log is null!`);
  const log = memory.log;

  if (!memory.bot) throw new Error(`memory.bot is null!`);
  const bot = memory.bot;

  const cmdrgx = new RegExp(`^\\?[a-zA-Z0-9]+`);

  bot.on(`messageCreate`, async (message) => {
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
    // TODO: we can probably move a bunch of this logic 
    // to its own function which can be shared between
    // the revolt and discord modules
    if (cmdrgx.test(message.content)) {
      const inputArgs = message.content.slice(1).trim().split(/ +/g);
      const inputCmd = inputArgs.shift()?.toLowerCase();
      let closestMatchName = ``;
      let matchConfidence = 0;

      if (inputCmd == null) throw new Error(`inputCmd is undefined (THIS SHOULD *NEVER* HAPPEN)`);

      log.info([
        `Command issued by @${message.member?.user.username} (${message.member?.user.id}):`,
        inputCmd,
        inputArgs
      ].join(` `));

      for (const cmd of memory.commands) {
        // found match
        if (cmd.metadata.name === inputCmd || cmd.metadata.aliases && cmd.metadata.aliases.includes(inputCmd)) {
          try {
            if (cmd.discordHandler == null) {
              throw new Error(`Command "${cmd.metadata.name}" does not contain a valid handler for this context. This should never happen!!!`);
            }

            const member = await message.member?.fetch();
            if (member == null) throw new Error(`Failed to fetch message GuildMember.`);

            if (cmd.metadata.permissionGroups != null) {
              const roles = Array.from(member.roles.cache.keys());
              const allowed = permissionCheck(roles, cmd.metadata.permissionGroups);

              if (!allowed) {
                log.info(`User @${message.member?.user.username} (${message.member?.user.id}) failed to pass permission check`);

                return await new UniversalEmbed(message)
                  .setVibe(`error`)
                  .setIcon(`error.png`)
                  .setTitle(`Error`)
                  .setDescription([
                    `## Access Denied`,
                    `You do not have permission to run this command.`
                  ].join(`\n`))
                  .submitReply();
              }
            }
  
            await cmd.discordHandler(message, inputArgs);
            return;
          } catch (error) {
            log.error(error);

            if (error instanceof Error == false) {
              return log.error(`error is not an error? wtf`);
            }

            return await new UniversalEmbed(message)
              .setVibe(`error`)
              .setIcon(`error.png`)
              .setTitle(`Error`)
              .setDescription([
                `## Something went wrong:`,
                `\`\`\`${error}\`\`\``
              ].join(`\n`))
              .submitReply();
          }
        }

        // no match
        const names = [ cmd.metadata.name ];
        if (cmd.metadata.aliases) names.push(...cmd.metadata.aliases);

        for (const name of names) {
          const similarity = jaroWinkler(inputCmd, name);
  
          if (similarity > matchConfidence) {
            closestMatchName = name;
            matchConfidence = similarity;
          }
        }
      }

      // default response

      const descBody = [ `## Unknown Command` ];

      if (matchConfidence > 0.75) {
        descBody.push(`Did you mean \`?${closestMatchName}\`?\n`);
      }

      descBody.push(`-# To list all valid commands, use \`?help\`.`);

      return await new UniversalEmbed(message)
        .setVibe(`error`)
        .setIcon(`error.png`)
        .setTitle(`Error`)
        .setDescription(descBody.join(`\n`))
        .submitReply();
    }

    // standard message handler
    const chance = 1 / 1337;
    // const chance = 1; // for debugging only
    if (Math.random() < chance) {
      message.reply(`User was ${getFunnyString(`user_was_x`)} for this post`);
    }
  });
}