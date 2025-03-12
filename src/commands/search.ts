import { EmbedBuilder, Message as DiscordMessage, ColorResolvable } from "discord.js";
// import { Message as RevoltMessage } from "revolt.js";
// eslint-disable-next-line @typescript-eslint/quotes
import cfg from '../../config/config.json' with { type: 'json' };
import { type Command, type CommandMetadata } from "../types/Command.js";
import { memory as discordMemory } from "../modules/discord/memory.js";
import { diceCoefficient } from "dice-coefficient";

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
    const errorEmbed = new EmbedBuilder()
      .setColor(cfg.discord.colors.error as ColorResolvable)
      .setTitle(`You must specify a search query.`)
      .setFooter({ text: `To list all commands, use ?help.` });
    
    return await message.reply({
      embeds: [ errorEmbed ]
    });
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

  searchData.sort((a, b) => b.highestVal - a.highestVal);
  searchData.splice(10);

  const embed = new EmbedBuilder()
    .setColor(cfg.discord.colors.default as ColorResolvable)
    .setTitle(`Command Search Results`)
    .setFooter({ text: `To list all commands, use ?help.` });

  let descString = ``;
  for (let i = 0; i < searchData.length; i++) {
    const result = searchData[i];

    descString += [
      `${i+1}. **${result.cmd.metadata.name}**  `,
      `  -# ${result.cmd.metadata.description}  `,
      ``
    ].join(`\n`);
  }

  embed.setDescription(descString);

  await message.reply({
    embeds: [ embed ]
  });
}

export default {
  metadata,
  discordHandler,
  // revoltHandler
} as Command;