import { AttachmentBuilder, ColorResolvable, Client as DiscordClient, Message as DiscordMessage, EmbedBuilder } from "discord.js";
// import { Message as RevoltMessage, Client as RevoltClient } from "revolt.js";
// eslint-disable-next-line @typescript-eslint/quotes
import cfg from '../../config/config.json' with { type: 'json' };
import { readFile } from "fs/promises";

export type EmbedVibe = `default` | `success` | `warning` | `error`;

// TODO
export type UniversalClientType = DiscordClient /*| RevoltClient*/;
export type UniversalMessageType = DiscordMessage /*| RevoltMessage*/;
export type UniversalContextType = UniversalMessageType | UniversalClientType;
export type UniversalEmbedData = {
  vibe: EmbedVibe,
  icon: string | null,
  title: string | null,
  description: string | null
};

export type UniversalEmbedExportDiscord = {
  embed: EmbedBuilder,
  attachments: AttachmentBuilder[]
};

const iconsDir = `./icons`;

export class UniversalEmbed {
  private context: `discord` | `revolt`;
  private client: DiscordClient; // TODO: might not be needed?
  private message: UniversalMessageType | null = null;
  data: UniversalEmbedData = {
    vibe: `default`,
    icon: null,
    title: null,
    description: null,
  };

  constructor(context: UniversalContextType) {
    // TODO
    /*if (context instanceof RevoltClient) {
      this.context = `revolt`;
      this.client = context;
    } else if (context instanceof RevoltMessage) {
      this.context = `revolt`;
      this.message = context;
      this.client = context.client;
    } else*/ if (context instanceof DiscordClient) {
      this.context = `discord`;
      this.client = context;
    } else {
      this.context = `discord`;
      this.message = context;
      this.client = context.client;
    }
  }

  setVibe(vibe: EmbedVibe) {
    this.data.vibe = vibe;
    return this;
  }

  setIcon(filename: string) {
    this.data.icon = filename;
    return this;
  }

  setTitle(title: string) {
    this.data.title = title;
    return this;
  }

  setDescription(desc: string) {
    this.data.description = desc;
    return this;
  }

  async generateObjects() {
    if (this.context === `discord`) {
      const result: UniversalEmbedExportDiscord = {
        embed: new EmbedBuilder(),
        attachments: []
      };

      let authorIconUrl;
      let authorName;

      // set embed color
      switch (this.data.vibe) {
        case `success`: 
          result.embed.setColor(cfg.colors.success as ColorResolvable);
          break;
        case `warning`: 
          result.embed.setColor(cfg.colors.warning as ColorResolvable);
          break;
        case `error`: 
          result.embed.setColor(cfg.colors.error as ColorResolvable);
          break;
        default: 
          result.embed.setColor(cfg.colors.default as ColorResolvable);
      }

      // get icon attachment
      if (this.data.icon) {
        if (cfg.icons.useCdn) {
          authorIconUrl = `${cfg.icons.cdnUrl}/${this.data.vibe}/${this.data.icon}`;
        } else {
          const file = await readFile(`${iconsDir}/${this.data.vibe}/${this.data.icon}`);

          const uploadedName = `${this.data.vibe}_${this.data.icon}`;
          authorIconUrl = `attachment://${uploadedName}`;
          result.attachments.push(new AttachmentBuilder(file, { name: uploadedName }));
        }
      }

      // set embed "author"
      if (this.data.title) {
        authorName = this.data.title;
      } else if (this.data.icon != null) {
        authorName = ` `;
      }

      if (authorName) {
        result.embed.setAuthor({
          iconURL: authorIconUrl,
          name: authorName
        });
      }

      // set embed description
      if (this.data.description) {
        result.embed.setDescription(this.data.description);
      }

      return result;
    } else {
      // TODO: PLACEHOLDER
      return {
        embed: new EmbedBuilder(),
        attachments: []
      };
    }
  }

  async submitReply() {
    if (this.message == null) throw new Error(`Could not reply to message (message object not provided)`);

    const objs = await this.generateObjects();

    if (this.context === `discord`) {
      await this.message.reply({
        embeds: [ objs.embed ],
        files: objs.attachments
      });
    } else {
      // TODO: PLACEHOLDER
      throw new Error(`NOT IMPLEMENTED`);
    }
  }
}