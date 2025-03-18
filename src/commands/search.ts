import { Message as DiscordMessage } from "discord.js";
// import { Message as RevoltMessage } from "revolt.js";
import { type Command, type CommandMetadata } from "../types/Command.js";
import { memory as discordMemory } from "../modules/discord/memory.js";
import { diceCoefficient } from "dice-coefficient";
import { UniversalEmbed } from "../util/universalEmbed.js";

type SearchResult = {
  cmd: Command,
  highestVal: number
};

const metadata: CommandMetadata = {
  name: `search`,
  aliases: [ `find` ],
  description: `Find commands using search queries.`,
  usage: [ `<query>` ]
};

async function discordHandler(message: DiscordMessage, args: string[]) {
  if (args.length === 0) {
    return await new UniversalEmbed(message)
      .setVibe(`error`)
      .setIcon(`error.png`)
      .setTitle(`Error`)
      .setDescription([
        `You must specify a search query.`,
        `-# To list all commands, use \`?help\`.`
      ].join(`\n`))
      .submitReply();
  }

  const query = args.join(` `);

  const searchData: SearchResult[] = [];

  for (const cmd of discordMemory.commands) {
    let highestVal = diceCoefficient(cmd.metadata.name, query);

    let testAliases = 0;
    if (cmd.metadata.aliases) {
      for (const alias of cmd.metadata.aliases) {
        const aliasSimilarity = diceCoefficient(alias, query);
        if (aliasSimilarity > testAliases) testAliases = aliasSimilarity;
      }
    }

    const testDescription = diceCoefficient(cmd.metadata.description, query);

    let testUsage = 0;
    if (cmd.metadata.usage) {
      for (const usage of cmd.metadata.usage) {
        const usageSimilarity = diceCoefficient(usage, query);
        if (usageSimilarity > testUsage) testUsage = usageSimilarity;
      }
    }

    let testPermissions = 0;
    if (cmd.metadata.permissionGroups) {
      for (const group of cmd.metadata.permissionGroups) {
        const groupSimilarity = diceCoefficient(group, query);
        if (groupSimilarity > testPermissions) testPermissions = groupSimilarity;
      }
    }

    if (testAliases > highestVal) {
      highestVal = testAliases;
    }

    if (testDescription > highestVal) {
      highestVal = testDescription;
    }

    if (testUsage > highestVal) {
      highestVal = testUsage;
    }

    if (testPermissions > highestVal) {
      highestVal = testPermissions;
    }

    searchData.push({
      cmd,
      highestVal
    });
  }

  // sort highest to lowest similarity
  searchData.sort((a, b) => b.highestVal - a.highestVal);
  // reduce to 10 items
  searchData.splice(10);

  let descBody = ``;
  for (let i = 0; i < searchData.length; i++) {
    const result = searchData[i];

    descBody += [
      `### ${result.cmd.metadata.name}  `,
      `-# ${result.cmd.metadata.description}`,
      ``
    ].join(`\n`);
  }

  await new UniversalEmbed(message)
    .setIcon(`document.png`)
    .setTitle(`Search Results`)
    .setDescription(descBody)
    .submitReply();
}

export default {
  metadata,
  discordHandler,
  // revoltHandler
} as Command;