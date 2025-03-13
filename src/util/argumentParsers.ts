import { jaroWinkler } from "@skyra/jaro-winkler";

export type SnowflakeTestResult = {
  isValid: boolean,
  id: string
};

export type TimeLengthTestResult = {
  isValid: boolean,
  readableString: string,
  milliseconds: number
};

// TODO: date parser

const discordEpoch = 1420070400000;

const timeMeasurements = [
  {
    name: `second`,
    length: 1000,
    strings: [ `s`, `sec`, `second` ]
  },
  {
    name: `minute`,
    length: 1000 * 60,
    strings: [ `m`, `min`, `minute` ]
  },
  {
    name: `hour`,
    length: 1000 * 60 * 60,
    strings: [ `h`, `hour` ]
  },
  {
    name: `day`,
    length: 1000 * 60 * 60 * 24,
    strings: [ `d`, `day` ]
  },
  {
    name: `week`,
    length: 1000 * 60 * 60 * 24 * 7,
    strings: [ `w`, `week` ]
  },
  {
    name: `month`,
    length: (1000 * 60 * 60 * 24 * 365.24) / 12,
    strings: [ `M`, `mo`, `month` ]
  },
  {
    name: `year`,
    length: 1000 * 60 * 60 * 24 * 365.24,
    strings: [ `y`, `year` ]
  }
];

export function testDiscordSnowflake(arg: string): SnowflakeTestResult {
  const result: SnowflakeTestResult = {
    isValid: false,
    id: ``
  };

  if (arg.length === 0) return result;

  let rawId = arg;

  const matchMention = arg.match(/(?<=<#|<@|<@!|<@&)\d{13,}(?=>)/);
  if (matchMention != null) rawId = matchMention[0];

  const idAsNumber = parseInt(rawId);
  if (!isNaN(idAsNumber) && idAsNumber > discordEpoch) {
    result.isValid = true;
    result.id = rawId;
  }

  return result;
}

export function testTimeLength(arg: string): TimeLengthTestResult {
  const result: TimeLengthTestResult = {
    isValid: false,
    readableString: `0 seconds`,
    milliseconds: 0
  };

  if (arg.length === 0) return result;

  // matchAll allows us to capture different lengths in the same string
  // so things like "1h30m" should be parsed correctly.
  //
  // periods are also part of the number group, which allows inputs
  // like "1.5h" to also work correctly. this *does* mean weird numbers 
  // like "3.1.5" could be captured as well, but this is already dealt 
  // with further down.
  const matches = [...arg.matchAll(/([0-9.]+)([^0-9.]+)/g)];
  if (matches.length === 0) return result;

  console.debug(`match success`);

  // parse input
  let totalTime = 0;
  
  for (const match of matches) {
    // fail if we get some weird number with multiple decimal points like "3.1.5.2"
    if (match[1].split(`.`).length > 2) return result;

    const numberInput = parseFloat(match[1]);
    const timeInput = match[2];

    let mostSimilarMeasurement = timeMeasurements[0];
    let similarityScore = 0;

    measureLoop: for (const measurement of timeMeasurements) {
      for (const timeString of measurement.strings) {
        if (timeString === timeInput) {
          // 100% match, no need to continue
          mostSimilarMeasurement = measurement;
          break measureLoop;
        }

        const similarity = jaroWinkler(timeString, timeInput.toLowerCase());

        if (similarity > similarityScore) {
          mostSimilarMeasurement = measurement;
          similarityScore = similarity;
        }
      }
    }

    totalTime += numberInput * mostSimilarMeasurement.length;
  }

  result.isValid = true;

  // get human-readable string
  let currentMeasurement = `second`;
  let currentValue = totalTime;

  for (const measurement of timeMeasurements) {
    const divided = totalTime / measurement.length;

    // stop if new value would start with a 0
    if (divided < 1) break;

    currentMeasurement = measurement.name;
    currentValue = divided;
  }

  // round to first decimal place
  // parseFloat() is used to remove trailing zeroes as needed
  currentValue = parseFloat(currentValue.toFixed(1));

  result.readableString = `${currentValue} ${currentMeasurement}`;
  if (currentValue !== 1) result.readableString += `s`;

  return result;
}