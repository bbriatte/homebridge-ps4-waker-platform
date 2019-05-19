export class DeviceInfo {
    public readonly type: string;
    public readonly status: Status;
    public readonly host: HostInfo;
    public readonly deviceDiscoveryProtocolVersion: string;
    public readonly systemVersion: string;
    public readonly runningApp?: RunningApp;

    public constructor(raw: any) {
        this.type = raw.type;
        this.status = {
            name: raw.status,
            code: parseInt(raw.statusCode),
            full: raw.statusLine
        };
        this.host = {
            id: raw['host-id'],
            type: raw['host-type'],
            name: raw['host-name'],
            requestPort: parseInt(raw['host-request-port'])
        };
        this.deviceDiscoveryProtocolVersion = DeviceInfo.toVersionString(raw['device-discovery-protocol-version']);
        this.systemVersion = DeviceInfo.toVersionString(raw['system-version']);
        if(raw['running-app-name'] !== undefined && raw['running-app-titleid'] !== undefined) {
            this.runningApp = {
                id: raw['running-app-titleid'],
                name: raw['running-app-name']
            };
        }
    }

    private static toVersionString(versionNumber: string): string {
        let versionString = '';
        for(let i = 0; i < versionNumber.length - 1; i += 2) {
            const path = parseInt(versionNumber[i] + versionNumber[i + 1]);
            if(versionString.length !== 0) {
                versionString += '.';
            }
            versionString += path;
        }
        return versionString;
    }
}

export interface Status {
    readonly name: string;
    readonly code: number;
    readonly full: string;
}

export interface RunningApp {
    readonly id: string;
    readonly name: string;
}

export interface HostInfo {
    readonly id: string;
    readonly type: string;
    readonly name: string;
    readonly requestPort: number;
}

export interface ConnectionInfo {
    readonly address: string;
    readonly family: string;
    readonly port: number;
    readonly size: number;
}