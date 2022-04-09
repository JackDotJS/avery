import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { createWriteStream, copyFileSync, WriteStream } from 'fs';
import { inspect } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Logger } from './util/logger.js';
import cfg from '../config/config.json' assert { type: "json" };

type output = {
  filename: String,
  stream: WriteStream
}

const output = {} as output;

// quick confirmation before actually starting
const cli = createInterface({
  input: process.stdin,
  output: process.stdout
});

console.clear();

await new Promise((resolve: Function, reject: Function) => {
  cli.question(`START [Y/N]`, (res) => {
    if (res.trim().toLowerCase() === `y`) return resolve();
    if (res.trim().toLowerCase() === `n`) return process.exit();
    reject();
  });
});

cli.close();

let resets: number = 0;
let resetTime: number = Date.now();

const exit = (code: number) => {
  // todo
}

const start = () => {
  console.clear();

  output.filename = new Date().toUTCString().replace(/[/\\?%*:|"<>]/g, `.`);
  output.stream = createWriteStream(`./log/all/${output.filename}.log`);
  const log = new Logger(output.stream);

  // if it's been more than 1 hour since last restart, reset the counter
  if (resetTime + (1000 * 60 * 60) > Date.now()) {
    resets = 0;
  }

  if (resets >= cfg.resets.warningThreshold) {
    log.warn(`Unusually high client reset count: ${resets}`)
  }

  if (resets >= cfg.resets.shutdownThreshold) {
    log.fatal(`Boot loop possibly detected, shutting down for safety.`)
    return exit(18);
  }

  const sm = spawn(`node`, [`${dirname(fileURLToPath(import.meta.url))}/process.js`], {
    env: {
      FORCE_COLOR: `true`
    },
    stdio: [`pipe`,`pipe`,`pipe`,`ipc`]
  });

  if (sm.stdout != null && sm.stderr != null) {
    sm.stdout.setEncoding(`utf8`);
    sm.stderr.setEncoding(`utf8`);

    sm.stdout.on(`data`, (data) => {
      log.info(data);
    });
    
    sm.stderr.on(`data`, (data) => {
      log.error(data);
    });
  }

  sm.on(`message`, (data: any) => {
    switch (data.t) {
      case `LOG`:
        console.log(data.c.color);
        output.stream.write(data.c.plain);
        break;
      default:
        log.debug(inspect(data)); // to the debugeon with you
    }
  });

  sm.on(`error`, err => {
    log.fatal(err.stack);
  });

  sm.on(`close`, exit);
}

start();