import { Message as DiscordMessage } from "discord.js";
import { type Command, type CommandMetadata } from "../types/Command.js";
import { testTimeLength } from "../util/argumentParsers.js";

const metadata: CommandMetadata = {
  name: `time`,
  description: `arg parser test #1`,
  permissionGroups: [ `admin` ],
  usage: [ `<time>` ]
};

async function discordHandler(message: DiscordMessage, args: string[]) {
  if (args[0] == null) return await message.reply(`no value provided`);

  const timeResult = testTimeLength(args[0]);

  if (timeResult.isValid) {
    await message.reply(timeResult.readableString);
  } else {
    await message.reply(`input not valid`);
  }
}

// async function revoltHandler() {
// }

export default {
  metadata,
  discordHandler,
  // revoltHandler
} as Command;