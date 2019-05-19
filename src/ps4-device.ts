import {AccessoryConfig, AppConfig, GlobalConfig} from './accessory-config';
import {Detector, Device} from 'ps4-waker';
import {ConnectionInfo, DeviceInfo} from './utils';

export interface PS4Device {
    readonly api: Device;
    readonly connectionInfo: ConnectionInfo;
    readonly apps: AppConfig[];
    readonly serial: string;
    readonly model: string;
    readonly timeout: number;
    info: DeviceInfo;
}

export interface DeviceOnOffListener {
    deviceDidTurnOff(updateOn?: boolean): Promise<boolean>;
    deviceDidTurnOn(updateOn?: boolean): Promise<boolean>;
}

export async function deviceFromConfig(accessoryConfig: AccessoryConfig, globalConfig: GlobalConfig): Promise<PS4Device> {
    return new Promise((resolve, reject) => {
        Detector.findWhen((deviceInfoRaw: any, connectionInfo: ConnectionInfo) => {
            return accessoryConfig.ip === undefined || connectionInfo.address === accessoryConfig.ip
        }, {
            timeout: accessoryConfig.timeout || globalConfig.timeout || 5000
        }, (err, deviceInfoRaw: any, connectionInfo: ConnectionInfo) => {
            if(err) {
                reject(err);
                return;
            }
            resolve(_createDevice(accessoryConfig, globalConfig, deviceInfoRaw, connectionInfo));
        });
    });
}

function _createDevice(accessoryConfig: AccessoryConfig, globalConfig: GlobalConfig, deviceInfoRaw: any, connectionInfo: ConnectionInfo): PS4Device {
    const api = new Device({
        address: connectionInfo.address,
        autoLogin: true,
        credentials: accessoryConfig.credentials,
        passCode: accessoryConfig.passCode
    });
    api.lastInfo = deviceInfoRaw;
    api.lastInfo.address = connectionInfo.address;
    return {
        api: api,
        info: new DeviceInfo(deviceInfoRaw),
        connectionInfo: connectionInfo,
        apps: _mergeAppConfigs(accessoryConfig.apps, globalConfig.apps),
        serial: accessoryConfig.serial,
        model: accessoryConfig.model,
        timeout: accessoryConfig.timeout || globalConfig.timeout || 5000
    }
}

function _mergeAppConfigs(accessoryApps?: AppConfig[], globalApps?: AppConfig[]): AppConfig[] {
    const res: AppConfig[] = [];
    const exists: (toFind: AppConfig) => (item: AppConfig) => boolean = (toFind: AppConfig) => {
        return (item: AppConfig) => item.id === toFind.id;
    };
    const setGames: (target: AppConfig[], src?: AppConfig[]) => void = (target: AppConfig[], src?: AppConfig[]) => {
        if(src !== undefined) {
            for(let i = 0; i < src.length; i++) {
                const find = target.findIndex(exists(src[i]));
                if(find === -1) {
                    target.push(src[i]);
                } else {
                    target[find] = src[i];
                }
            }
        }
    };
    setGames(res, globalApps);
    setGames(res, accessoryApps);
    return res;
}