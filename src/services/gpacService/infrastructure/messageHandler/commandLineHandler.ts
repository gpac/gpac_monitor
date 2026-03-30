import type { MessageHandlerDependencies } from './types';

/**
 * CommandLineHandler
 */
export class CommandLineHandler {
  private dependencies: MessageHandlerDependencies;
  private commandLine: string | null = null;
  private callbacks: Array<(commandLine: string | null) => void> = [];

  constructor(dependencies: MessageHandlerDependencies) {
    this.dependencies = dependencies;
  }

  handleCommandLineResponse(data: { commandLine: string | null }): void {
    this.commandLine = data.commandLine;
    this.callbacks.forEach((cb) => cb(data.commandLine));
    this.callbacks = [];
  }

  async fetch(): Promise<string | null> {
    if (this.commandLine !== null) {
      return this.commandLine;
    }

    return new Promise((resolve) => {
      this.callbacks.push(resolve);
      if (this.callbacks.length === 1) {
        this.dependencies.send({
          type: 'get_command_line',
          message: 'get_command_line',
        });
      }
    });
  }
}
