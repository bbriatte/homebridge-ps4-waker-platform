import {DeviceInfo, RunningApp} from './utils';
import {DeviceOnOffListener, PS4Device} from './ps4-device';
import {AppConfig} from './accessory-config';
import {callbackify, Context, HomebridgeAccessoryWrapper} from 'homebridge-base-platform';

const moment = require('moment');

export class PS4WakerAccessoryWrapper extends HomebridgeAccessoryWrapper<PS4Device> implements DeviceOnOffListener {

    public static readonly APP_SERVICE_PREFIX = 'app';

    private readonly onService: any;
    private readonly informationService: any;
    private readonly appServices: any[];

    private loggingService: any;

    constructor(context: Context, accessory: any, device: PS4Device) {
        super(context, accessory, device);

        var FakeGatoHistoryService = require('fakegato-history')(this.homebridge);

        this.informationService = this.initInformationService();
        this.onService = this.initOnService();
        this.appServices = this.initAppServices();
        
        this.loggingService = new FakeGatoHistoryService('switch', accessory);

        this.log(`Found device [${this.getDisplayName()}]`);
    }

    private initOnService(): any {
        const onService = this.getService(this.Service.Switch, this.getDisplayName(), 'onService');
        onService
            .getCharacteristic(this.Characteristic.On)
            .on('get', callbackify(this.isOn.bind(this)))
            .on('set', callbackify(this.setOn.bind(this)));
        return onService;
    }

    private initInformationService(): any {
        const informationService = this.accessory.getService(this.Service.AccessoryInformation);
        informationService
            .setCharacteristic(this.Characteristic.Name, this.getDisplayName())
            .setCharacteristic(this.Characteristic.Manufacturer, 'Sony Corporation')
            .setCharacteristic(this.Characteristic.Model, this.device.model)
            .setCharacteristic(this.Characteristic.SerialNumber, this.device.serial);
        if(this.device.info.systemVersion) {
            informationService.setCharacteristic(this.Characteristic.FirmwareRevision, this.device.info.systemVersion);
        }
        return informationService;
    }

    private initAppServices() {
        const allAppsRegistered = this._getAllAppServices(this.Service.Switch);
        const newServices = this.device.apps.map((config) => {
            const serviceType = _appIdToServiceType(config.id);
            const oldServiceIndex = allAppsRegistered.findIndex((service) => {
                return service.subtype === serviceType
            });
            if(oldServiceIndex !== -1) {
                allAppsRegistered.splice(oldServiceIndex, 1);
            }
            const appService = this.getService(this.Service.Switch, config.name, serviceType);
            const characteristic = appService.getCharacteristic(this.Characteristic.On);
            characteristic.on('get', callbackify(() => this.isRunningApp(config)));
            characteristic.on('set', callbackify((on: boolean) => this.setRunningApp(on, config)));
            return appService;
        });
        allAppsRegistered.forEach((service) => this.removeService(this.Service.Switch, service.subtype));
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

        var _isOn = this.device.info.status.code === 200;
        this.loggingService.addEntry({time: moment().unix(), status: _isOn});
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
                    appService.getCharacteristic(this.Characteristic.On).updateValue(false);
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
        this.log(`[${this.getDisplayName()}] Turn off`);
        if(updateOn === true) {
            this.onService.getCharacteristic(this.Characteristic.On).updateValue(false);
        }
        return Promise.resolve(true);
    }

    deviceDidTurnOn(updateOn?: boolean): Promise<boolean> {
        this.log(`[${this.getDisplayName()}] Turn on`);
        if(updateOn === true) {
            this.onService.getCharacteristic(this.Characteristic.On).updateValue(true);
        }
        return Promise.resolve(true);
    }

    private _getAllAppServices(serviceType): any[] {
        return this.getServices(serviceType, (service => {
            if(service.subtype === undefined) {
                return false;
            }
            return service.subtype.startsWith(PS4WakerAccessoryWrapper.APP_SERVICE_PREFIX);
        }));
    }

    private _getServiceFromRunningApp(runningApp?: RunningApp): any | undefined {
        if(runningApp !== undefined) {
            const serviceType = _appIdToServiceType(runningApp.id);
            return this.accessory.getServiceByUUIDAndSubType(this.Service.Switch, serviceType);
        }
        return undefined;
    }
}

function _appIdToServiceType(id: string): string {
    return `${PS4WakerAccessoryWrapper.APP_SERVICE_PREFIX}${id}Service`;
}