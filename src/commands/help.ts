import { Message as DiscordMessage } from "discord.js";
// import { Message as RevoltMessage } from "revolt.js";
import { type Command, type CommandMetadata } from "../types/Command.js";
import { memory as discordMemory } from "../modules/discord/memory.js";
import { permissionCheck } from "../util/permissions.js";
import { jaroWinkler } from "@skyra/jaro-winkler";
import { UniversalEmbed } from "../util/universalEmbed.js";

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
      let cmdTruncated = query.substring(0, 64);
      if (cmdTruncated.length < query.length) {
        cmdTruncated += `...`;
      }

      let descBody = [
        `### Couldn't find any information on command \`?${cmdTruncated}\`.`
      ];

      if (matchConfidence > 0.75) {
        descBody.push(`(Did you mean \`?${closestMatchName}\`?)`);
      }

      await new UniversalEmbed(message)
        .setVibe(`error`)
        .setIcon(`document.png`)
        .setTitle(`Avery Commands`)
        .setDescription([
          descBody.join(`\n`),
          ``,
          `-# To list all valid commands, use \`?help\`.`
        ].join(`\n`))
        .submitReply();
    } else {
      const descBody = [];

      if (foundSimilar) {
        descBody.push(`-# Closest match to "${query}" (${Math.round(matchConfidence * 100)}% confidence)`);
      }

      descBody.push(
        `# ?${foundCmd.metadata.name}`,
        foundCmd.metadata.description
      );

      // add aliases
      const aliases = [];
      if (foundCmd.metadata.aliases) {
        for (const alias of foundCmd.metadata.aliases) {
          aliases.push(`\`?${alias}\``);
        }
      }

      if (aliases.length > 0) {
        descBody.push(
          `### Alias(es)`,
          aliases.join(`, `)
        );
      }

      // add arguments/usage
      const usages = [];
      if (foundCmd.metadata.usage) {
        for (const usageExample of foundCmd.metadata.usage) {
          usages.push(`\`\`\`?${foundCmd.metadata.name} ${usageExample}\`\`\``);
        }
      }

      descBody.push(
        `### Arguments`,
        usages.length > 0 ? usages.join(`\n`) : `None.`
      );

      // add permissions groups
      if (foundCmd.metadata.permissionGroups) {
        if (message.member == null) throw new Error(`Message member is null.`);

        const groupsValue = [];

        for (const group of foundCmd.metadata.permissionGroups) {
          groupsValue.push(`\`${group}\``);
        }

        descBody.push(
          `### Permission Group(s)`,
          groupsValue.join(`, `)
        );

        const isAllowed = permissionCheck(
          Array.from(message.member.roles.cache.keys()), 
          foundCmd.metadata.permissionGroups
        );

        if (isAllowed) {
          descBody.push(`-# (You can use this command.)`);
        } else {
          descBody.push(`-# (No, you cannot use this command.)`);
        }
      }

      // done!
      await new UniversalEmbed(message)
        .setIcon(`document.png`)
        .setTitle(`Avery Commands`)
        .setDescription(descBody.join(`\n`))
        .submitReply();
    }
  } else {
    // show commands list with given page number.
    const pageSize = 10;
    const maxPages = Math.ceil(discordMemory.commands.length / pageSize);
    const targetRounded = Math.max(0, Math.min(targetPage, maxPages-1));

    // generate commands list for current page
    let descBody = ``;
    const loopStart = (targetRounded * pageSize);
    // loop ends once we hit pageSize OR end of commands array
    const loopEnd = Math.min(loopStart + pageSize, discordMemory.commands.length);

    for (let i = loopStart; i < loopEnd; i++) {
      const cmd = discordMemory.commands[i];
  
      descBody += [
        `### ${cmd.metadata.name}  `,
        `-# ${cmd.metadata.description}`,
        ``
      ].join(`\n`);
    }

    await new UniversalEmbed(message)
      .setIcon(`document.png`)
      .setTitle(`Avery Commands`)
      .setDescription([
        descBody,
        `-# Page ${targetRounded+1}/${maxPages}  ⦁︎  To see more commands, use \`?help [page #]\`.`
      ].join(`\n`))
      .submitReply();
  }
}

export default {
  metadata,
  discordHandler,
  // revoltHandler
} as Command;