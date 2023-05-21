import { spawn } from 'child_process';
import { createWriteStream, copyFileSync, WriteStream } from 'fs';
import { inspect } from 'util';
import { fileURLToPath } from 'url';
import { dirname, basename } from 'path';
import { Logger } from './util/logger.js';
// typescript eslint doesn't understand yet that import assertions require normal quotes
// eslint-disable-next-line @typescript-eslint/quotes
import cfg from '../config/config.json' assert { type: 'json' };

type output = {
  log: Logger
  filename: string,
  stream: WriteStream
};

const output = {} as output;

let resets = 0;
const resetTime: number = Date.now();

const exit = (code: number) => {
  // https://nodejs.org/api/process.html#process_exit_codes
  output.log.warn(`Child process closed with exit code ${code}`);

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
      output.log.warn(`Unusually high client reset count: ${resets}`);
    }

    if (resets >= cfg.resets.shutdownThreshold) {
      output.log.fatal(`Boot loop possibly detected, shutting down for safety.`);
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
  }, 10000);
};

function start() {
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