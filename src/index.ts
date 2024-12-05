import { ChildProcess, fork } from 'child_process';
import { createWriteStream, copyFileSync, WriteStream, existsSync, mkdirSync, readdirSync } from 'fs';
import { inspect } from 'util';
import { fileURLToPath } from 'url';
import { dirname, basename } from 'path';
import { Logger, IPCLoggerObject } from './util/logger.js';

// TODO: module-agnostic global logs

// typescript eslint doesn't understand yet that import assertions require normal quotes
// eslint-disable-next-line @typescript-eslint/quotes
import cfg from '../config/config.json' assert { type: 'json' };

interface ModuleInfo {
  process: ChildProcess,
  name: string,
  spawnTimestamp: Date,
  lastRespawn: Date,
  totalRespawns: number,
  respawnWarnCounter: number
}

const activeModules: ModuleInfo[] = [];

const modulesDir = `${dirname(fileURLToPath(import.meta.url))}/modules/`;
if (!existsSync(modulesDir)) {
  throw new Error(`Could not find modules directory at ${modulesDir}`);
}

function getModuleIndex(targetModuleName: string): number {
  for (let i = 0; i < activeModules.length; i++) {
    const module = activeModules[i];
    if (module.name === targetModuleName) {
      return i;
    }
  }

  return -1;
}

function checkAllModulesClosed() {
  if (activeModules.length === 0) {
    console.log(`All modules permanently closed. Exiting...`);
    process.exit();
  }
}

function spawnModule(modulePath: string, moduleName: string) {
  const createDirs = [
    `./log/${moduleName}/all`,
    `./log/${moduleName}/crash`
  ];
  
  // create log directories if they don't exist already
  for (const directory of createDirs) {
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
  }

  const sanitizedDate = new Date().toUTCString().replace(/[/\\?%*:|"<>]/g, `.`);
  const logStream = createWriteStream(`./log/${moduleName}/all/${sanitizedDate}.log`);
  const mlog = new Logger(logStream);

  mlog.debug(`Starting module "${moduleName}"`);

  const sm = fork(modulePath, {
    env: {
      FORCE_COLOR: `true`
    },
    stdio: [`pipe`,`pipe`,`pipe`,`ipc`]
  });

  if (sm.stdout != null && sm.stderr != null) {
    sm.stdout.setEncoding(`utf8`);
    sm.stderr.setEncoding(`utf8`);

    sm.stdout.on(`data`, (data) => {
      mlog.info(data);
    });
    
    sm.stderr.on(`data`, (data) => {
      mlog.error(data);
    });
  }

  const existingModuleIndex = getModuleIndex(moduleName);
  if (existingModuleIndex > -1) {
    activeModules[existingModuleIndex].process = sm;
    activeModules[existingModuleIndex].lastRespawn = new Date();
    activeModules[existingModuleIndex].totalRespawns++;
    activeModules[existingModuleIndex].respawnWarnCounter++;
  } else {
    activeModules.push({
      process: sm,
      name: moduleName,
      spawnTimestamp: new Date(),
      lastRespawn: new Date(),
      totalRespawns: 0,
      respawnWarnCounter: 0
    });
  }

  sm.on(`message`, (data: unknown) => {
    if (data === null) {
      mlog.warn(`Module "${moduleName}" sent null message.`);
      return;
    }

    if (typeof data === `object`) {
      const dataObject = data as IPCLoggerObject;
      switch (dataObject.t) {
        case `LOG`:
          console.log(dataObject.c.color);
          logStream.write(dataObject.c.plain);
          break;
        case `IPC`:
          // TODO: IPC between modules
          break;
        default:
          mlog.debug(inspect(dataObject)); // to the debugeon with you
      }
    } else {
      mlog.debug(inspect(data)); // to the debugeon with you
    }
  });

  sm.on(`error`, err => {
    mlog.fatal(err.stack);
  });

  sm.on(`close`, (code, signal) => {
    // https://nodejs.org/api/process.html#process_exit_codes
    mlog.warn(`Child process of module "${moduleName}" closed with exit code ${code}`);

    let exit = true;
    let report = true;
    let checkLoop = true;

    if (code != null) {
      switch (code) {
        case 0:
          mlog.info(`(${moduleName}) Process complete or shutting down at user request.`);
          report = false;
          checkLoop = false;
          break;
        case 1:
          mlog.info(`(${moduleName}) Process seems to have crashed. Restarting...`);
          exit = false;
          break;
        case 16:
          mlog.info(`(${moduleName}) Process restarting at user request...`);
          exit = false;
          report = false;
          checkLoop = false;
          break;
        case 17:
          mlog.info(`(${moduleName}) Process undergoing scheduled restart.`);
          exit = false;
          report = false;
          checkLoop = false;
          break;
        case 18:
          mlog.fatal(`(${moduleName}) Process shutting down automatically.`);
          checkLoop = false;
          break;
      }
    } else {
      mlog.fatal(`(${moduleName}) Process terminated via POSIX signal: ${signal}`);
      checkLoop = false;
    }

    if (checkLoop) {
      const mIndex = getModuleIndex(moduleName);
      if (mIndex > -1) {
        const mLastRespawn = activeModules[mIndex].lastRespawn.getTime();
        const mRespawns = activeModules[mIndex].respawnWarnCounter;
        // if it's been more than 1 hour since last restart, reset the counter
        if (mLastRespawn + (1000 * 60 * 60) > Date.now()) {
          activeModules[mIndex].respawnWarnCounter = 0;
        }

        if (mRespawns >= cfg.resets.warningThreshold) {
          mlog.warn(`(${moduleName}) Unusually high client reset count: ${mRespawns}`);
        }

        if (mRespawns >= cfg.resets.shutdownThreshold) {
          mlog.fatal(`(${moduleName}) Boot loop possibly detected, shutting down for safety.`);
          exit = true;
          report = true;
        }
      } else {
        mlog.warn(`this should literally never ever happen!!!`);
      }
    }

    logStream.close();

    if (report) {
      copyFileSync(logStream.path, `./log/crash/${basename(logStream.path.toString())}`);

      // TODO: notify other modules through IPC
    }
    
    if (exit) {
      const mIndexFinal = getModuleIndex(moduleName);
      if (mIndexFinal > -1) {
        activeModules.splice(mIndexFinal, 1);
      } else {
        console.warn(`this should literally never ever happen!!!`);
      }

      // TODO: notify other modules through IPC

      checkAllModulesClosed();
    } else {
      setTimeout(() => {
        spawnModule(modulePath, moduleName);
      }, 3000);
    }
  });
}

for (const dirEntry of readdirSync(modulesDir, { withFileTypes: true })) {
  if (!dirEntry.isDirectory()) continue;

  if (existsSync(`${modulesDir}/${dirEntry.name}/index.js`)) {
    spawnModule(`${modulesDir}/${dirEntry.name}/index.js`, dirEntry.name);
  }
}