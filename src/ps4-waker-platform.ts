import {PS4PlatformConfig} from './ps4-platform-config';
import {AccessoryConfig, GlobalConfig} from './accessory-config';
import {deviceFromConfig, PS4Device} from './ps4-device';
import {PS4WakerAccessoryWrapper} from './ps4-waker-accessory-wrapper';
import {
    DefaultDeviceKeyMapping,
    HomebridgeAccessoryWrapperConstructor,
    HomebridgePlatform,
    PlatformSettings
} from 'homebridge-base-platform';
import {API, Logging} from "homebridge";

export enum PS4WakerPlatformInfo {
    plugin = 'homebridge-ps4-waker-platform',
    name = 'PS4WakerPlatform'
}

export class PS4WakerPlatform extends HomebridgePlatform<PS4PlatformConfig, PS4Device, PS4WakerAccessoryWrapper> {

    public constructor(logger: Logging, config: PS4PlatformConfig, api: API) {
        super(logger, config, api);
    }

    protected getAccessoryWrapperConstructorForDevice(device: PS4Device): HomebridgeAccessoryWrapperConstructor<PS4WakerAccessoryWrapper, PS4Device> | undefined {
        return PS4WakerAccessoryWrapper;
    }

    protected initPlatformSettings(): PlatformSettings {
        return {
            plugin: PS4WakerPlatformInfo.plugin,
            name: PS4WakerPlatformInfo.name,
            deviceKeyMapping: DefaultDeviceKeyMapping
        };
    }

    protected getDefaultPlatformConfig(): PS4PlatformConfig | undefined {
        return undefined; // Default platform plugin not possible
    }

    protected async searchDevices(): Promise<PS4Device[]> {
        const accessoryConfigs: AccessoryConfig[] = this.config.accessories || [];
        const globalConfig: GlobalConfig = this.config.global || {};
        return Promise.all(accessoryConfigs.map((ac) => deviceFromConfig(ac, globalConfig)));
    }
}
