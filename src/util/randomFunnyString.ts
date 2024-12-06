// eslint-disable-next-line @typescript-eslint/quotes
import funnyStrings from '../../config/strings.json' assert { type: 'json' }; 

const memoryLimit = 5;

const lastUsed = {
  user_was_x: [ 0 ],
  mention: [ 0 ],
  status: [ 0 ]
};

export function getFunnyString(type: `user_was_x` | `mention` | `status`) {
  const target = funnyStrings[type];

  let attempts = 0;
  const retryLimit = 10;
  let selection = 0;

  // retry RNG until we get a number that hasn't
  // been used the last ${memoryLimit} times.
  // ...or until we hit the retry limit.
  //
  // all of this is just to try avoiding using the 
  // same handful of strings over and over. as a
  // result, it's less *truly* random, but it ensures
  // we usually get to see more unique strings.

  do {
    selection = Math.floor(Math.random() * target.length);
    attempts++;
  } while (lastUsed[type].includes(selection) && attempts < retryLimit);
  
  // plan B: just offset the selection by 1 and call it a day.
  if (attempts === retryLimit) {
    if (selection === (target.length - 1)) {
      // if we're at the end of the array, use previous string
      selection--;
    } else {
      // ...otherwise use next string in array
      selection++;
    }
  }

  // save result to lastUsed
  lastUsed[type].push(selection);

  if (lastUsed[type].length > memoryLimit) {
    lastUsed[type].shift();
  }

  // done!
  return target[selection];
}