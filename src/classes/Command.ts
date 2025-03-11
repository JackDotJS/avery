import { Message as DiscordMessage } from "discord.js";
import { Message as RevoltMessage } from "revolt.js";

export type CommandMetadata = {
  name: string,
  aliases?: string[],
  permissionGroups?: string[],
  description: string,
  usage?: string[]
};

export type CommandDiscordHandler = ((message: DiscordMessage, args: string[]) => Promise<void>) | null;
export type CommandRevoltHandler = ((message: RevoltMessage, args: string[]) => Promise<void>) | null;

export class BaseCommand {
  metadata: CommandMetadata;
  discordHandler: CommandDiscordHandler = null;
  revoltHandler: CommandRevoltHandler = null;

  constructor(md: CommandMetadata) {
    this.metadata = md;
  }
}