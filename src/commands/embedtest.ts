import { EmbedBuilder, Message as DiscordMessage, ColorResolvable } from "discord.js";
import { Message as RevoltMessage } from "revolt.js";
// eslint-disable-next-line @typescript-eslint/quotes
import pkg from "../../package.json" with { type: 'json' };
// eslint-disable-next-line @typescript-eslint/quotes
import cfg from '../../config/config.json' with { type: 'json' };
import { type Command, type CommandMetadata } from "../types/Command.js";
import { getIconDiscord } from "../util/getIcon.js";

const metadata: CommandMetadata = {
  name: `embedtest`,
  description: `embed colors and icons test`,
  permissionGroups: [ `admin` ]
};

async function discordHandler(message: DiscordMessage) {
  const attachment1 = await getIconDiscord(`info.png`, `default`);
  const attachment2 = await getIconDiscord(`checkmark.png`, `success`);
  const attachment3 = await getIconDiscord(`warning.png`, `warning`);
  const attachment4 = await getIconDiscord(`error.png`, `error`);

  const embed1 = new EmbedBuilder()
    .setAuthor({
      iconURL: `attachment://${attachment1.name}`,
      name: `embed 1`
    })
    .setColor(cfg.colors.default as ColorResolvable)
    .setTitle(`default`)
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
    ].join(`\n`));
  
  const embed2 = new EmbedBuilder()
    .setAuthor({
      iconURL: `attachment://${attachment2.name}`,
      name: `embed 2`
    })
    .setColor(cfg.colors.success as ColorResolvable)
    .setTitle(`success`);

  const embed3 = new EmbedBuilder()
    .setAuthor({
      iconURL: `attachment://${attachment3.name}`,
      name: `embed 3`
    })
    .setColor(cfg.colors.warning as ColorResolvable)
    .setTitle(`warning`);

  const embed4 = new EmbedBuilder()
    .setAuthor({
      iconURL: `attachment://${attachment4.name}`,
      name: `embed 4`
    })
    .setColor(cfg.colors.error as ColorResolvable)
    .setTitle(`error`);

  await message.reply({
    embeds: [ embed1, embed2, embed3, embed4 ],
    files: [ attachment1, attachment2, attachment3, attachment4 ]
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