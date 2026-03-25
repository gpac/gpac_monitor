import type { HistorySnapshot } from '../types';
import type { SessionFileReader, SessionInfo } from './types';
import { parseEventsJsonl } from '../loader/eventLoader';

/**
 * WsSessionFileReader
 * Opens its own WS connection, sends list_sessions/read_file commands.
 */
export class WsSessionFileReader implements SessionFileReader {
  private ws: WebSocket | null = null;
  private pending = new Map<
    string,
    {
      resolve: (value: Record<string, unknown>) => void;
      reject: (reason: unknown) => void;
    }
  >();

  constructor(private address: string) {}

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.address);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onclose = () => {
        this.ws = null;
      };
    });
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  async listSessions(): Promise<SessionInfo[]> {
    await this.ensureConnected();
    const response = await this.sendCommand({ message: 'list_sessions' });
    return response.sessions as SessionInfo[];
  }

  async readSnapshot(sessionId: string): Promise<HistorySnapshot> {
    await this.ensureConnected();
    const response = await this.sendCommand({
      message: 'read_file',
      sessionId,
      file: 'snapshot.json',
    });
    return JSON.parse(response.content as string) as HistorySnapshot;
  }

  async readEvents(sessionId: string) {
    await this.ensureConnected();
    const response = await this.sendCommand({
      message: 'read_file',
      sessionId,
      file: 'events.jsonl',
    });
    return parseEventsJsonl(response.content as string);
  }

  private async ensureConnected(): Promise<void> {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      await this.connect();
    }
  }

  private sendCommand(
    command: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const key = this.commandKey(command);
      this.pending.set(key, { resolve, reject });
      this.ws!.send(`json:${JSON.stringify(command)}`);
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      const key = data.command as string;
      const entry = this.pending.get(key);
      if (!entry) return;
      this.pending.delete(key);

      if (data.status === 'error') {
        entry.reject(new Error(data.detail || data.error));
      } else {
        entry.resolve(data);
      }
    } catch {
      console.warn('[WsSessionFileReader] Unparseable message');
    }
  }

  /** Map a command to the key the server responds with */
  private commandKey(cmd: Record<string, string>): string {
    return cmd.message === 'read_file' ? `read_file` : cmd.message;
  }
}
