import {PS4WakerPlatformInfo, PS4WakerPlatform} from './ps4-waker-platform';
import {API} from 'homebridge';

export default function(homebridge: API) {
    homebridge.registerPlatform(PS4WakerPlatformInfo.plugin, PS4WakerPlatformInfo.name, PS4WakerPlatform);
}
