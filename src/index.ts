import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { createWriteStream, copyFileSync, WriteStream } from 'fs';
import { inspect } from 'util';
import { fileURLToPath } from 'url';
import { dirname, basename } from 'path';
import { Logger } from './util/logger.js';
import cfg from '../config/config.json' assert { type: "json" };

type output = {
  log: Logger
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
  output.log.warn(`Child process closed with exit code ${code}`)

  let exit = true;
  let report = true;
  let checkLoop = true;

  switch (code) {
    case 0:
      output.log.info(`Process complete or shutting down at user request.`);
      report = false;
      checkLoop = false;
      break;
    case 1:
      output.log.info(`Process seems to have crashed. Restarting...`, `info`);
      exit = false;
      break;
    case 16:
      output.log.info(`Process restarting at user request...`, `info`);
      exit = false;
      report = false;
      checkLoop = false;
      break;
    case 17:
      output.log.info(`Process undergoing scheduled restart.`, `info`);
      exit = false;
      report = false;
      checkLoop = false;
      break;
    case 18:
      output.log.info(`Process shutting down automatically.`, `fatal`);
      checkLoop = false;
      break;
  }

  if (checkLoop) {
    // if it's been more than 1 hour since last restart, reset the counter
    if (resetTime + (1000 * 60 * 60) > Date.now()) {
      resets = 0;
    }

    if (resets >= cfg.resets.warningThreshold) {
      output.log.warn(`Unusually high client reset count: ${resets}`)
    }

    if (resets >= cfg.resets.shutdownThreshold) {
      output.log.fatal(`Boot loop possibly detected, shutting down for safety.`)
      exit = true;
      report = true;
    }
  }

  output.stream.close();

  if (report) {
    copyFileSync(output.stream.path, `./log/crash/${basename(output.stream.path.toString())}`);
  } 

  setTimeout(() => {
    if (exit) {
      return process.exit(code);
    }

    start();
  }, 5000);
}

const start = () => {
  console.clear();

  output.filename = new Date().toUTCString().replace(/[/\\?%*:|"<>]/g, `.`);
  output.stream = createWriteStream(`./log/all/${output.filename}.log`);
  output.log = new Logger(output.stream);

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
      output.log.info(data);
    });
    
    sm.stderr.on(`data`, (data) => {
      output.log.error(data);
    });
  }

  sm.on(`message`, (data: any) => {
    switch (data.t) {
      case `LOG`:
        console.log(data.c.color);
        output.stream.write(data.c.plain);
        break;
      default:
        output.log.debug(inspect(data)); // to the debugeon with you
    }
  });

  sm.on(`error`, err => {
    output.log.fatal(err.stack);
  });

  sm.on(`close`, exit);
}

start();