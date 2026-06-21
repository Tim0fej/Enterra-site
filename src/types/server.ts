export type ServerStatusState = 'loading' | 'online' | 'offline' | 'error';

export interface ServerStatus {
  state: ServerStatusState;
  playersOnline: number | null;
  playersMax: number | null;
  label: string;
}

export interface McStatusResponse {
  online: boolean;
  players?: {
    online?: number;
    max?: number;
  };
}
