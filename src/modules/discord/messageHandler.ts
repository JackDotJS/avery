import { memory } from './memory.js';
import { ChannelType, ColorResolvable, EmbedBuilder, MessageType } from 'discord.js';
import { getFunnyString } from '../../util/randomFunnyString.js';
// eslint-disable-next-line @typescript-eslint/quotes
import cfg from '../../../config/config.json' with { type: 'json' };
import { permissionCheck } from '../../util/permissions.js';

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

      if (inputCmd == null) throw new Error(`inputCmd is undefined (THIS SHOULD *NEVER* HAPPEN)`);

      log.info([
        `Command issued by @${message.member?.user.username} (${message.member?.user.id}):`,
        inputCmd,
        inputArgs
      ].join(` `));

      for (const cmd of memory.commands) {
        // TODO: handle command aliases
        if (cmd.metadata.name === inputCmd || cmd.metadata.aliases && cmd.metadata.aliases.includes(inputCmd)) {
          try {
            if (cmd.discordHandler == null) {
              throw new Error(`Command "${cmd.metadata.name}" does not contain a valid handler for this context. This should never happen!!!`);
            }

            if (cmd.metadata.permissionGroups != null) {
              const member = await message.member?.fetch();
              if (member == null) throw new Error(`Failed to fetch message GuildMember.`);

              const roles = Array.from(member.roles.cache.keys());
              const allowed = permissionCheck(roles, cmd.metadata.permissionGroups);

              if (!allowed) {
                log.info(`User @${message.member?.user.username} (${message.member?.user.id}) failed to pass permission check`);

                const deniedEmbed = new EmbedBuilder()
                  .setColor(cfg.discord.colors.error as ColorResolvable)
                  .setTitle(`Access Denied`)
                  .setDescription(`You do not have permission to use this command.`);
                
                message.reply({
                  embeds: [ deniedEmbed ]
                });

                return;
              }
            }
  
            await cmd.discordHandler(message, inputArgs);
            return;
          } catch (error) {
            log.error(error);

            if (error instanceof Error == false) {
              return log.error(`error is not an error? wtf`);
            }

            const errorEmbed = new EmbedBuilder()
              .setColor(cfg.discord.colors.error as ColorResolvable)
              .setTitle(`Error during execution`)
              .setDescription([
                `\`\`\``,
                error.toString(),
                `\`\`\``,
              ].join(`\n`));
            
            message.reply({
              embeds: [ errorEmbed ]
            });
            
            return;
          }
        }
      }

      // default response
      const defaultEmbed = new EmbedBuilder()
        .setColor(cfg.discord.colors.error as ColorResolvable)
        .setTitle(`Unknown Command`);

      message.reply({
        embeds: [ defaultEmbed ]
      });

      return;
    }

    // standard message handler
    const chance = 1 / 1337;
    // const chance = 1; // for debugging only
    if (Math.random() < chance) {
      message.reply(`User was ${getFunnyString(`user_was_x`)} for this post`);
    }
  });
}