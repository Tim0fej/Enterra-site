import type { ServerDisplayMode, ServerDisplayState } from '../../shared/serverDisplayStatus';

export type ServerStatusState = 'loading' | ServerDisplayState | 'error';

export interface ServerStatus {
  state: ServerStatusState;
  playersOnline: number | null;
  playersMax: number | null;
  label: string;
  message: string | null;
  displayMode: ServerDisplayMode | null;
}

export interface McStatusResponse {
  online: boolean;
  displayState: ServerDisplayState;
  displayMode: ServerDisplayMode;
  playersOnline: number;
  playersMax: number | null;
  label: string;
  message: string | null;
}
