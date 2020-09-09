import {BaseGlobalConfig} from "homebridge-base-platform";

export interface GlobalConfig extends BaseGlobalConfig {
    readonly apps?: AppConfig[];
    readonly pollingInterval?: number;
    timeout?: number;
}

export interface AccessoryConfig extends GlobalConfig {
    serial: string;
    model: string;
    name?: string;
    ip?: string; // if you have more than one ps4 on your network
    passCode?: string;
    credentials?: string;
}

export interface AppConfig {
    name: string;
    id: string; // ps id of the game
}
