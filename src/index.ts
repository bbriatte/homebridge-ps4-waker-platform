import {PS4Platform, HomebridgeInfo} from './ps4-platform';

export default function(homebridge: any) {
    homebridge.registerPlatform(HomebridgeInfo.plugin, HomebridgeInfo.name, PS4Platform, true);
}