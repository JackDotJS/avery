import { Message as DiscordMessage } from "discord.js";
import { type Command, type CommandMetadata } from "../types/Command.js";
import { testDiscordSnowflake } from "../util/argumentParsers.js";

const metadata: CommandMetadata = {
  name: `idtest`,
  description: `arg parser test #2`,
  permissionGroups: [ `admin` ],
  usage: [ 
    `<user>`,
    `<role>`,
    `<channel>`
  ]
};

async function discordHandler(message: DiscordMessage, args: string[]) {
  if (args[0] == null) return await message.reply(`no value provided`);

  const snowflakeResult = testDiscordSnowflake(args[0]);

  if (snowflakeResult.isValid) {
    await message.reply(snowflakeResult.id.toString());
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