import { EmbedBuilder, Message as DiscordMessage, ColorResolvable } from "discord.js";
import { Message as RevoltMessage } from "revolt.js";
// eslint-disable-next-line @typescript-eslint/quotes
import pkg from "../../package.json" with { type: 'json' };
// eslint-disable-next-line @typescript-eslint/quotes
import cfg from '../../config/config.json' with { type: 'json' };
import { BaseCommand } from "../classes/Command.js";

class AboutCommand extends BaseCommand {
  constructor() {
    super({
      name: `help`,
      aliases: [ `commands` ],
      description: `List or get details about specific commands.`
    });
  }

  discordHandler = async (message: DiscordMessage) => {
    const embed = new EmbedBuilder()
      .setColor(cfg.discord.colors.default as ColorResolvable)
      .setTitle(`Avery ${pkg.version}`)
      .setDescription(`The best bot in the entire world.`)
      .addFields({
        name: `Source Code on GitHub`,
        value: `https://github.com/JackDotJS/avery`
      });
  
    await message.reply({
      embeds: [ embed ]
    });
  };

  revoltHandler = async (message: RevoltMessage) => {
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
  };
}

export default new AboutCommand();