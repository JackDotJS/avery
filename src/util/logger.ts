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

  constructor(stream?: WriteStream) {
    if (stream != null) {
      this.stream = stream;
    } else {
      this.stream = null;
    }
  }

  getSource = (trace?: string) => {
    if (typeof trace === `string`) {
      const match = trace.split(`\n`)[2].match(/(?<=at\s|\()([^(]*):(\d+):(\d+)\)?$/);
  
      if (match != null && match.length >= 4) {
        const fileName = normalize(fileURLToPath(match[1])).replace(process.cwd(), `~`);
        const line = match[2];
        const column = match[3];
  
        return `${fileName}:${line}:${column}`;
      }
    }
  
    return `unknown`;
  };

  format = (content: unknown, level: string, source?: string) => {
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
  
    if (typeof content !== `string`) {
      message.color = chalk.yellowBright;
      if (content instanceof Error) {
        message.content = content.stack;
      } else if (Buffer.isBuffer(content)) {
        message.content = content.toString();
      } else {
        message.content = inspect(content, { getters: true, showHidden: true });
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
    this.format(content.join(` `), `debug`, this.getSource(new Error().stack));
  };

  info = (...content: unknown[]) => {
    this.format(content.join(` `), `info`, this.getSource(new Error().stack));
  };

  warn = (...content: unknown[]) => {
    this.format(content.join(` `), `warn`, this.getSource(new Error().stack));
  };

  error = (...content: unknown[]) => {
    this.format(content.join(` `), `error`, this.getSource(new Error().stack));
  };

  fatal = (...content: unknown[]) => {
    this.format(content.join(` `), `fatal`, this.getSource(new Error().stack));
  };
}