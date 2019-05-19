import {PlatformConfig} from './platform-config';
import {AccessoryConfig, GlobalConfig} from './accessory-config';
import {deviceFromConfig, PS4Device} from './ps4-device';
import {Logger} from './utils';
import {PS4Accessory} from './ps4-accessory';

export enum HomebridgeInfo {
    plugin = 'homebridge-ps4-waker-platform',
    name = 'PS4WakerPlatform'
}

export class PS4Platform {

    private readonly log: Logger;
    private readonly config: PlatformConfig;
    private readonly _accessories: any[]; // homebridge registry
    private accessories: PS4Accessory[];

    constructor(log: Logger, config: PlatformConfig, homebridge: any) {
        this.log = log;
        this.config = config;
        this._accessories = [];
        homebridge.on('didFinishLaunching', async () => {
            if(config) {
                this.log('Searching ps4...');
                this.accessories = await this._searchAccessories(homebridge);
                this._clearUnreachableAccessories(homebridge);
                this.log('Finish searching ps4');
            } else {
                this.log.error(`No config provided for the ${HomebridgeInfo.name}`);
            }
        });
    }

    private async _searchAccessories(homebridge: any): Promise<PS4Accessory[]> {
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

    configureAccessory(accessory: any) {
        accessory.reachable = true;
        this._accessories.push(accessory);
    }

    private _clearUnreachableAccessories(homebridge: any) {
        const unreachableAccessories = this._accessories.filter((cachedAccessory) => {
            return this.accessories.some((ps4: any) => {
                return ps4.accessory.UUID === cachedAccessory.UUID;
            }) === false;
        });
        if(unreachableAccessories.length > 0) {
            unreachableAccessories.forEach((acc) => acc.reachable = false);
            homebridge.unregisterPlatformAccessories(HomebridgeInfo.plugin, HomebridgeInfo.name, unreachableAccessories);
        }
    }
}