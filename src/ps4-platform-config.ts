import {AccessoryConfig, GlobalConfig} from './accessory-config';
import {PlatformConfig} from 'homebridge-base-platform';

export interface PS4PlatformConfig extends PlatformConfig {
    readonly accessories?: AccessoryConfig[];
    readonly global?: GlobalConfig;
}