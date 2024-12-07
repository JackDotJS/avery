import { Message as DiscordMessage } from "discord.js";
import { Message as RevoltMessage } from "revolt.js";
import { BaseCommand } from "../classes/Command.js";

class ThrowCommand extends BaseCommand {
  constructor() {
    super({
      name: `throw`,
      description: `error handler test`,
      permissionGroups: [ `admin` ]
    });
  }

  discordHandler = async (message: DiscordMessage) => {
    throw new Error(`Error Example`);
  };

  revoltHandler = async (message: RevoltMessage) => {
    throw new Error(`Error Example`);
  };
}

export default new ThrowCommand();