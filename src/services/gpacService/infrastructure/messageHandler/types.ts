export interface MessageHandlerCallbacks {
  onUpdateFilterData: (payload: { idx: number; data: any }) => void;
  onUpdateGraphData: (data: any) => void;
  onSetLoading: (loading: boolean) => void;
  onSetFilterDetails: (filter: any) => void;
  onUpdateSessionStats: (stats: any) => void;
}

export interface MessageHandlerDependencies {
  isConnected: () => boolean;
  send: (message: any) => Promise<void>;
}
