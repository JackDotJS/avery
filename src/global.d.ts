import { Message as DiscordMessage } from "discord.js";
import { Message as RevoltMessage } from "revolt.js"

declare global {
  interface CommandMetadata {
    name: string,
    description: string
  }

  type DiscordCommand = (message: DiscordMessage) => void;
  type RevoltCommand = (message: RevoltMessage) => void;

  interface CommandModule {
    metadata: CommandMetadata,
    discord: {
      execute: DiscordCommand
    },
    revolt: {
      execute: RevoltCommand
    }
  }
}