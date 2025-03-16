import { Message as DiscordMessage } from "discord.js";
import { Message as RevoltMessage } from "revolt.js";
// eslint-disable-next-line @typescript-eslint/quotes
import pkg from "../../package.json" with { type: 'json' };
// eslint-disable-next-line @typescript-eslint/quotes
import cfg from '../../config/config.json' with { type: 'json' };
import { type Command, type CommandMetadata } from "../types/Command.js";
import { UniversalEmbed } from "../util/universalEmbed.js";

const metadata: CommandMetadata = {
  name: `embedtest`,
  description: `embed colors and icons test`,
  permissionGroups: [ `admin` ]
};

async function discordHandler(message: DiscordMessage) {
  const embed1 = await new UniversalEmbed(message)
    .setIcon(`info.png`)
    .setTitle(`embed 1`)
    .setDescription([
      `# header 1`,
      `## header 2`,
      `### header 3`, 
      ``,
      `-# subtext`,
      ``,
      `1. numbered list`,
      `2. numbered list`,
      `3. numbered list`,
      ``,
      `- unordered list`,
      `- unordered list`,
      `- unordered list`,
      ``,
      `> quote`,
      ``,
      `\`\`\`code block\`\`\``,
      ``,
      `\`inline code block\``,
      ``,
      `|| spoilered text ||`
    ].join(`\n`))
    .generateObjects();

  const embed2 = await new UniversalEmbed(message)
    .setVibe(`success`)
    .setIcon(`checkmark.png`)
    .setTitle(`embed 2`)
    .generateObjects();

  const embed3 = await new UniversalEmbed(message)
    .setVibe(`warning`)
    .setIcon(`warning.png`)
    .setTitle(`embed 3`)
    .generateObjects();

  const embed4 = await new UniversalEmbed(message)
    .setVibe(`error`)
    .setIcon(`error.png`)
    .setTitle(`embed 4`)
    .generateObjects();

  await message.reply({
    embeds: [ 
      embed1.embed, 
      embed2.embed, 
      embed3.embed, 
      embed4.embed 
    ],
    files: [ 
      ...embed1.attachments,
      ...embed2.attachments,
      ...embed3.attachments,
      ...embed4.attachments
    ]
  });
}

async function revoltHandler(message: RevoltMessage) {
  const embed = {
    colour: cfg.colors.default,
    title: `Avery ${pkg.version}`,
    description: [
      `The best bot in the entire world.`,
      ``,
      `Source Code on GitHub:`,
      `https://github.com/JackDotJS/avery`
    ].join()
  };

  await message.reply({
    embeds: [ embed ]
  });
}

export default {
  metadata,
  discordHandler,
  revoltHandler
} as Command;