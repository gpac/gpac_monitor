export type TransportMessageHandler = (
  connection: GpacTransport,
  dataView: DataView,
) => void;

export interface GpacTransport {
  connect(address: string): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  send(message: string): void;
  addMessageHandler(
    messageName: string,
    handler: TransportMessageHandler,
  ): void;
  addJsonMessageHandler(handler: TransportMessageHandler): void;
  addConnectHandler(handler: TransportMessageHandler): void;
  addDisconnectHandler(handler: TransportMessageHandler): void;
  addDefaultMessageHandler(handler: TransportMessageHandler): void;
}
