import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { normalize } from 'path';
import { inspect } from 'util';
import { WriteStream } from 'fs';

export interface IPCLoggerObject {
  t: string,
  c: {
    plain: string,
    color: string
  }
}

export class Logger {
  stream: WriteStream | null;
  _filename: string;

  constructor(stream?: WriteStream) {
    if (stream != null) {
      this.stream = stream;
    } else {
      this.stream = null;
    }

    const thisFile = import.meta.filename.match(/(?<=\\|\/)[^\\/]*$/);
    if (thisFile == null) throw new Error(`Failed regex on current filename. This should never happen!`);
    this._filename = thisFile[0];
  }

  getSource = (trace?: string) => {
    if (typeof trace === `string`) {
      const lines = trace.split(`\n`);
      let indexCorrection = 0;

      // cycle through the trace until we get the first line that doesn't have this same file
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(` at `) && lines[i].includes(this._filename) === false) {
          indexCorrection = i;
          break;
        }
      }

      const match = lines[indexCorrection].match(/file:\/\/\/.*:(\d+):(\d+)/);
  
      if (match != null) {
        const finalSource = normalize(fileURLToPath(match[0])).replace(process.cwd(), `~`);
        return finalSource;
      }
    }
  
    return `unknown`;
  };

  sanitize = (item: unknown) => {
    let rv = item;

    if (typeof item !== `string`) {
      if (item instanceof Error) {
        rv = item.stack;
      } else if (Buffer.isBuffer(item)) {
        rv = item.toString();
      } else {
        rv = inspect(item, { getters: true, showHidden: true });
      }
    }

    return rv;
  };

  preformat = (content: unknown[], loglevel: string) => {
    const sanitized = [];
    for (const item of content) {
      sanitized.push(this.sanitize(item));
    }

    this.format(sanitized.join(` `), loglevel, this.getSource(new Error().stack));
  };

  format = (content: string, level: string, source?: string) => {
    const now = new Date();
    const hh = now.getUTCHours().toString().padStart(2, `0`);
    const mm = now.getUTCMinutes().toString().padStart(2, `0`);
    const ss = now.getUTCSeconds().toString().padStart(2, `0`);
    const ms = now.getUTCMilliseconds().toString().padStart(3, `0`);
  
    const timestamp = {
      color: chalk.white,
      content: `${hh}:${mm}:${ss}.${ms}`
    };
  
    const filePath = {
      color: chalk.yellow,
      content: source || this.getSource(new Error().stack)
    };
  
    const logLevel = {
      color: chalk.magenta,
      content: `DEBUG`
    };
  
    const message = {
      color: chalk.white,
      content
    };
  
    if (typeof level === `string`) {
      if ([`fatal`, `error`, `warn`, `info`].includes(level.toLowerCase())) {
        logLevel.content = level.toUpperCase();
      }
  
      switch (level.toLowerCase()) {
        case `fatal`:
          logLevel.color = chalk.inverse.bgRedBright;
          message.color = chalk.redBright;
          break;
        case `error`:
          logLevel.color = chalk.red;
          message.color = chalk.red;
          break;
        case `warn`:
          logLevel.color = chalk.yellowBright;
          message.color = chalk.yellowBright;
          break;
        case `info`:
          logLevel.color = chalk.white;
          message.color = chalk.whiteBright;
          break;
      }
    }
  
    const plain1 = `[${timestamp.content}] [${filePath.content}] [${logLevel.content}] : `;
    const plain2 = (message.content as string).replace(/\n/g, `\n${(` `.repeat(plain1.length))}`).trim() + `\n`;
  
    const terminal1 = [
      timestamp.color(`[${timestamp.content}]`),
      filePath.color(`[${filePath.content}]`),
      logLevel.color(`[${logLevel.content}]`),
      `: `
    ].join(` `);
    const terminal2 = message.color((message.content as string).replace(/\n/g, `\n${(` `.repeat(plain1.length))}`).trim());
    
    if (process.send) {
      process.send({
        t: `LOG`,
        c: {
          plain: plain1 + plain2,
          color: terminal1 + terminal2
        }
      });
    } else {
      console.log(terminal1 + terminal2);
    }

    if (this.stream && this.stream.writable) {
      this.stream.write(plain1 + plain2);
    }
  
    return plain1 + plain2;
  };

  debug = (...content: unknown[]) => {
    this.preformat(content, `debug`);
  };

  info = (...content: unknown[]) => {
    this.preformat(content, `info`);
  };

  warn = (...content: unknown[]) => {
    this.preformat(content, `warn`);
  };

  error = (...content: unknown[]) => {
    this.preformat(content, `error`);
  };

  fatal = (...content: unknown[]) => {
    this.preformat(content, `fatal`);
  };
}