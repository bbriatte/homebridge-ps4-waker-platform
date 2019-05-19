import {AccessoryConfig, GlobalConfig} from './accessory-config';

export interface PlatformConfig {
    readonly name: string;
    readonly accessories?: AccessoryConfig[];
    readonly global?: GlobalConfig;
}