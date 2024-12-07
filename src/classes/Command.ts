import { Message as DiscordMessage } from "discord.js";
import { Message as RevoltMessage } from "revolt.js";

export interface CommandMetadata {
  name: string,
  aliases?: string[],
  permissionGroups?: string[]
  description: string
}

export type CommandDiscordHandler = ((message: DiscordMessage) => Promise<void>) | null;
export type CommandRevoltHandler = ((message: RevoltMessage) => Promise<void>) | null;

export class BaseCommand {
  metadata: CommandMetadata;
  discordHandler: CommandDiscordHandler = null;
  revoltHandler: CommandRevoltHandler = null;

  constructor(md: CommandMetadata) {
    this.metadata = md;
  }
}