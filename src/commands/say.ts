import { AllowedMentionsTypes, Message as DiscordMessage } from "discord.js";
// import { Message as RevoltMessage } from "revolt.js";
import { type Command, type CommandMetadata } from "../types/Command.js";

const metadata: CommandMetadata = {
  name: `say`,
  description: `Speak as Avery!`,
  usage: [ `[message]` ]
};

async function discordHandler(message: DiscordMessage) {
  const words = message.content.split(` `);
  words.shift();
  let intendedMessage = words.join(` `).trim();

  if (intendedMessage.length === 0) {
    intendedMessage = `_ _`; // because funny
  }

  await message.delete();
  await message.channel.send({
    content: intendedMessage,
    allowedMentions: {
      // @everyone is already globally disabled, and i
      // don't think it normally has the ability to 
      // ping any role? but better safe than sorry.
      parse: [ AllowedMentionsTypes.User ]
    }
  });
}

export default {
  metadata,
  discordHandler
} as Command;