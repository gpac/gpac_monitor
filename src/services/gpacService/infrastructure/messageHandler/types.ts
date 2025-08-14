export interface MessageHandlerCallbacks {

  onUpdateGraphData: (data: any) => void;
  onSetLoading: (loading: boolean) => void;
  onUpdateSessionStats: (stats: any) => void;
}

export interface MessageHandlerDependencies {
  isConnected: () => boolean;
  send: (message: any) => Promise<void>;
}
