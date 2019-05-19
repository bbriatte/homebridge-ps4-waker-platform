import {callbackify, DeviceInfo, HomebridgeAccessory, Logger, RunningApp} from './utils';
import {DeviceOnOffListener, PS4Device} from './ps4-device';
import {AppConfig} from './accessory-config';

export class PS4Accessory extends HomebridgeAccessory implements DeviceOnOffListener {

    public static readonly APP_SERVICE_PREFIX = 'app';

    private readonly device?: PS4Device;

    private readonly onService: any;
    private readonly informationService: any;
    private readonly appServices: any[];

    constructor(log: Logger, accessory: any, homebridge: any, device: PS4Device) {
        super(log, accessory, homebridge);
        this.device = device;
        this.informationService = this.initInformationService();
        this.onService = this.initOnService();
        this.appServices = this.initAppServices();
        this.log(`Found device [${this.getDisplayName()}]`);
    }

    private initOnService(): any {
        const Service = this.homebridge.hap.Service;
        const Characteristic = this.homebridge.hap.Characteristic;
        const onService = this.getService(Service.Switch, this.getDisplayName(), 'onService');
        onService
            .getCharacteristic(Characteristic.On)
            .on('get', callbackify(this.isOn.bind(this)))
            .on('set', callbackify(this.setOn.bind(this)));
        return onService;
    }

    private initInformationService(): any {
        const Service = this.homebridge.hap.Service;
        const Characteristic = this.homebridge.hap.Characteristic;
        const informationService = this.accessory.getService(Service.AccessoryInformation);
        informationService
            .setCharacteristic(Characteristic.Name, this.getDisplayName())
            .setCharacteristic(Characteristic.Manufacturer, 'Sony Corporation')
            .setCharacteristic(Characteristic.Model, this.device.model)
            .setCharacteristic(Characteristic.SerialNumber, this.device.serial);
        if(this.device.info.systemVersion) {
            informationService.setCharacteristic(Characteristic.FirmwareRevision, this.device.info.systemVersion);
        }
        return informationService;
    }

    private initAppServices() {
        const Service = this.homebridge.hap.Service;
        const Characteristic = this.homebridge.hap.Characteristic;
        const allAppsRegistered = this._getAllAppServices(Service.Switch);
        const newServices = this.device.apps.map((config) => {
            const serviceType = _appIdToServiceType(config.id);
            const oldServiceIndex = allAppsRegistered.findIndex((service) => {
                return service.subtype === serviceType
            });
            if(oldServiceIndex !== -1) {
                allAppsRegistered.splice(oldServiceIndex, 1);
            }
            const appService = this.getService(Service.Switch, config.name, serviceType);
            const characteristic = appService.getCharacteristic(Characteristic.On);
            characteristic.on('get', callbackify(() => this.isRunningApp(config)));
            characteristic.on('set', callbackify((on: boolean) => this.setRunningApp(on, config)));
            return appService;
        });
        allAppsRegistered.forEach((service) => this.removeService(Service.Switch, service.subtype));
        return newServices;
    }

    private async getRunningApp(): Promise<RunningApp | undefined> {
        const deviceInfoRaw = await this.device.api.getDeviceStatus();
        this.device.info = new DeviceInfo(deviceInfoRaw);
        if(this.device.info.runningApp !== undefined) {
            return this.device.info.runningApp;
        }
        return undefined;
    }

    private async isRunningApp(config: AppConfig): Promise<boolean> {
        const runningApp = await this.getRunningApp();
        return runningApp ? runningApp.id === config.id : false;
    }

    private async setRunningApp(on: boolean, config: AppConfig): Promise<boolean> {
        try {
            let success = false;
            const deviceOn = await this.isOn();
            if (on) {
                await this.device.api.startTitle(config.id);
                success = true;
                if(deviceOn === false) {
                    success = await this.deviceDidTurnOn(true);
                }
                this.log(`[${this.getDisplayName()}] Start ${config.name}`);
            } else if(deviceOn === true) {
                const runningApp = this.device.info.runningApp;
                if(runningApp !== undefined && runningApp.id === config.id) {
                    await this.device.api.sendKeys(['ps']);
                    await new Promise((resolve => setTimeout(resolve, 250)));
                    await this.device.api.sendKeys(['option']);
                    await new Promise((resolve => setTimeout(resolve, 250)));
                    await this.device.api.sendKeys(['enter']);
                    await new Promise((resolve => setTimeout(resolve, 1000)));
                    await this.device.api.sendKeys(['enter']);
                    this.log(`[${this.getDisplayName()}] Stop ${config.name}`);
                    success = true;
                }
            }
            await this.device.api.close();
            return success;
        } catch(err) {
            this.log.error(err);
            return false;
        }
    }

    public async isOn(): Promise<boolean> {
        const deviceInfoRaw = await this.device.api.getDeviceStatus();
        this.device.info = new DeviceInfo(deviceInfoRaw);
        return this.device.info.status.code === 200;
    }

    public async setOn(on: boolean): Promise<boolean> {
        if(this.device.api === undefined) {
            return false;
        }
        let success = false;
        try {
            if(on === true) {
                await this.device.api.turnOn(this.device.timeout);
                success = await this.deviceDidTurnOn();
            } else {
                const runningApp = await this.getRunningApp();
                const appService = this._getServiceFromRunningApp(runningApp);
                await this.device.api.turnOff();
                if(appService !== undefined) {
                    const Characteristic = this.homebridge.hap.Characteristic;
                    appService.getCharacteristic(Characteristic.On).updateValue(false);
                }
                success = await this.deviceDidTurnOff();
            }
            await this.device.api.close();
        } catch (err) {
            this.log.error(err);
            return false;
        }
        return success;
    }

    deviceDidTurnOff(updateOn?: boolean): Promise<boolean> {
        const Characteristic = this.homebridge.hap.Characteristic;
        this.log(`[${this.getDisplayName()}] Turn off`);
        if(updateOn === true) {
            this.onService.getCharacteristic(Characteristic.On).updateValue(false);
        }
        return Promise.resolve(true);
    }

    deviceDidTurnOn(updateOn?: boolean): Promise<boolean> {
        const Characteristic = this.homebridge.hap.Characteristic;
        this.log(`[${this.getDisplayName()}] Turn on`);
        if(updateOn === true) {
            this.onService.getCharacteristic(Characteristic.On).updateValue(true);
        }
        return Promise.resolve(true);
    }

    private _getAllAppServices(serviceType): any[] {
        if(this.accessory.services === undefined) {
            return [];
        }
        return this.accessory.services.filter((service) => {
            if(service.subtype === undefined) {
                return false;
            }
            return service.UUID === serviceType.UUID && service.subtype.startsWith(PS4Accessory.APP_SERVICE_PREFIX);
        });
    }

    private _getServiceFromRunningApp(runningApp?: RunningApp): any | undefined {
        if(runningApp !== undefined) {
            const Service = this.homebridge.hap.Service;
            const serviceType = _appIdToServiceType(runningApp.id);
            return this.accessory.getServiceByUUIDAndSubType(Service.Switch, serviceType);
        }
        return undefined;
    }
}

function _appIdToServiceType(id: string): string {
    return `${PS4Accessory.APP_SERVICE_PREFIX}${id}Service`;
}