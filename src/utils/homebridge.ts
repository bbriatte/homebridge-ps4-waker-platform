export interface Logger extends Function {
    readonly debug: Function;
    readonly info: Function;
    readonly warn: Function;
    readonly error: Function;
    readonly log: Function;
    readonly prefix: string;
}

export function callbackify(task: (...taskArgs: any[]) => Promise<any>): Function {
    return (...args: any[]) => {
        const onlyArgs: any[] = [];
        let callback: Function = undefined;

        for (const arg of args) {
            if (typeof arg === 'function') {
                callback = arg;
                break;
            }
            onlyArgs.push(arg);
        }
        if (!callback) {
            throw new Error("Missing callback parameter!");
        }
        task(...onlyArgs)
            .then((data: any) => callback(undefined, data))
            .catch((err: any) => callback(err))
    }
}

export class HomebridgeAccessory {
    public readonly log: Logger;
    public readonly homebridge: any;
    public readonly accessory: any;

    public constructor(log: Logger, accessory: any, homebridge: any) {
        this.log = log;
        this.accessory = accessory;
        this.homebridge = homebridge;
    }

    public getDisplayName(): string {
        return this.accessory.displayName;
    }

    public getService(serviceType: any, displayName: string, subType: string): any {
        const service = this.accessory.getServiceByUUIDAndSubType(serviceType, subType);
        if (!service) {
            return this.accessory.addService(serviceType, displayName, subType);
        } else if(service.displayName !== displayName) {
            const Characteristic = this.homebridge.hap.Characteristic;
            const nameCharacteristic = service.getCharacteristic(Characteristic.Name)
                || service.addCharacteristic(Characteristic.Name);
            nameCharacteristic.setValue(displayName);
            service.displayName = displayName;
        }
        return service;
    }

    public removeService(serviceType: any, subType: string) {
        const service = this.accessory.getServiceByUUIDAndSubType(serviceType, subType);
        if(service !== undefined) {
            this.accessory.removeService(service);
        }
    }
}