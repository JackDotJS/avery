import { Jimp } from "jimp";
import { GifUtil, GifFrame, GifCodec, Gif, BitmapImage } from "gifwrap";
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
for (const colorName of Object.keys(cfg.colors)) {
  allColors.push({
    name: colorName,
    color: cfg.colors[colorName] 
  });
}

console.log(`found ${allColors.length} colors in config`);

console.log(`total items to generate: ${masksFiltered.length * allColors.length} (not including directories)`);

// generate icons and write to disk
let written = 0;

for (const file of masksFiltered) {
  const images = [];

  if (file.name.toLowerCase().endsWith(`.png`)) {
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

      // this should result in something like "./icons/default/pencil.png"
      const outputDir = `${iconsDir}/${colorData.name}`;
      const outputFilePath = `${outputDir}/${file.name}`;
      
      // done!
      images.push({
        buffer,
        outputDir,
        outputFilePath
      });
    }
  }

  if (file.name.toLowerCase().endsWith(`.gif`)) {
    const mask = await GifUtil.read(`${iconMasksDir}/${file.name}`);
    console.debug(`successfully read file: ${file.name}`);

    for (const colorData of allColors) {
      const frames = [];

      for (const i in mask.frames) {
        // create new image with the resolution of the current mask 
        // and a solid background using the current color
        const currentFrame = new Jimp({
          width: mask.frames[i].bitmap.width, 
          height: mask.frames[i].bitmap.height, 
          color: colorData.color
        });

        // console.debug(mask.frames[i]);

        // get icon mask as Jimp object
        const currentFrameMask = new Jimp(mask.frames[i].bitmap);

        // remove all* grey colors from the mask
        // because gifs dont support partial transparency
        currentFrameMask.scan((x, y) => {
          const hex = currentFrameMask.getPixelColor(x, y);
          // *i'd make this filter everything below 0xffffffff, but
          // that makes the result flicker like crazy for some reason.
          //
          // it still gets most of the greyscale colors, so whatever
          if (hex < 0xfafafaff) currentFrameMask.setPixelColor(0x000000ff, x, y);
        });

        currentFrame.mask(currentFrameMask, 0, 0);

        // convert Jimp object to GifFrame
        // 
        // BitmapImage is important here because otherwise
        // previous frames are not discarded properly
        const currentFrameAsGifFrame = new GifFrame(new BitmapImage(currentFrame.bitmap));
        currentFrameAsGifFrame.delayCentisecs = mask.frames[i].delayCentisecs;

        // push to frames array
        frames.push(currentFrameAsGifFrame);
      }

      const codec = new GifCodec();

      // encode gif and get buffer
      const buffer = (await codec.encodeGif(frames, { loops: 0, colorScope: Gif.LocalColorsOnly })).buffer;
      const outputDir = `${iconsDir}/${colorData.name}`;
      const outputFilePath = `${outputDir}/${file.name}`;

      // done!
      images.push({
        buffer,
        outputDir,
        outputFilePath
      });
    }
  }

  for (const image of images) {
    // ensure directories exist
    console.debug(`making directories "${image.outputDir}"`);
    await mkdir(image.outputDir, { recursive: true });

    console.log(`writing "${image.outputFilePath}"...`);

    // write file
    await writeFile(image.outputFilePath, image.buffer);
    console.debug(`successfully wrote icon: ${image.outputFilePath}`);
    written++;
  }
}

console.log(`successfully generated ${written} icons!`);