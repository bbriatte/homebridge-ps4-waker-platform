import {BaseGlobalConfig} from "homebridge-base-platform";

export interface GlobalConfig extends BaseGlobalConfig {
    readonly apps?: AppConfig[];
    readonly pollingInterval?: number;
    timeout?: number;
    bindAddress?: string; // if you have multiple network interfaces
}

export interface AccessoryConfig extends GlobalConfig {
    serial: string;
    model: string;
    name?: string;
    ip?: string; // if you have more than one ps4 on your network
    bindAddress?: string; // if you have multiple network interfaces
    passCode?: string;
    credentials?: string;
}

export interface AppConfig {
    name: string;
    id: string; // ps id of the game
}
