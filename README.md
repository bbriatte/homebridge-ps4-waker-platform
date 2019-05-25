# homebridge-ps4-waker-platform

[![npm version](https://badge.fury.io/js/homebridge-ps4-waker-platform.svg)](https://badge.fury.io/js/homebridge-ps4-waker-platform)

[PS4 Waker](https://github.com/dhleong/ps4-waker) plugin for [Homebridge](https://github.com/nfarina/homebridge)

This allows you to control your PS4 with HomeKit and Siri.

## Installation
1. Install homebridge using: npm install -g homebridge
2. Install this plugin using: npm install -g homebridge-ps4-waker-platform
3. Update your configuration file. See the sample below.

## Configuration
Example `config.json` with one PS4 accessories

```json
{
    "platform": Ps4WakerPlatform,
    "name": "PS4Waker",
    "accessories": [
      {
            "serial": "XXXXXXXXXXX",
            "model": "CUH-7016B"
        }
    ]
}
```

Example `config.json` to register 2 PS4

```json
{
    "platform": PPs4WakerPlatform
    "name": "PS4Waker",
    "accessories": [
        {
            "serial": "XXXXXXXXXXX",
            "model": "CUH-7016B",
            "ip": "192.168.0.20",
            "credentials": ".ps4-pro-wake.credentials.json"  
        },
        {
          "serial": "XXXXXXXXXXX",
          "model": "CUH-2015A",
          "ip": "192.168.0.22",
          "credentials": ".ps4-wake.credentials.json"
        }
    ],
    "global": {
        "timeout": 10000
    }
}
```

Example `config.json` for one PS4 and 2 apps:

```json
{
    "platform": Ps4Ps4WakerPlatform   "name": "PS4Waker",
    "accessories": [
        {
            "serial": "XXXXXXXXXXX",
            "model": "CUH-7016B",
            "apps": [
                {
                    "id": "CUSA07708",
                    "name": "Monster Hunter World"
                },
                {
                    "id": "CUSA07669_00",
                    "name": "Fortnite"
                }
            ]
        }
    ]
}
```

### Platform element
*Required fields*
* `platform`: Must always be **PS4WPs4WakerPlatform* `name`: The name you want to use to control the PS4 platform.

*Optional fields*
* `accessories`: Array of **Accessory element**
* `global`: Default configuration for all accessories. see **Global element**

### Accessory element
*Required fields*
* `serial`: The serial number of your PS4 
* `model`: The model name of your PS4

*Optional fields*
* `name`: The name you want to use to control the PS4.
* `ip`: Specific IP of your PS4, use this option when multiple PS4 are reachable on your network.
* `passCode`: The pass code to connect to your PS4 if necessary.
* `credentials`: The file path to the credentials.json **see [Documentation](https://github.com/dhleong/ps4-waker/wiki)**
* `apps`: Contains all apps action that you want to trigger using HomeKit on your device. Adds a switch for each app with the given name. see **App element**
* `timeout`: Timeout to access to your PS4. **Default: 5000ms**

### Global element
*Optional fields*
* `apps`: Contains all apps action that you want to trigger using HomeKit on all PS4 device. Adds a switch for each app with the given name. see **App element**
* `timeout`: Timeout to access all PS4 on your network. **Default: 5000ms**

 ### App element
 *Required fields*
 * `id`: The PS4 title id of your app
 * `name`: The app name used to be the Switch name on your Home.app