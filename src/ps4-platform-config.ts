import {AccessoryConfig, GlobalConfig} from './accessory-config';

export interface PS4PlatformConfig {
    readonly accessories?: AccessoryConfig[];
    readonly global?: GlobalConfig;
}