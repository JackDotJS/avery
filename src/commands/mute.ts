import { Message as DiscordMessage } from "discord.js";
// import { Message as RevoltMessage } from "revolt.js";
import { type Command, type CommandMetadata } from "../types/Command.js";

const metadata: CommandMetadata = {
  name: `mute`,
  aliases: [ `timeout`, `silence` ],
  description: `Temporarily mute users.`,
  usage: [
    `<user> <time> [reason]`,
    `<time> <user> [reason]`
  ]
};

async function discordHandler(message: DiscordMessage) {
  await message.reply(`TODO`);
}

export default {
  metadata,
  discordHandler,
  // revoltHandler
} as Command;