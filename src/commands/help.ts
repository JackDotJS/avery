import { EmbedBuilder, Message as DiscordMessage, ColorResolvable } from "discord.js";
import { Message as RevoltMessage } from "revolt.js";
// eslint-disable-next-line @typescript-eslint/quotes
import pkg from "../../package.json" with { type: 'json' };
// eslint-disable-next-line @typescript-eslint/quotes
import cfg from '../../config/config.json' with { type: 'json' };
import { BaseCommand } from "../classes/Command.js";
import memory from "../modules/discord/memory.js";

class HelpCommand extends BaseCommand {
  constructor() {
    super({
      name: `help`,
      aliases: [ `commands` ],
      description: `List or get details about specific commands.`,
      usage: [
        `[command name/alias]`,
        `[page #]`
      ]
    });
  }

  discordHandler = async (message: DiscordMessage, args: string[]) => {
    // page number should always be 0 if no arguments are provided.
    const targetPage = parseInt(args[0] ?? 0);
    if (isNaN(targetPage)) {
      // argument wasnt a number, so assume we're looking for a command
      const query = args[0].toLowerCase();
      let foundCmd = null;

      exactSearch: for (const cmd of memory.commands) {
        if (cmd.metadata.name === query) {
          foundCmd = cmd;
          break;
        }

        if (cmd.metadata.aliases) {
          for (const alias of cmd.metadata.aliases) {
            if (alias === query) {
              foundCmd = cmd;
              break exactSearch;
            }
          }
        }
      }

      if (foundCmd == null) {
        const embed = new EmbedBuilder()
          .setColor(cfg.discord.colors.error as ColorResolvable)
          .setTitle(`?${query}`.substring(0, 256)) // see https://discord.com/developers/docs/resources/message#embed-object-embed-limits
          .setDescription(`This command does not exist.`)
          .setFooter({ text: `For more commands, use \`?help\`` });
      
        await message.reply({
          embeds: [ embed ]
        });
      } else {
        const fields = [];

        // add aliases field (if applicable)
        const aliases = [];
        if (foundCmd.metadata.aliases) {
          for (const alias of foundCmd.metadata.aliases) {
            aliases.push(`\`?${alias}\``);
          }
        }

        if (aliases.length > 0) {
          fields.push({
            name: `Alias(es)`,
            value: aliases.join(`, `)
          });
        }

        // add arguments/usage field
        const usages = [];
        if (foundCmd.metadata.usage) {
          for (const usageExample of foundCmd.metadata.usage) {
            usages.push(`\`\`\`?${foundCmd.metadata.name} ${usageExample}\`\`\``);
          }
        }

        fields.push({
          name: `Arguments`,
          value: usages.length > 0 
            ? usages.join(`\n`)
            : `None.`
        });

        // add permissions groups field (if applicable)
        if (foundCmd.metadata.permissionGroups) {
          fields.push({
            name: `Permission Group(s)`,
            value: foundCmd.metadata.permissionGroups.join(`, `)
          });
        }

        const embed = new EmbedBuilder()
          .setColor(cfg.discord.colors.default as ColorResolvable)
          .setTitle(`?${foundCmd.metadata.name}`)
          .setDescription(foundCmd.metadata.description)
          .addFields(fields)
          .setFooter({ text: `For more commands, use ?help` });
      
        await message.reply({
          embeds: [ embed ]
        });
      }
    } else {
      // show commands list with given page number.
      const pageSize = 10;
      const maxPages = Math.ceil(memory.commands.length / pageSize);
      const targetRounded = Math.max(0, Math.min(targetPage, maxPages));

      // generate commands list for current page
      const fields = [];
      const loopStart = (targetRounded * pageSize);
      // loop ends once we hit pageSize OR end of commands array
      const loopEnd = Math.min(loopStart + pageSize, memory.commands.length);

      for (let i = loopStart; i < loopEnd; i++) {
        const cmd = memory.commands[i];
        fields.push({
          name: `?${cmd.metadata.name}`,
          value: cmd.metadata.description
        });
      }

      const embed = new EmbedBuilder()
        .setColor(cfg.discord.colors.default as ColorResolvable)
        .setTitle(`List of Commands`)
        .setDescription(`Page ${targetRounded+1}/${maxPages}`)
        .addFields(fields)
        .setFooter({ text: `To see more commands, use ?help <page #>` });
    
      await message.reply({
        embeds: [ embed ]
      });
    }
  };

  // TODO
  // revoltHandler = async (message: RevoltMessage) => {
  // };
}

export default new HelpCommand();