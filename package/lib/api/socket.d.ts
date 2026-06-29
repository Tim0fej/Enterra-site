import Emittery from "emittery";
import { AlertShowEvent, AlertShowStartEvent, AlertType, RawData, ClientType, EventName, Donation } from "./types";
import { GOT } from "./symbols";
export declare class DASocket extends Emittery<{
    [EventName.Donation]: Donation;
    [EventName.AlertStart]: AlertShowStartEvent;
    [EventName.AlertEnd]: AlertShowEvent;
    [EventName.AlertSkip]: AlertShowEvent;
    [EventName.Media]: RawData;
    [EventName.Stickers]: RawData;
}> {
    readonly token: string;
    private socketUrl?;
    private socket?;
    constructor(token: string, { socketUrl, autoConnect }?: {
        socketUrl?: number | string;
        autoConnect?: boolean;
    });
    get connected(): boolean;
    private [GOT];
    crawlWidget(): Promise<{
        prev: {
            socketUrl: string | undefined;
        };
        socketUrl: string;
    }>;
    connect({ addUser, clientType }?: {
        addUser?: boolean | undefined;
        clientType?: ClientType | undefined;
    }): Promise<void>;
    disconnect(): Promise<void>;
    addUser(type: ClientType): void;
    alertStart({ duration, groupId, id, type }: {
        id: number;
        type: AlertType;
        groupId?: number;
        duration?: number;
    }): void;
    alertEnd({ id, type }: {
        id: number;
        type: AlertType;
    }): void;
    alertSkip({ id, type }: {
        id: number;
        type: AlertType;
    }): void;
    mediaEnd(id: number): void;
    mediaShowWidget(): void;
    mediaHideWidget(): void;
    mediaPause(): void;
    mediaUnpause(): void;
    mediaGetPauseState(source: any): void;
    mediaGetCurrent(source: any): void;
    mediaGetVolumeOverride(volume: number): void;
    mediaReceiveVolumeOverride(volume: number): void;
    mediaReceivePauseState({ source, media, isPaused, volumeOverride }: {
        source: string;
        media: any;
        isPaused: boolean;
        volumeOverride: number;
    }): void;
    mediaReceiveCurrentMedia({ source, media, isPaused, isDisplaying }: {
        source: string;
        media: any;
        isPaused: boolean;
        isDisplaying: boolean;
    }): void;
    private send;
}
