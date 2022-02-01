import { info, debug, warning, error, notice, AnnotationProperties, group, isDebug } from '@actions/core';

class Logger {
  private _debugMode = false;
  set debugMode(value: boolean) {
    this._debugMode = value;
  }
  get debugMode(): boolean {
    return this._debugMode;
  }

  log(message: string) {
    info(message);
  }

  info(message: string) {
    this.log(`❕ ${message}`);
  }

  success(message: string) {
    this.log(`✅ ${message}`);
  }

  debug(message: string) {
    if (this.debugMode && !isDebug()) this.log(`🐞 ${message}`);
    debug(`🐞 ${message}`);
  }

  notice(message: string | Error, properties?: AnnotationProperties) {
    notice(message, properties);
  }

  warning(message: string | Error, properties?: AnnotationProperties) {
    warning(message, properties);
  }

  error(message: string | Error, properties?: AnnotationProperties) {
    error(message, properties);
  }

  async group<T>(name: string, cb: () => Promise<T>): Promise<T> {
    return await group<T>(name, cb);
  }
}

export const logger = new Logger();
