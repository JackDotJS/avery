import { fork } from 'child_process';
import { createWriteStream, copyFileSync, WriteStream, existsSync, mkdirSync } from 'fs';
import { inspect } from 'util';
import { fileURLToPath } from 'url';
import { dirname, basename } from 'path';
import { Logger, IPCLoggerObject } from './util/logger.js';

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
  
  if (exit) {
    process.exit(code);
  }

  setTimeout(() => {
    start();
  }, 10000);
};

function start() {
  const createDirs = [
    `./log`,
    `./log/all`,
    `./log/crash`
  ];

  // create log directories if they don't exist already
  for (const directory of createDirs) {
    if (!existsSync(directory)) {
      mkdirSync(directory);
    }
  }

  output.filename = new Date().toUTCString().replace(/[/\\?%*:|"<>]/g, `.`);
  output.stream = createWriteStream(`./log/all/${output.filename}.log`);
  output.log = new Logger(output.stream);

  const startPath = dirname(fileURLToPath(import.meta.url)) + `/process.js`;
  output.log.debug(`Starting child process: ${startPath}`);

  const sm = fork(startPath, {
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

  sm.on(`message`, (data: unknown) => {
    if (data === null) {
      output.log.warn(`Child process sent null message.`);
      return;
    }

    if (typeof data === `object`) {
      const dataObject = data as IPCLoggerObject;
      switch (dataObject.t) {
        case `LOG`:
          console.log(dataObject.c.color);
          output.stream.write(dataObject.c.plain);
          break;
        default:
          output.log.debug(inspect(dataObject)); // to the debugeon with you
      }
    } else {
      output.log.debug(inspect(data)); // to the debugeon with you
    }
  });

  sm.on(`error`, err => {
    output.log.fatal(err.stack);
  });

  sm.on(`close`, exit);
}

start();