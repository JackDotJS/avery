import { type Command, type CommandMetadata } from "../types/Command.js";

const metadata: CommandMetadata = {
  name: `throw`,
  description: `error handler test`,
  permissionGroups: [ `admin` ]
};

async function discordHandler() {
  throw new Error(`Error Example`);
}

async function revoltHandler() {
  throw new Error(`Error Example`);
}

export default {
  metadata,
  discordHandler,
  revoltHandler
} as Command;