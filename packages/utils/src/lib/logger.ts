import type * as Core from '@actions/core';

class Logger {
  private _debugMode = false;
  set debugMode(value: boolean) {
    this._debugMode = value;
  }
  get debugMode(): boolean {
    return this._debugMode;
  }

  constructor(private core: typeof Core) {}

  log(message: string) {
    this.core.info(message);
  }

  info(message: string) {
    this.log(`❕ ${message}`);
  }

  success(message: string) {
    this.log(`✅ ${message}`);
  }

  debug(message: string) {
    if (this.debugMode && !this.core.isDebug()) this.log(`🐞 ${message}`);
    this.core.debug(`🐞 ${message}`);
  }

  notice(message: string | Error, properties?: Core.AnnotationProperties) {
    this.core.notice(message, properties);
  }

  warning(message: string | Error, properties?: Core.AnnotationProperties) {
    this.core.warning(message, properties);
  }

  error(message: string | Error, properties?: Core.AnnotationProperties) {
    this.core.error(message, properties);
  }

  async group<T>(name: string, cb: () => Promise<T>): Promise<T> {
    return await this.core.group<T>(name, cb);
  }
}

let _logger: Logger;

export function initializeLogger(core: typeof Core) {
  _logger = new Logger(core);
}

export const logger = (core?: typeof Core) => {
  if (!_logger) {
    if (!core) throw 'logger is not initialized';
    initializeLogger(core);
  }
  return _logger;
};

export function log(message: string) {
  logger().log(message);
}

export function info(message: string) {
  logger().info(message);
}

export function success(message: string) {
  logger().success(message);
}

export function debug(message: string) {
  logger().debug(message);
}

export function notice(message: string | Error, properties?: Core.AnnotationProperties) {
  logger().notice(message, properties);
}

export function warning(message: string | Error, properties?: Core.AnnotationProperties) {
  logger().warning(message, properties);
}

export function error(message: string | Error, properties?: Core.AnnotationProperties) {
  logger().error(message, properties);
}

export async function group<T>(name: string, cb: () => Promise<T>): Promise<T> {
  return await logger().group<T>(name, cb);
}
