import {AccessoryConfig, GlobalConfig} from './accessory-config';
import {PlatformConfig} from 'homebridge';

export interface PS4PlatformConfig extends PlatformConfig {
    readonly accessories?: AccessoryConfig[];
    readonly global?: GlobalConfig;
}
