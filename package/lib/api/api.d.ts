/// <reference types="node" />
import { Method } from "got";
import { EventEmitter } from "events";
import { AlertType } from "./types";
import { GOT } from "./symbols";
export declare class DAAPI extends EventEmitter {
    readonly token: string;
    private accessToken?;
    private [GOT];
    constructor(token: string, { accessToken }?: {
        accessToken?: string;
    });
    crawlWidget(): Promise<{
        prev: {
            accessToken: string | undefined;
        };
        accessToken: string;
    }>;
    getUser(): Promise<import("./types").User>;
    markAlertShown({ id, type }: {
        id: number;
        type: AlertType;
    }): Promise<any>;
    repeatAlert({ id, type }: {
        id: number;
        type: AlertType;
    }): Promise<any>;
    skipAlert({ id, type }: {
        id: number;
        type: AlertType;
    }): Promise<any>;
    skipMedia(id: number): Promise<any>;
    markMediaPlayed(id: number): Promise<any>;
    getMedia(): Promise<{
        raw: any;
    }>;
    getPollWidget(): Promise<{
        raw: any;
    }>;
    getWidget(): Promise<{
        alerts: import("./types").Donation[];
        settings: {
            raw: any;
        };
        ttsMins: {
            EUR: number;
            USD: number;
            RUB: number;
            BYN: number;
            BYR: number;
            KZT: number;
            UAH: number;
            BRL: number;
            TRY: number;
        };
        raw: {
            [x: string]: any;
        };
    }>;
    requestApi(endpoint: string, { version, method, data, params }?: {
        version?: number;
        method?: Method;
        data?: any;
        params?: {
            [x: string]: any;
        };
    }): Promise<{
        [x: string]: any;
    }>;
    requestInternalApi(endpoint: string, { method, data, params }?: {
        method?: Method;
        data?: any;
        params?: {
            [x: string]: any;
        };
    }): Promise<{
        [x: string]: any;
    }>;
}
