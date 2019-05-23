import {PS4PlatformConfig} from './ps4-platform-config';
import {AccessoryConfig, GlobalConfig} from './accessory-config';
import {deviceFromConfig, PS4Device} from './ps4-device';
import {PS4Accessory} from './ps4-accessory';
import {HomebridgePlatform} from 'homebridge-base-platform';

export enum HomebridgeInfo {
    plugin = 'homebridge-ps4-waker-platform',
    name = 'PS4WakerPlatform'
}

export class PS4Platform extends HomebridgePlatform<PS4PlatformConfig, PS4Device, PS4Accessory> {

    protected getPluginName(): string {
        return HomebridgeInfo.plugin;
    }

    protected async searchAccessories(homebridge: any): Promise<PS4Accessory[]> {
        const accessoryConfigs = this.config.accessories || [];
        const globalConfig = this.config.global || {};
        const accessories = await Promise.all(accessoryConfigs.map((ac) => this._findAccessory(ac, globalConfig, homebridge)));
        return accessories.filter((acc) => acc !== undefined);
    }

    private async _findAccessory(accessoryConfig: AccessoryConfig, globalConfig: GlobalConfig, homebridge: any): Promise<PS4Accessory | undefined> {
        try {
            const device = await deviceFromConfig(accessoryConfig, globalConfig);
            return this._accessoryFromDevice(device, accessoryConfig, homebridge);
        } catch(err) {
            this.log.error(err);
            return undefined;
        }
    }

    private async _accessoryFromDevice(device: PS4Device, accessoryConfig: AccessoryConfig, homebridge: any): Promise<PS4Accessory> {
        const uuid = homebridge.hap.uuid.generate(device.info.host.id);
        const displayName = accessoryConfig.name || device.info.host.name;
        const cachedAccessory = this._accessories.find((item) => item.UUID === uuid);
        if(cachedAccessory) {
            cachedAccessory.displayName = displayName;
            const sta = new PS4Accessory(this.log, cachedAccessory, homebridge, device);
            homebridge.updatePlatformAccessories([cachedAccessory]);
            return sta;
        }
        const accessory = new homebridge.platformAccessory(displayName, uuid);
        const sta = new PS4Accessory(this.log, accessory, homebridge, device);
        this.configureAccessory(accessory);
        homebridge.registerPlatformAccessories(HomebridgeInfo.plugin, HomebridgeInfo.name, [accessory]);
        return sta;
    }
}