import { DASocket } from "./socket";
import { DAAPI } from "./api";
import { SKIP } from "./symbols";
export declare class DAWidget {
    readonly api: DAAPI;
    readonly socket: DASocket;
    private _widgetBehavior;
    get widgetBehavior(): boolean;
    set widgetBehavior(value: boolean);
    alertDuration: number;
    private lastTask;
    private [SKIP];
    constructor(token: string, { widgetBehavior, alertDuration, autoOpen }?: {
        widgetBehavior?: boolean | undefined;
        alertDuration?: number | undefined;
        autoOpen?: boolean | undefined;
    });
    private onDonation;
    skipCurrentAlert(): Promise<void>;
    open(): Promise<void>;
    close(): Promise<void>;
}
