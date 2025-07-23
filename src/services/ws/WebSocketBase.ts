import { toastService } from '@/shared/hooks/useToast';

export class WebSocketBase {
  private socket: WebSocket | null = null;
  private messageHandlers: {
    [key: string]: ((connection: WebSocketBase, dataView: DataView) => void)[];
  } = {};

  public isConnected(): boolean {
    const isConnected =
      this.socket !== null && this.socket.readyState === WebSocket.OPEN;

    if (isConnected) {
      toastService.show({
        title: 'WebSocket connexion',
        description: 'Connexion established',
        variant: 'default',
      });
    }

    return isConnected;
  }

  public connect(address: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[WebSocket] Attempting to connect to ${address}`);

        // Check if already connected to avoid multiple connections
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          console.log('[WebSocket] Already connected, skipping new connection');
          resolve();
          return;
        }

        // Check if connection is in progress
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          console.log('[WebSocket] Connection already in progress, waiting...');
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
          console.log('[WebSocket] Closing existing connection');
          this.socket.close();
          this.socket = null;
        }

        this.socket = new WebSocket(address);
        this.socket.binaryType = 'arraybuffer';

        this.socket.onopen = () => {
          console.log('[WebSocket] Connection opened successfully');
          toastService.show({
            title: 'Connexion established',
            description: `Connected to ${address}`,
            variant: 'default',
          });
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
              data = new TextDecoder().decode(dataView.buffer);
            } else {
              data = event.data;
            }

            console.log('[WebSocket] Raw message received:', data);

            // NEW: Handle messages with "json:" prefix
            if (data.startsWith('json:')) {
              console.log('[WebSocket] Processing json: prefixed message');
              const jsonData = data.substring(5); // Remove "json:" prefix
              const parsedData = JSON.parse(jsonData);
              
              // Convert to DataView for compatibility with existing handlers
              const textEncoder = new TextEncoder();
              const encoded = textEncoder.encode(JSON.stringify(parsedData));
              const dataView = new DataView(encoded.buffer);
              
              this.callMessageHandlers('json:', dataView);
              return;
            }

            // Handle direct JSON messages
            if (data.startsWith('{')) {
              console.log('[WebSocket] Processing direct JSON message');
              const parsedData = JSON.parse(data);
              
              // Convert to DataView for compatibility
              const textEncoder = new TextEncoder();
              const encoded = textEncoder.encode(JSON.stringify(parsedData));
              const dataView = new DataView(encoded.buffer);
              
              this.callMessageHandlers('json', dataView);
              return;
            }

            // Legacy format handling for compatibility
            const dataView = new DataView(event.data instanceof ArrayBuffer ? event.data : new TextEncoder().encode(data).buffer);
            
            if (dataView.byteLength >= 4) {
              const id = String.fromCharCode(
                dataView.getInt8(0),
                dataView.getInt8(1),
                dataView.getInt8(2),
                dataView.getInt8(3),
              );
              console.log('[WebSocket] Legacy message received:', id);

              const handlers = this.messageHandlers[id];
              if (handlers && handlers.length > 0) {
                handlers.forEach((handler) => handler(this, dataView));
                return;
              }
            }

            this.callMessageHandlers('__default__', dataView);
          } catch (error) {
            console.error('[WebSocket] Error processing message:', error);
            const errorDataView = event.data instanceof ArrayBuffer 
              ? new DataView(event.data) 
              : new DataView(new TextEncoder().encode(event.data).buffer);
            this.callMessageHandlers('__default__', errorDataView);
          }
        };

        this.socket.onclose = (event) => {
          console.log(
            `[WebSocket] Connection closed: Code=${event.code}, Clean=${event.wasClean}, Reason=${event.reason || 'No reason provided'}`,
          );
          toastService.show({
            title: 'Connexion closed',
            description: event.reason || 'Connexion closed',
            variant: event.wasClean ? 'default' : 'destructive',
          });
          this.socket = null;
          this.callMessageHandlers(
            '__OnDisconnect__',
            new DataView(new ArrayBuffer(0)),
          );
        };

        this.socket.onerror = (error) => {
          console.error('[WebSocket] Connection error:', error);
          toastService.show({
            title: 'WebSocket error',
            description: 'An error occurred',
            variant: 'destructive',
          });
          reject(error);
        };
      } catch (error) {
        console.error('[WebSocket] Error creating connection:', error);
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

  // NEW: Send messages with "json:" prefix for new server
  public send(message: string): void {
    if (!this.isConnected()) {
      throw new Error('Cannot send message: WebSocket is not connected');
    }

    try {
      // Add "json:" prefix for new server format
      const formattedMessage = message.startsWith('json:') ? message : `json:${message}`;
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

  // NEW: Add handler for json: prefixed messages
  public addJsonMessageHandler(
    handler: (connection: WebSocketBase, dataView: DataView) => void,
  ): void {
    this.addMessageHandler('json:', handler);
    this.addMessageHandler('json', handler); // Also handle direct JSON
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