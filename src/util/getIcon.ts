import { AttachmentBuilder } from "discord.js";
import { readFile } from "fs/promises";

export type IconVibe = `default` | `success` | `warning` | `error`;
export type IconContext = `discord` | `revolt`;

const iconsDir = `./icons`;

export async function getIconDiscord(filename: string, vibe: IconVibe) {
  const file = await readFile(`${iconsDir}/discord/${vibe}/${filename}`);
  return new AttachmentBuilder(file, { name: `icon.png` });
}

export async function getIconRevolt(filename: string, vibe: IconVibe) {
  return await readFile(`${iconsDir}/revolt/${vibe}/${filename}`);
}