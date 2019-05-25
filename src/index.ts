import {PS4WakerPlatformInfo, PS4WakerPlatform} from './ps4-waker-platform';

export default function(homebridge: any) {
    homebridge.registerPlatform(PS4WakerPlatformInfo.plugin, PS4WakerPlatformInfo.name, PS4WakerPlatform, true);
}