import {AccessoryConfig, GlobalConfig} from './accessory-config';
import {BasePlatformConfig} from "homebridge-base-platform";

export interface PS4PlatformConfig extends BasePlatformConfig {
    readonly accessories?: AccessoryConfig[];
    readonly global?: GlobalConfig;
}
