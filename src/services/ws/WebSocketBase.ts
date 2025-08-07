import { MessageFormatter } from './formatters/messageFormatters';
import { WebSocketNotificationService } from './notificationService';

export class WebSocketBase {
  private socket: WebSocket | null = null;
  private messageHandlers: {
    [key: string]: ((connection: WebSocketBase, dataView: DataView) => void)[];
  } = {};

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public connect(address: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Check if already connected to avoid multiple connections
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }

        // Check if connection is in progress
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          // Wait for existing connection to complete
          const onOpen = () => {
            this.socket?.removeEventListener('open', onOpen);
            this.socket?.removeEventListener('error', onError);
            resolve();
          };
          const onError = (error: Event) => {
            this.socket?.removeEventListener('open', onOpen);
            this.socket?.removeEventListener('error', onError);
            reject(error);
          };
          this.socket.addEventListener('open', onOpen);
          this.socket.addEventListener('error', onError);
          return;
        }

        if (this.socket) {
          this.socket.close();
          this.socket = null;
        }

        this.socket = new WebSocket(address);
        this.socket.binaryType = 'arraybuffer';

        this.socket.onopen = () => {
          WebSocketNotificationService.onConnected(address);
          this.callMessageHandlers(
            '__OnConnect__',
            new DataView(new ArrayBuffer(0)),
          );
          resolve();
        };

        this.socket.onmessage = (event: MessageEvent) => {
          try {
            let data: string;

            // Handle different message formats
            if (event.data instanceof ArrayBuffer) {
              const dataView = new DataView(event.data);
              data = MessageFormatter.decodeDataView(dataView);
            } else {
              data = event.data;
            }

            // Handle messages with "json:" prefix or direct JSON
            if (data.startsWith('json:') || data.startsWith('{')) {
              const parsedData = MessageFormatter.parseReceived(data);
              const dataView = MessageFormatter.createDataView(parsedData);

              const handlerKey = data.startsWith('json:') ? 'json:' : 'json';
              this.callMessageHandlers(handlerKey, dataView);
              return;
            }

            // Legacy format handling for compatibility
            const dataView = new DataView(
              event.data instanceof ArrayBuffer
                ? event.data
                : new TextEncoder().encode(data).buffer,
            );

            if (dataView.byteLength >= 4) {
              const id = String.fromCharCode(
                dataView.getInt8(0),
                dataView.getInt8(1),
                dataView.getInt8(2),
                dataView.getInt8(3),
              );

              const handlers = this.messageHandlers[id];
              if (handlers && handlers.length > 0) {
                handlers.forEach((handler) => handler(this, dataView));
                return;
              }
            }

            this.callMessageHandlers('__default__', dataView);
          } catch (error) {
            const errorDataView =
              event.data instanceof ArrayBuffer
                ? new DataView(event.data)
                : new DataView(new TextEncoder().encode(event.data).buffer);
            this.callMessageHandlers('__default__', errorDataView);
          }
        };

        this.socket.onclose = (event) => {
          WebSocketNotificationService.onDisconnected(
            event.reason,
            event.wasClean,
          );
          this.socket = null;
          this.callMessageHandlers(
            '__OnDisconnect__',
            new DataView(new ArrayBuffer(0)),
          );
        };

        this.socket.onerror = (error) => {
          WebSocketNotificationService.onError();
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting...');
      try {
        this.socket.close(1000, 'Client disconnecting');
      } catch (error) {
        console.error('[WebSocket] Error during disconnect:', error);
      }
      this.socket = null;
    }
  }

  public send(message: string): void {
    if (!this.isConnected()) {
      throw new Error('Cannot send message: WebSocket is not connected');
    }

    try {
      const formattedMessage = MessageFormatter.formatForSend(message);
      console.log('[WebSocket] Sending message:', formattedMessage);
      this.socket!.send(formattedMessage);
    } catch (error) {
      console.error('[WebSocket] Error sending message:', error);
      throw error;
    }
  }

  public addConnectHandler(
    handler: (connection: WebSocketBase, dataView: DataView) => void,
  ): void {
    this.addMessageHandler('__OnConnect__', handler);
  }

  public addDisconnectHandler(
    handler: (connection: WebSocketBase, dataView: DataView) => void,
  ): void {
    this.addMessageHandler('__OnDisconnect__', handler);
  }

  public addDefaultMessageHandler(
    handler: (connection: WebSocketBase, dataView: DataView) => void,
  ): void {
    this.addMessageHandler('__default__', handler);
  }

  public addJsonMessageHandler(
    handler: (connection: WebSocketBase, dataView: DataView) => void,
  ): void {
    this.addMessageHandler('json:', handler);
    this.addMessageHandler('json', handler);
  }

  public addMessageHandler(
    messageName: string,
    handler: (connection: WebSocketBase, dataView: DataView) => void,
  ): void {
    if (!(messageName in this.messageHandlers)) {
      this.messageHandlers[messageName] = [];
    }
    this.messageHandlers[messageName].push(handler);
  }

  private callMessageHandlers(messageName: string, dataView: DataView): void {
    const handlers = this.messageHandlers[messageName];
    if (!handlers || handlers.length === 0) {
      // If no specific handler and it's not already the default handler,
      // try the default handler
      if (messageName !== '__default__') {
        const defaultHandlers = this.messageHandlers['__default__'];
        if (defaultHandlers) {
          defaultHandlers.forEach((handler) => {
            try {
              handler(this, dataView);
            } catch (error) {
              console.error(`[WebSocket] Error in default handler:`, error);
            }
          });
        }
      }
      return;
    }

    handlers.forEach((handler) => {
      try {
        handler(this, dataView);
      } catch (error) {
        console.error(
          `[WebSocket] Error in handler for ${messageName}:`,
          error,
        );
      }
    });
  }
}
