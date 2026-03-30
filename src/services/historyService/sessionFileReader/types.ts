export interface SessionInfo {
  sessionId: string;
  hasSnapshot: boolean;
  hasEvents: boolean;
  sizeBytes: number;
  isComplete: boolean;
}
