import { EmbedBuilder, Message as DiscordMessage, ColorResolvable } from "discord.js";
// import { Message as RevoltMessage } from "revolt.js";
// eslint-disable-next-line @typescript-eslint/quotes
import cfg from '../../config/config.json' with { type: 'json' };
import { type Command, type CommandMetadata } from "../types/Command.js";
import { memory as discordMemory } from "../modules/discord/memory.js";
import { permissionCheck } from "../util/permissions.js";
import { jaroWinkler } from "@skyra/jaro-winkler";

const metadata: CommandMetadata = {
  name: `help`,
  aliases: [ `commands` ],
  description: `List or get details about specific commands.`,
  usage: [
    `[command name/alias]`,
    `[page #]`
  ]
};

async function discordHandler(message: DiscordMessage, args: string[]) {
  // page number should always be 0 if no arguments are provided.
  const targetPage = parseInt(args[0] ?? 0);
  if (isNaN(targetPage)) {
    // argument wasnt a number, so assume we're looking for a command
    const query = args[0].toLowerCase();
    let foundCmd = null;
    let closestMatchCmd = null;
    let closestMatchName = ``;
    let matchConfidence = 0;
    let foundSimilar = false;

    exactSearch: for (const cmd of discordMemory.commands) {
      const names = [ cmd.metadata.name ];
      if (cmd.metadata.aliases) names.push(...cmd.metadata.aliases);

      for (const name of names) {
        if (name === query) {
          foundCmd = cmd;
          break exactSearch;
        }

        const similarity = jaroWinkler(query, name);

        if (similarity > matchConfidence) {
          closestMatchCmd = cmd;
          closestMatchName = name;
          matchConfidence = similarity;
        }
      }
    }

    if (!foundCmd && matchConfidence > 0.9) {
      foundCmd = closestMatchCmd;
      foundSimilar = true;
    }

    if (foundCmd == null) {
      const embed = new EmbedBuilder()
        .setColor(cfg.discord.colors.error as ColorResolvable)
        .setTitle(`?${query}`.substring(0, 256)) // see https://discord.com/developers/docs/resources/message#embed-object-embed-limits
        .setFooter({ text: `To list all valid commands, use ?help.` });

      if (matchConfidence > 0.6) {
        embed.setDescription([
          `Could not find a command matching this name.`,
          `-# (Did you mean \`?${closestMatchName}\`?)`
        ].join(`\n`));
      } else {
        embed.setDescription(`This command does not exist.`);
      }
    
      await message.reply({
        embeds: [ embed ]
      });
    } else {
      const embed = new EmbedBuilder()
        .setColor(cfg.discord.colors.default as ColorResolvable)
        .setTitle(`?${foundCmd.metadata.name}`)
        .setDescription(foundCmd.metadata.description);

      if (foundSimilar) {
        embed.setFooter({ text: `Closest match to "${query}" (${parseFloat((matchConfidence * 100).toFixed(2))}% confidence)` });
      }

      // add aliases field (if applicable)
      const aliases = [];
      if (foundCmd.metadata.aliases) {
        for (const alias of foundCmd.metadata.aliases) {
          aliases.push(`\`?${alias}\``);
        }
      }

      if (aliases.length > 0) {
        embed.addFields({
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

      embed.addFields({
        name: `Arguments`,
        value: usages.length > 0 
          ? usages.join(`\n`)
          : `None.`
      });

      // add permissions groups field (if applicable)
      if (foundCmd.metadata.permissionGroups) {
        if (message.member == null) throw new Error(`Message member is null.`);
        const isAllowed = permissionCheck(
          Array.from(message.member.roles.cache.keys()), 
          foundCmd.metadata.permissionGroups
        );

        const groupsValue = [
          `\`\`\`${foundCmd.metadata.permissionGroups.join(`, `)}\`\`\``,
          isAllowed
            ? `-# (You can use this command.)`
            : `-# (No, you cannot use this command.)`
        ].join(`\n`);

        embed.addFields({
          name: `Permission Group(s)`,
          value: groupsValue
        });
      }

      // done!
      await message.reply({
        embeds: [ embed ]
      });
    }
  } else {
    // show commands list with given page number.
    const pageSize = 10;
    const maxPages = Math.ceil(discordMemory.commands.length / pageSize);
    const targetRounded = Math.max(0, Math.min(targetPage, maxPages-1));

    // generate commands list for current page
    const fields = [];
    const loopStart = (targetRounded * pageSize);
    // loop ends once we hit pageSize OR end of commands array
    const loopEnd = Math.min(loopStart + pageSize, discordMemory.commands.length);

    for (let i = loopStart; i < loopEnd; i++) {
      const cmd = discordMemory.commands[i];
      fields.push({
        name: `?${cmd.metadata.name}`,
        value: `-# ` + cmd.metadata.description
      });
    }

    const embed = new EmbedBuilder()
      .setColor(cfg.discord.colors.default as ColorResolvable)
      .setTitle(`List of Commands`)
      .addFields(fields)
      .setFooter({ text: `Page ${targetRounded+1}/${maxPages}  ⦁︎  To see more commands, use ?help [page #]` });
  
    await message.reply({
      embeds: [ embed ]
    });
  }
}

export default {
  metadata,
  discordHandler,
  // revoltHandler
} as Command;