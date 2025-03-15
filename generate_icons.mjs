import { Jimp } from "jimp";
import { readdir, writeFile, mkdir } from "node:fs/promises";
// eslint-disable-next-line @typescript-eslint/quotes
import cfg from "./config/config.json"  with { type: 'json' };

const iconsDir = `./icons`;
const iconMasksDir = `${iconsDir}/_masks`;

const masksDir = await readdir(iconMasksDir, { withFileTypes: true });
const masksFiltered = masksDir.filter((entry) => entry.isFile());

console.log(`found ${masksFiltered.length} icon masks`);

// get color names and values from config.json
const allColors = [];

// these two contexts use essentially the same structure in 
// the config file so this is just an easy way of quickly
// iterating over both. this also makes it fairly easy to
// support additional platforms in the future, if that's
// ever needed.
for (const context of [`discord`, `revolt`]) {
  for (const colorName of Object.keys(cfg[context].colors)) {
    allColors.push({
      context: context,
      name: colorName,
      color: cfg[context].colors[colorName] 
    });
  }
}

console.log(`found ${allColors.length} colors in config`);

console.log(`total items to generate: ${masksFiltered.length * allColors.length} (not including directories)`);

// generate icons and write to disk
let written = 0;

for (const file of masksFiltered) {
  const mask = await Jimp.read(`${iconMasksDir}/${file.name}`);
  console.debug(`successfully read file: ${file.name}`);

  for (const colorData of allColors) {
    // create new image with the resolution of the current mask 
    // and a solid background using the current color
    const icon = new Jimp({
      width: mask.bitmap.width, 
      height: mask.bitmap.height, 
      color: colorData.color
    });
    console.debug(`blank icon created`);

    // apply icon mask
    icon.mask(mask, 0, 0);
    console.debug(`icon mask applied`);

    // get buffer that we can write to disk
    const buffer = await icon.getBuffer(`image/png`);
    console.debug(`got buffer`);

    // this should result in something like "./icons/discord/default/pencil.png"
    const outputDir = `${iconsDir}/${colorData.context}/${colorData.name}`;
    const outputFilePath = `${outputDir}/${file.name}`;

    console.debug(`making directories "${outputDir}"`);
    await mkdir(outputDir, { recursive: true });

    console.log(`writing "${outputFilePath}"...`);

    // done!
    await writeFile(outputFilePath, buffer);
    console.debug(`successfully wrote icon: ${outputFilePath}`);
    written++;
  }
}

console.log(`successfully generated ${written} icons!`);