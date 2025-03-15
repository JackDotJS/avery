import { EmbedBuilder, Message as DiscordMessage, ColorResolvable } from "discord.js";
import { Message as RevoltMessage } from "revolt.js";
// eslint-disable-next-line @typescript-eslint/quotes
import pkg from "../../package.json" with { type: 'json' };
// eslint-disable-next-line @typescript-eslint/quotes
import cfg from '../../config/config.json' with { type: 'json' };
import { type Command, type CommandMetadata } from "../types/Command.js";
import { getIconDiscord } from "../util/getIcon.js";

const metadata: CommandMetadata = {
  name: `about`,
  description: `All there is to know about Avery.`
};

async function discordHandler(message: DiscordMessage) {
  const attachment = await getIconDiscord(`info.png`, `default`);

  const embed = new EmbedBuilder()
    .setAuthor({
      iconURL: `attachment://${attachment.name}`,
      name: `About`
    })
    .setColor(cfg.discord.colors.default as ColorResolvable)
    .setTitle(`Avery ${pkg.version}`)
    .setDescription(`The best bot in the entire world.`)
    .addFields({
      name: `Source Code on GitHub`,
      value: `https://github.com/JackDotJS/avery`
    });

  await message.reply({
    embeds: [ embed ],
    files: [ attachment ]
  });
}

async function revoltHandler(message: RevoltMessage) {
  const embed = {
    colour: cfg.revolt.colors.default,
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