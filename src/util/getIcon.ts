import { AttachmentBuilder } from "discord.js";
import { readFile } from "fs/promises";

export type IconVibe = `default` | `success` | `warning` | `error`;

const iconsDir = `./icons`;

export async function getIconDiscord(filename: string, vibe: IconVibe) {
  const file = await readFile(`${iconsDir}/${vibe}/${filename}`);
  return new AttachmentBuilder(file, { name: `${vibe}_${filename}` });
}

export async function getIconRevolt(filename: string, vibe: IconVibe) {
  return await readFile(`${iconsDir}/${vibe}/${filename}`);
}